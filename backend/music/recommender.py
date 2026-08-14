# backend/music/recommender.py

import logging
from dataclasses import dataclass

import numpy as np
from django.conf import settings
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
from django.db import models

from .models import Track, StreamEvent

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

@dataclass
class RecommendationResult:
    """A ranked track with per-modality similarity scores for explainability."""
    track: Track
    score: float                    
    audio_similarity: float = 0.0   
    meta_similarity: float = 0.0    
    behav_similarity: float = 0.0   
    explanation_label: str = ""     

    def explanation(self) -> str:
        """Human-readable similarity explanation for the UI."""
        if self.explanation_label:
            return self.explanation_label
        scores = {
            "Similar sound":   self.audio_similarity,
            "Same listeners":  self.behav_similarity,
            "Same era / vibe": self.meta_similarity,
        }
        return max(scores, key=scores.get)


class GatingMLP:
    """
    Lightweight heuristic gate predicting (α, β, γ) fusion weights.
    """
    def __call__(
        self,
        stream_count: int,
        user_genre_entropy: float,
        query_intent: str = "discovery",
    ) -> tuple[float, float, float]:
        
        if query_intent == "audio_match":
            return (0.90, 0.05, 0.05)
        if query_intent == "behavioral_match":
            return (0.05, 0.15, 0.80)

        if stream_count < 1_000:
            α, β, γ = 0.65, 0.30, 0.05
        elif stream_count > 10_000_000:
            α, β, γ = 0.35, 0.25, 0.40
        elif user_genre_entropy < 1.5:
            α, β, γ = 0.30, 0.45, 0.25
        else:
            α, β, γ = 0.55, 0.15, 0.30

        return (α, β, γ)


_gating_mlp = GatingMLP()


def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a < 1e-9 or norm_b < 1e-9:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def _key_invariant_cosine(query_cens: np.ndarray, cand_cens: np.ndarray) -> float:
    best = -1.0
    for shift in range(settings.MUSIC_RECOMMENDATION_CHROMA_ROTATIONS):
        rotated = np.roll(cand_cens, shift)
        sim = _cosine(query_cens, rotated)
        if sim > best:
            best = sim
    return best


def _flatten_audio_bundle(bundle_dict: dict) -> np.ndarray:
    """
    Converts the stored audio_features dictionary into a single, flat
    numpy array. If neural features (MERT) are missing, we synthesize a
    flat vector out of the standard MIR features.
    """
    if not bundle_dict:
        return np.zeros(1)

    parts = []
    
    # 1. Neural
    if "mert_embedding" in bundle_dict and bundle_dict["mert_embedding"]:
        parts.append(bundle_dict["mert_embedding"])
        
    # 2. Base MIR features (Order must be strict)
    if "tonnetz" in bundle_dict and bundle_dict["tonnetz"]: parts.extend(bundle_dict["tonnetz"])
    if "chroma_cens" in bundle_dict and bundle_dict["chroma_cens"]: parts.extend(bundle_dict["chroma_cens"])
    if "hpss_vectors" in bundle_dict and bundle_dict["hpss_vectors"]: parts.extend(bundle_dict["hpss_vectors"])
    if "cyclic_tempogram" in bundle_dict and bundle_dict["cyclic_tempogram"]: parts.extend(bundle_dict["cyclic_tempogram"])
    if "ssm_fingerprint" in bundle_dict and bundle_dict["ssm_fingerprint"]: parts.extend(bundle_dict["ssm_fingerprint"])
    if "groove_vector" in bundle_dict and bundle_dict["groove_vector"]: parts.extend(bundle_dict["groove_vector"])
    if "onset_stats" in bundle_dict and bundle_dict["onset_stats"]: parts.extend(bundle_dict["onset_stats"])
    
    if not parts:
        return np.zeros(1)
        
    # Flatten everything
    flat = []
    for p in parts:
        if isinstance(p, (list, tuple)):
            flat.extend(p)
        elif isinstance(p, (int, float)):
            flat.append(p)
    return np.array(flat, dtype=np.float32)


def get_fallback_recommendations(limit: int | None = None, exclude_ids=None) -> list:
    limit = limit or settings.MUSIC_RECOMMENDATION_DEFAULT_LIMIT
    qs = Track.objects.select_related("artist", "album").all()
    
    results = []
    if exclude_ids:
        # Try to pull unplayed tracks first
        results = list(qs.exclude(id__in=exclude_ids).order_by("-listener_count", "-stream_count", "-created_at")[:limit])
    else:
        results = list(qs.order_by("-listener_count", "-stream_count", "-created_at")[:limit])
        
    # FIX: Pad with the most popular tracks if we haven't reached the limit.
    # This prevents the recommendations row from disappearing if a user has played most/all tracks.
    if len(results) < limit:
        needed = limit - len(results)
        # We must not duplicate what we already fetched in 'results'
        current_ids = {t.id for t in results}
        pad_qs = qs.exclude(id__in=current_ids).order_by("-listener_count", "-stream_count", "-created_at")
        results.extend(list(pad_qs[:needed]))
        
    return results


