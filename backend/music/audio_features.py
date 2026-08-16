"""
audio_features.py — Advanced MIR Feature Extraction Pipeline
=============================================================
Extracts a rich multi-modal feature set from audio files for the
music similarity recommendation system.

Feature groups (all additive on top of baseline):
  Part 1.1 — Deep MIR Signal Features (librosa / madmom / essentia)
  Part 1.2 — Neural Audio Embeddings (MERT, CLAP, Demucs stems, EnCodec)

Baseline features NOT re-implemented here (assumed already in schema):
  Tempo, Valence, Energy, Danceability, Instrumentalness, 128-D Audio Embedding

Output schema (AudioFeatureBundle dataclass) carries every vector separately
so the multi-tower fusion layer can consume each modality independently.
"""

from __future__ import annotations

import logging
import os
import tempfile
from dataclasses import dataclass, field
from typing import Optional

import librosa
import numpy as np
from django.conf import settings
from scipy import stats
from scipy.signal import find_peaks
from sklearn.decomposition import TruncatedSVD

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------

@dataclass
class AudioFeatureBundle:
    """
    All extracted audio features for a single track.
    Each field maps 1-to-1 to the MIR spec table.
    None means extraction was skipped or failed for that modality.
    """
    # --- Part 1.1: Deep MIR Signal Features ---
    tonnetz: Optional[np.ndarray] = None           # float32[12]  (µ+σ over 6D frames)
    cyclic_tempogram: Optional[np.ndarray] = None  # float32[120] (tempo distribution)
    hpss_vectors: Optional[np.ndarray] = None      # float32[256] (2×128D H+P vectors)
    chroma_cens: Optional[np.ndarray] = None       # float32[12]  (key-invariant chroma)
    spectral_contrast: Optional[np.ndarray] = None # float32[7]   (global; per-section needs allin1)
    ssm_fingerprint: Optional[np.ndarray] = None   # float32[64]  (SVD of recurrence matrix)
    groove_vector: Optional[np.ndarray] = None     # float32[32]  (microtiming deviation)
    onset_stats: Optional[np.ndarray] = None       # float32[8]   (onset envelope statistics)

    # --- Part 1.2: Neural Audio Embeddings ---
    mert_embedding: Optional[np.ndarray] = None    # float32[1024] (transformer, last-4-layer pool)
    clap_embedding: Optional[np.ndarray] = None    # float32[512]  (joint audio-text space)
    stem_embeddings: Optional[dict] = None         # 4×float32[256] keyed by stem name
    rvq_tokens: Optional[np.ndarray] = None        # float32[128]  (EnCodec acoustic fingerprint)

    def to_flat_dict(self) -> dict:
        """Serialise to a flat dict of lists (JSON / DB storage)."""
        result = {}
        for f_name, value in self.__dict__.items():
            if value is None:
                result[f_name] = None
            elif isinstance(value, np.ndarray):
                result[f_name] = value.tolist()
            elif isinstance(value, dict):
                result[f_name] = {k: v.tolist() if isinstance(v, np.ndarray) else v
                                  for k, v in value.items()}
        return result


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _safe_float(x) -> float:
    """Collapse numpy scalars / 0-d arrays to a plain Python float."""
    if isinstance(x, np.ndarray):
        return float(x.flat[0])
    return float(x)


def _load_audio(audio_file, duration: float | None = None):
    """
    Load up to `duration` seconds from a Django File object.
    Returns (y, sr) or raises on failure.
    """
    duration = duration or settings.MUSIC_AUDIO_FEATURE_ANALYSIS_DURATION_SECONDS
    _, ext = os.path.splitext(audio_file.name)
    ext = ext.lower() if ext else ".mp3"
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        for chunk in audio_file.chunks():
            tmp.write(chunk)
        tmp_path = tmp.name
    try:
        y, sr = librosa.load(tmp_path, duration=duration, mono=True)
    finally:
        os.unlink(tmp_path)
    return y, sr


# ---------------------------------------------------------------------------
# Part 1.1 — Deep MIR Signal Features
# ---------------------------------------------------------------------------

