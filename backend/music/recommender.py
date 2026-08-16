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
    if exclude_ids:
        qs = qs.exclude(id__in=exclude_ids)
    return list(qs.order_by("-listener_count", "-stream_count", "-created_at")[:limit])


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

        last_stream = (
            StreamEvent.objects
            .filter(user=user)
            .select_related("track")
            .order_by("-created_at")
            .first()
        )

        if not last_stream:
            return _wrap_fallback(get_fallback_recommendations(limit, played_track_ids))

        seed_track = last_stream.track
        seed_vector = _flatten_audio_bundle(seed_track.audio_features)
        
        if seed_vector.shape[0] <= 1:
            return _wrap_fallback(get_fallback_recommendations(limit, played_track_ids))

        # Build candidate pool
        candidates = list(
            Track.objects
            .exclude(id__in=played_track_ids)
            .select_related("artist", "album")
        )

        if (
            len(candidates)
            < settings.MUSIC_RECOMMENDATION_MIN_SIMILARITY_CANDIDATES
        ):
            return _wrap_fallback(get_fallback_recommendations(limit, played_track_ids))

        candidate_ids = []
        candidate_vectors = []
        valid_candidates = []

        for track in candidates:
            vec = _flatten_audio_bundle(track.audio_features)
            if vec.shape[0] == seed_vector.shape[0]:
                candidate_ids.append(track.id)
                candidate_vectors.append(vec)
                valid_candidates.append(track)
                
        if not candidate_vectors:
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
        stream_count = getattr(seed_track, "stream_count", 0) or 0
        alpha, beta, gamma = _gating_mlp(stream_count, 2.0, query_intent)

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
                    explanation_label="Similar sound",
                )
            )

        if len(results) < limit:
            recommended_ids = {r.track.id for r in results}
            exclude = played_track_ids | recommended_ids
            pad = get_fallback_recommendations(limit - len(results), exclude)
            results.extend(_wrap_fallback(pad))

        return results

    except Exception as e:
        logger.error(f"Recommendation engine failed: {e}")
        return _wrap_fallback(get_fallback_recommendations(limit))