def _wrap_fallback(tracks: list) -> list[RecommendationResult]:
    return [
        RecommendationResult(
            track=t,
            score=0.0,
            explanation_label="Popular right now",
        )
        for t in tracks
        if isinstance(t, Track)
    ]


def get_recommendations_for_user(
    user,
    limit: int | None = None,
    query_intent: str = "discovery",
) -> list[RecommendationResult]:
    """
    Generate track recommendations for a user utilizing the Standardized
    Multi-Tower similarity engine.
    """
    limit = limit or settings.MUSIC_RECOMMENDATION_DEFAULT_LIMIT

    try:
        played_track_ids = set(
            StreamEvent.objects
            .filter(user=user)
            .values_list("track_id", flat=True)
        )

        recent_streams = (
            StreamEvent.objects
            .filter(user=user)
            .select_related("track")
            .order_by("-created_at")[:5] # Analyze the last 5 listened tracks
        )

        if not recent_streams:
            return _wrap_fallback(get_fallback_recommendations(limit, played_track_ids))

        # FEATURE ADDITION: Average Taste Profile (Mean Pooling)
        # Instead of just the last track, build a composite vector mapping the user's current vibe
        seed_vectors = []
        total_streams = getattr(recent_streams[0].track, "stream_count", 0) or 0
        
        for stream in recent_streams:
            vec = _flatten_audio_bundle(stream.track.audio_features)
            if vec.shape[0] > 1:
                seed_vectors.append(vec)
                
        if not seed_vectors:
            return _wrap_fallback(get_fallback_recommendations(limit, played_track_ids))

        # Assure feature shapes match and average them
        target_dim = seed_vectors[0].shape[0]
        valid_seeds = [v for v in seed_vectors if v.shape[0] == target_dim]
        if not valid_seeds:
            return _wrap_fallback(get_fallback_recommendations(limit, played_track_ids))
            
        seed_vector = np.mean(valid_seeds, axis=0)

        # Build candidate pool
        candidates = list(
            Track.objects
            .exclude(id__in=played_track_ids)
            .select_related("artist", "album")
        )

        candidate_ids = []
        candidate_vectors = []
        valid_candidates = []

        for track in candidates:
            vec = _flatten_audio_bundle(track.audio_features)
            if vec.shape[0] == seed_vector.shape[0]:
                candidate_ids.append(track.id)
                candidate_vectors.append(vec)
                valid_candidates.append(track)
                
        # Guard: Check candidate_vectors, not just candidates, to ensure ML has valid scaling shape
        if len(candidate_vectors) < settings.MUSIC_RECOMMENDATION_MIN_SIMILARITY_CANDIDATES:
            return _wrap_fallback(get_fallback_recommendations(limit, played_track_ids))

        # Standardize the feature space before computing distance
        matrix = np.vstack([seed_vector, *candidate_vectors])
        scaler = StandardScaler()
        scaled_matrix = scaler.fit_transform(matrix)
        
        scaled_seed = scaled_matrix[0].reshape(1, -1)
        scaled_candidates = scaled_matrix[1:]

        # Calculate similarity using scaled variables
        similarities = cosine_similarity(scaled_seed, scaled_candidates)[0]
        
        # Determine weighting gates
        alpha, beta, gamma = _gating_mlp(total_streams, 2.0, query_intent)

        # Sort and rerank
        top_indices = np.argsort(similarities)[::-1][:limit]
        
        results = []
        for idx in top_indices:
            track = valid_candidates[idx]
            sim_score = float(similarities[idx])
            
            results.append(
                RecommendationResult(
                    track=track,
                    score=alpha * sim_score,
                    audio_similarity=sim_score,
                    meta_similarity=0.0,
                    behav_similarity=0.0,
                    explanation_label="Based on your recent listening",
                )
            )

        # Pad with the new fallback logic if ML didn't find enough unique tracks
        if len(results) < limit:
            recommended_ids = {r.track.id for r in results}
            exclude = played_track_ids | recommended_ids
            pad = get_fallback_recommendations(limit - len(results), exclude)
            results.extend(_wrap_fallback(pad))

        return results

    except Exception as e:
        logger.error(f"Recommendation engine failed: {e}")
        return _wrap_fallback(get_fallback_recommendations(limit))