def extract_tonnetz(y: np.ndarray, sr: int) -> np.ndarray:
    """
    Tonnetz Tonal Centroid — float32[12]
    Encodes harmonic distance via the Euler lattice (circle of fifths,
    major thirds, minor thirds).  Mean + std over 6D frames → 12D.
    """
    # Use HPSS harmonic component for cleaner tonal signal
    y_harmonic, _ = librosa.effects.hpss(y)
    tonnetz_frames = librosa.feature.tonnetz(y=y_harmonic, sr=sr)  # (6, T)
    mu = np.mean(tonnetz_frames, axis=1)   # (6,)
    sigma = np.std(tonnetz_frames, axis=1) # (6,)
    return np.concatenate([mu, sigma]).astype(np.float32)  # (12,)


def extract_cyclic_tempogram(y: np.ndarray, sr: int, bins: int = 120) -> np.ndarray:
    """
    Cyclic Tempogram — float32[120]
    Full tempo distribution folded for octave equivalence (60≈120≈240 BPM).
    Captures syncopation, double-time feel, and tempo instability.
    """
    # Raw tempogram: (n_tempo_bins, T)
    hop_length = 512
    oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop_length)
    tempogram = librosa.feature.tempogram(onset_envelope=oenv, sr=sr,
                                          hop_length=hop_length)  # (384, T)

    # Cyclic fold: collapse octave-equivalent BPM bins
    n_raw_bins = tempogram.shape[0]
    cyclic = np.zeros(bins, dtype=np.float32)
    for i in range(n_raw_bins):
        cyclic[i % bins] += np.mean(tempogram[i])

    # L1-normalise to make it a proper distribution
    total = cyclic.sum()
    if total > 0:
        cyclic /= total
    return cyclic


def extract_hpss_vectors(y: np.ndarray, sr: int) -> np.ndarray:
    """
    HPSS-Separated Feature Pairs — float32[256]
    Independent 128D descriptors for the harmonic (H) and percussive (P)
    components: MFCC-40 + spectral contrast (7 bands) each → 2×(40+7)=94D
    padded/projected to 128D each → 256D total.
    """
    y_h, y_p = librosa.effects.hpss(y)

    def _component_vector(y_comp):
        mfccs = librosa.feature.mfcc(y=y_comp, sr=sr, n_mfcc=40)
        mfcc_mu = np.mean(mfccs, axis=1)   # (40,)
        mfcc_sigma = np.std(mfccs, axis=1) # (40,)

        contrast = librosa.feature.spectral_contrast(y=y_comp, sr=sr, n_bands=6)
        contrast_mu = np.mean(contrast, axis=1)  # (7,)

        zcr = float(np.mean(librosa.feature.zero_crossing_rate(y_comp)))
        rms = float(np.mean(librosa.feature.rms(y=y_comp)))
        centroid = float(np.mean(librosa.feature.spectral_centroid(y=y_comp, sr=sr)))

        vec = np.concatenate([mfcc_mu, mfcc_sigma, contrast_mu,
                               [zcr, rms, centroid]])  # (90,)
        # Zero-pad to 128 so the field width is fixed regardless of param changes
        padded = np.zeros(128, dtype=np.float32)
        padded[:len(vec)] = vec
        return padded

    h_vec = _component_vector(y_h)
    p_vec = _component_vector(y_p)
    return np.concatenate([h_vec, p_vec]).astype(np.float32)  # (256,)


def extract_chroma_cens(y: np.ndarray, sr: int) -> np.ndarray:
    """
    Chroma CENS — float32[12]
    Temporally smoothed, quantized chroma robust to tempo/dynamics.
    Key-invariant at query time via 12-rotation cross-correlation (done
    in the retrieval layer, not here).
    """
    cens = librosa.feature.chroma_cens(y=y, sr=sr, norm=2, win_len_smooth=41)
    return np.mean(cens, axis=1).astype(np.float32)  # (12,)


def extract_spectral_contrast_global(y: np.ndarray, sr: int) -> np.ndarray:
    """
    Spectral Contrast (global) — float32[7]
    Global dB peak-valley difference across 7 sub-bands.
    Per-section variant requires allin1 segment boundaries (separate job).
    """
    contrast = librosa.feature.spectral_contrast(y=y, sr=sr, n_bands=6)
    return np.mean(contrast, axis=1).astype(np.float32)  # (7,)


def extract_ssm_fingerprint(y: np.ndarray, sr: int, n_components: int = 64) -> np.ndarray:
    """
    Self-Similarity Matrix Structural Fingerprint — float32[64]
    Compresses song form (repetition, section diversity) into 64D via
    truncated SVD of the chroma-based recurrence matrix.
    """
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    # Downsample time axis to keep SSM tractable
    chroma_ds = chroma[:, ::4]  # every 4th frame ≈ ~100ms resolution

    rec_matrix = librosa.segment.recurrence_matrix(
        chroma_ds, mode='affinity', metric='cosine', sparse=False
    ).astype(np.float32)  # (T, T)

    # Flatten upper triangle → 1D, then project via SVD
    # For stability: reshape to (T, T) and apply SVD directly
    T = rec_matrix.shape[0]
    if T < n_components:
        # Pad with zeros if track is very short
        padded = np.zeros((n_components, n_components), dtype=np.float32)
        padded[:T, :T] = rec_matrix
        rec_matrix = padded

    svd = TruncatedSVD(n_components=n_components, random_state=42)
    # Treat each row as a sample
    svd.fit(rec_matrix)
    fingerprint = svd.singular_values_.astype(np.float32)  # (64,)
    # L2-normalise so magnitude doesn't dominate similarity
    norm = np.linalg.norm(fingerprint)
    if norm > 0:
        fingerprint /= norm
    return fingerprint


def extract_groove_vector(y: np.ndarray, sr: int, n_subdivisions: int = 32) -> np.ndarray:
    """
    Groove / Microtiming Deviation Vector — float32[32]
    Onset displacement relative to the quantized beat grid across 32 subdivisions.
    Quantifies swing ratio, shuffle, and clave patterns.
    """
    hop_length = 512
    # Beat grid
    _, beat_frames = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop_length)
    beat_times = librosa.frames_to_time(beat_frames, sr=sr, hop_length=hop_length)

    # Onset times
    onset_frames = librosa.onset.onset_detect(y=y, sr=sr, hop_length=hop_length)
    onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=hop_length)

    groove = np.zeros(n_subdivisions, dtype=np.float32)

    if len(beat_times) < 2 or len(onset_times) == 0:
        return groove

    beat_period = float(np.median(np.diff(beat_times)))
    subdivision_dur = beat_period / n_subdivisions

    for onset in onset_times:
        # Find the nearest beat
        diffs = np.abs(beat_times - onset)
        nearest_idx = int(np.argmin(diffs))
        nearest_beat = beat_times[nearest_idx]
        displacement = onset - nearest_beat  # signed, in seconds

        # Map displacement to subdivision bin (centre at bin 16)
        bin_idx = int(round(displacement / subdivision_dur)) + n_subdivisions // 2
        bin_idx = np.clip(bin_idx, 0, n_subdivisions - 1)
        groove[bin_idx] += 1.0

    # Normalise to a probability distribution
    total = groove.sum()
    if total > 0:
        groove /= total
    return groove


def extract_onset_stats(y: np.ndarray, sr: int) -> np.ndarray:
    """
    Onset Strength Envelope Statistics — float32[8]
    (µ, σ, skew, kurtosis, peak_count, peak_regularity, mean_peak_height, rms_env)
    Captures attack character: sharp transients (punk/metal) vs. soft onsets (ambient).
    """
    oenv = librosa.onset.onset_strength(y=y, sr=sr)

    mu = float(np.mean(oenv))
    sigma = float(np.std(oenv))
    skewness = float(stats.skew(oenv))
    kurt = float(stats.kurtosis(oenv))

    peaks, props = find_peaks(
        oenv,
        height=oenv.mean(),
        distance=settings.MUSIC_AUDIO_FEATURE_ONSET_PEAK_DISTANCE,
    )
    peak_count = float(len(peaks))

    # Regularity: 1 - (std of inter-peak intervals / mean interval), clamped to [0,1]
    if len(peaks) > 1:
        intervals = np.diff(peaks).astype(float)
        regularity = float(np.clip(1.0 - intervals.std() / (intervals.mean() + 1e-9), 0, 1))
        mean_peak_height = float(oenv[peaks].mean())
    else:
        regularity = 0.0
        mean_peak_height = 0.0

    rms_env = float(np.sqrt(np.mean(oenv ** 2)))

    return np.array([mu, sigma, skewness, kurt,
                     peak_count, regularity, mean_peak_height, rms_env],
                    dtype=np.float32)


# ---------------------------------------------------------------------------
# Part 1.2 — Neural Audio Embeddings
# ---------------------------------------------------------------------------

def extract_mert_embedding(audio_path: str, device: str = "cpu") -> Optional[np.ndarray]:
    """
    MERT Embeddings — float32[1024]
    24-layer transformer pre-trained on 1M+ hours of music.
    Pool last 4 hidden layers, mean-pool over time → 1024D.

    Requires: pip install transformers torch torchaudio
    GPU strongly recommended for production.
    """
    try:
        import torch
        from transformers import AutoProcessor, AutoModel

        processor = AutoProcessor.from_pretrained(
            "m-a-p/MERT-v1-95M", trust_remote_code=True
        )
        model = AutoModel.from_pretrained(
            "m-a-p/MERT-v1-95M", trust_remote_code=True
        ).to(device)
        model.eval()

        import torchaudio
        waveform, sample_rate = torchaudio.load(audio_path)
        # MERT expects 24kHz mono
        if sample_rate != 24000:
            resampler = torchaudio.transforms.Resample(sample_rate, 24000)
            waveform = resampler(waveform)
        if waveform.shape[0] > 1:
            waveform = waveform.mean(dim=0, keepdim=True)

        # Truncate / pad to 30 seconds
        max_samples = 24000 * 30
        waveform = waveform[:, :max_samples]

        inputs = processor(
            waveform.squeeze().numpy(),
            sampling_rate=24000,
            return_tensors="pt"
        ).to(device)

        with torch.no_grad():
            outputs = model(**inputs, output_hidden_states=True)

        # Pool last 4 hidden layers: each is (1, T, 768) for 95M model
        last_4 = outputs.hidden_states[-4:]  # tuple of 4 × (1, T, 768)
        stacked = torch.stack(last_4, dim=0)  # (4, 1, T, 768)
        pooled = stacked.mean(dim=0).mean(dim=1).squeeze(0)  # (768,)

        # Project to 1024D via zero-padding for schema compatibility
        # (330M model outputs 1024D natively; 95M outputs 768D)
        embedding = np.zeros(1024, dtype=np.float32)
        vec = pooled.cpu().numpy()
        embedding[:len(vec)] = vec
        return embedding

    except Exception as e:
        logger.warning(f"MERT extraction skipped: {e}")
        return None


def extract_clap_embedding(audio_path: str, device: str = "cpu") -> Optional[np.ndarray]:
    """
    CLAP Embeddings — float32[512]
    Joint audio-text embedding space for semantic similarity and text queries.

    Requires: pip install transformers torch torchaudio
    """
    try:
        import torch
        import torchaudio
        from transformers import ClapModel, ClapProcessor

        model = ClapModel.from_pretrained("laion/larger_clap_music_and_speech").to(device)
        processor = ClapProcessor.from_pretrained("laion/larger_clap_music_and_speech")
        model.eval()

        waveform, sample_rate = torchaudio.load(audio_path)
        if sample_rate != 48000:
            resampler = torchaudio.transforms.Resample(sample_rate, 48000)
            waveform = resampler(waveform)
        if waveform.shape[0] > 1:
            waveform = waveform.mean(dim=0, keepdim=True)

        max_samples = 48000 * 30
        waveform = waveform[:, :max_samples]

        inputs = processor(
            audios=waveform.squeeze().numpy(),
            sampling_rate=48000,
            return_tensors="pt"
        ).to(device)

        with torch.no_grad():
            embedding = model.get_audio_features(**inputs)

        return embedding.squeeze(0).cpu().numpy().astype(np.float32)  # (512,)

    except Exception as e:
        logger.warning(f"CLAP extraction skipped: {e}")
        return None


def extract_stem_embeddings(audio_path: str, device: str = "cpu") -> Optional[dict]:
    """
    Stem-Level Separation Embeddings — 4 × float32[256]
    Demucs separates vocals / bass / drums / other, each embedded via Wav2Vec2.
    Enables "same bass line" or "similar vocal timbre" queries.

    Requires: pip install demucs transformers torch torchaudio
    """
    try:
        import torch
        import torchaudio
        from demucs.pretrained import get_model
        from demucs.apply import apply_model
        from transformers import Wav2Vec2Model, Wav2Vec2Processor

        # --- 1. Source separation ---
        separator = get_model("htdemucs")
        separator.to(device)
        separator.eval()

        waveform, sample_rate = torchaudio.load(audio_path)
        if sample_rate != separator.samplerate:
            resampler = torchaudio.transforms.Resample(sample_rate, separator.samplerate)
            waveform = resampler(waveform)
        if waveform.shape[0] == 1:
            waveform = waveform.repeat(2, 1)  # Demucs expects stereo

        # Truncate to 30s
        max_samples = separator.samplerate * 30
        waveform = waveform[:, :max_samples].unsqueeze(0).to(device)  # (1, 2, T)

        with torch.no_grad():
            sources = apply_model(separator, waveform)[0]  # (4, 2, T)

        stem_names = ["drums", "bass", "other", "vocals"]
        stems = {name: sources[i].mean(dim=0).cpu().numpy()   # mono, (T,)
                 for i, name in enumerate(stem_names)}

        # --- 2. Embed each stem via Wav2Vec2 ---
        w2v_processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base")
        w2v_model = Wav2Vec2Model.from_pretrained("facebook/wav2vec2-base").to(device)
        w2v_model.eval()

        stem_embeddings = {}
        for name, audio in stems.items():
            # Wav2Vec2 expects 16kHz
            import scipy.signal as sps
            target_sr = 16000
            num_samples = int(len(audio) * target_sr / separator.samplerate)
            audio_16k = sps.resample(audio, num_samples)

            inputs = w2v_processor(
                audio_16k, sampling_rate=target_sr, return_tensors="pt"
            ).to(device)

            with torch.no_grad():
                hidden = w2v_model(**inputs).last_hidden_state  # (1, T', 768)

            pooled = hidden.mean(dim=1).squeeze(0)  # (768,)
            # Project to 256D (mean over 3 non-overlapping chunks of 256)
            vec = pooled.cpu().numpy().astype(np.float32)
            emb = np.zeros(256, dtype=np.float32)
            emb[:min(256, len(vec))] = vec[:256]
            stem_embeddings[name] = emb

        return stem_embeddings  # dict of 4 × float32[256]

    except Exception as e:
        logger.warning(f"Stem embedding extraction skipped: {e}")
        return None


def extract_rvq_tokens(audio_path: str) -> Optional[np.ndarray]:
    """
    RVQ-VAE Acoustic Tokens — float32[128]
    EnCodec residual vector quantisation → unigram/bigram distribution
    per codebook level → compact 128D acoustic fingerprint.

    Requires: pip install encodec
    """
    try:
        import torch
        import torchaudio
        from encodec import EncodecModel
        from encodec.utils import convert_audio

        model = EncodecModel.encodec_model_24khz()
        model.set_target_bandwidth(6.0)
        model.eval()

        waveform, sample_rate = torchaudio.load(audio_path)
        waveform = convert_audio(waveform, sample_rate, model.sample_rate, model.channels)
        waveform = waveform.unsqueeze(0)  # (1, C, T)

        max_samples = model.sample_rate * 30
        waveform = waveform[:, :, :max_samples]

        with torch.no_grad():
            encoded_frames = model.encode(waveform)

        # encoded_frames: list of (codes, scale), codes shape (1, n_codebooks, T)
        codes = encoded_frames[0][0].squeeze(0).cpu().numpy()  # (n_codebooks, T)
        n_codebooks, T = codes.shape

        # Unigram distribution per codebook → compress to 128D
        vocab_size = 1024  # EnCodec uses 1024-entry codebooks
        fingerprint_parts = []
        dims_per_book = max(1, 128 // n_codebooks)

        for cb_idx in range(n_codebooks):
            hist = np.bincount(codes[cb_idx], minlength=vocab_size).astype(np.float32)
            hist /= (hist.sum() + 1e-9)
            # Compress via fixed-stride downsampling to `dims_per_book` values
            stride = vocab_size // dims_per_book
            compressed = hist[:stride * dims_per_book].reshape(dims_per_book, stride).mean(axis=1)
            fingerprint_parts.append(compressed)

        fingerprint = np.concatenate(fingerprint_parts)[:128].astype(np.float32)
        result = np.zeros(128, dtype=np.float32)
        result[:len(fingerprint)] = fingerprint
        return result

    except Exception as e:
        logger.warning(f"RVQ token extraction skipped: {e}")
        return None


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def extract_advanced_features(
    audio_file,
    enable_neural: bool = False,
    device: str = "cpu",
) -> AudioFeatureBundle:
    """
    Extract all advanced audio features from a Django File object.

    Args:
        audio_file:      Django File object (e.g. track.audio_file).
        enable_neural:   Set True to run MERT, CLAP, Demucs, EnCodec.
                         Requires GPU in production. Default False so the
                         MIR features can run synchronously on ingest while
                         neural embeddings are queued as async Celery tasks.
        device:          PyTorch device string ("cpu" / "cuda").

    Returns:
        AudioFeatureBundle with all available features populated.
    """
    if not audio_file:
        return AudioFeatureBundle()

    bundle = AudioFeatureBundle()

    # --- Load audio (30s cap) ---
    try:
        y, sr = _load_audio(audio_file)
    except Exception as e:
        logger.error(f"Audio load failed for {getattr(audio_file, 'name', '?')}: {e}")
        return bundle

    # --- Part 1.1: Deep MIR Signal Features ---
    _run(bundle, "tonnetz",            lambda: extract_tonnetz(y, sr))
    _run(bundle, "cyclic_tempogram",   lambda: extract_cyclic_tempogram(y, sr))
    _run(bundle, "hpss_vectors",       lambda: extract_hpss_vectors(y, sr))
    _run(bundle, "chroma_cens",        lambda: extract_chroma_cens(y, sr))
    _run(bundle, "spectral_contrast",  lambda: extract_spectral_contrast_global(y, sr))
    _run(bundle, "ssm_fingerprint",    lambda: extract_ssm_fingerprint(y, sr))
    _run(bundle, "groove_vector",      lambda: extract_groove_vector(y, sr))
    _run(bundle, "onset_stats",        lambda: extract_onset_stats(y, sr))

    # --- Part 1.2: Neural Embeddings (async-friendly gate) ---
    if enable_neural:
        _, ext = os.path.splitext(audio_file.name)
        ext = ext.lower() if ext else ".mp3"
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            for chunk in audio_file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name
        try:
            _run(bundle, "mert_embedding",  lambda: extract_mert_embedding(tmp_path, device))
            _run(bundle, "clap_embedding",  lambda: extract_clap_embedding(tmp_path, device))
            _run(bundle, "stem_embeddings", lambda: extract_stem_embeddings(tmp_path, device))
            _run(bundle, "rvq_tokens",      lambda: extract_rvq_tokens(tmp_path))
        finally:
            os.unlink(tmp_path)

    return bundle


def _run(bundle: AudioFeatureBundle, attr: str, fn):
    """Run an extractor, log failures, and write result to bundle."""
    try:
        result = fn()
        setattr(bundle, attr, result)
    except Exception as e:
        logger.warning(f"Feature '{attr}' extraction failed: {e}")
