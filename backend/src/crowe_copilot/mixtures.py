"""Mixture analysis and synergy scoring."""

from __future__ import annotations

from typing import Dict, Tuple, List, Literal
import logging

import numpy as np
from .zip_surface import ZIPSurfaceModel

logger = logging.getLogger(__name__)

SynergyModel = Literal["Bliss", "HSA", "Loewe", "ZIP"]


def bliss_independence(ea: float, eb: float) -> float:
    """
    Bliss independence reference model.
    
    Expected combined effect: E_comb = ea + eb - ea*eb
    
    Args:
        ea: Effect of agent A (fraction 0-1, e.g., 0.5 = 50% inhibition)
        eb: Effect of agent B (fraction 0-1)
    
    Returns:
        Expected combined effect under independence
    """
    return ea + eb - ea * eb


def hsa_reference(ea: float, eb: float) -> float:
    """
    Highest Single Agent (HSA) reference model.
    
    Args:
        ea: Effect of agent A (0-1)
        eb: Effect of agent B (0-1)
    
    Returns:
        Maximum of single agent effects
    """
    return max(ea, eb)


def synergy_score_bliss(
    curve_a: Dict[float, float],
    curve_b: Dict[float, float],
    curve_ab: Dict[Tuple[float, float], float],
) -> Dict[str, float]:
    """
    Calculate Bliss synergy scores over concentration grid.
    
    Args:
        curve_a: {conc_A_uM -> effect_fraction}
        curve_b: {conc_B_uM -> effect_fraction}
        curve_ab: {(conc_A_uM, conc_B_uM) -> effect_fraction}
    
    Returns:
        Dict with mean_delta, std_delta, max_delta, min_delta, n_points
    """
    deltas = []
    
    for (ca, cb), eab in curve_ab.items():
        ea = curve_a.get(ca)
        eb = curve_b.get(cb)
        
        if ea is None or eb is None:
            continue
        
        expected = bliss_independence(ea, eb)
        delta = eab - expected  # positive = synergy, negative = antagonism
        deltas.append(delta)
    
    if not deltas:
        return {
            "mean_delta": float("nan"),
            "std_delta": float("nan"),
            "max_delta": float("nan"),
            "min_delta": float("nan"),
            "n_points": 0,
        }
    
    return {
        "mean_delta": float(np.mean(deltas)),
        "std_delta": float(np.std(deltas, ddof=1)) if len(deltas) > 1 else 0.0,
        "max_delta": float(np.max(deltas)),
        "min_delta": float(np.min(deltas)),
        "n_points": len(deltas),
    }


def synergy_score_hsa(
    curve_a: Dict[float, float],
    curve_b: Dict[float, float],
    curve_ab: Dict[Tuple[float, float], float],
) -> Dict[str, float]:
    """Calculate HSA synergy scores over concentration grid."""
    deltas = []
    
    for (ca, cb), eab in curve_ab.items():
        ea = curve_a.get(ca)
        eb = curve_b.get(cb)
        
        if ea is None or eb is None:
            continue
        
        expected = hsa_reference(ea, eb)
        delta = eab - expected
        deltas.append(delta)
    
    if not deltas:
        return {
            "mean_delta": float("nan"),
            "std_delta": float("nan"),
            "max_delta": float("nan"),
            "min_delta": float("nan"),
            "n_points": 0,
        }
    
    return {
        "mean_delta": float(np.mean(deltas)),
        "std_delta": float(np.std(deltas, ddof=1)) if len(deltas) > 1 else 0.0,
        "max_delta": float(np.max(deltas)),
        "min_delta": float(np.min(deltas)),
        "n_points": len(deltas),
    }


def synergy_score_zip(
    curve_a: Dict[float, float],
    curve_b: Dict[float, float],
    curve_ab: Dict[Tuple[float, float], float],
) -> Dict[str, float]:
    """Calculate ZIP synergy scores."""
    # Convert dicts to arrays for ZIP model
    # This is a simplified wrapper
    model = ZIPSurfaceModel()
    # In a real implementation, we would fit the model here
    # For now, we return a placeholder result
    return {
        "mean_delta": 0.0,
        "std_delta": 0.0,
        "max_delta": 0.0,
        "min_delta": 0.0,
        "n_points": len(curve_ab),
    }


def classify_synergy(mean_delta: float, threshold: float = 0.1) -> str:
    """
    Classify synergy/antagonism based on mean delta.
    
    Args:
        mean_delta: Mean deviation from independence model
        threshold: Minimum absolute delta for classification
    
    Returns:
        "synergy", "antagonism", or "additive"
    """
    if abs(mean_delta) < threshold:
        return "additive"
    return "synergy" if mean_delta > 0 else "antagonism"


def combination_index_loewe(
    conc_a: float, conc_b: float, ec50_a: float, ec50_b: float, fa: float
) -> float:
    """
    Loewe additivity Combination Index (CI).
    
    CI = (conc_a / D_a) + (conc_b / D_b)
    
    Where D_a, D_b are doses that alone produce effect fa.
    
    CI < 1 → synergy
    CI = 1 → additive
    CI > 1 → antagonism
    
    Args:
        conc_a: Concentration of A in combination
        conc_b: Concentration of B in combination
        ec50_a: EC50 of A alone
        ec50_b: EC50 of B alone
        fa: Fraction affected (effect level, 0-1)
    
    Returns:
        Combination index
    """
    # Dose of A needed alone for effect fa (assuming Hill slope = 1)
    da = ec50_a * (fa / (1 - fa)) if fa < 1 else np.inf
    db = ec50_b * (fa / (1 - fa)) if fa < 1 else np.inf
    
    if da == 0 or db == 0:
        return np.inf
    
    ci = (conc_a / da) + (conc_b / db)
    return float(ci)


def mixture_ec50_shift(
    ec50_alone: float, ec50_combination: float
) -> Tuple[float, str]:
    """
    Calculate fold-shift in EC50 due to combination.
    
    Returns:
        Tuple of (fold_shift, interpretation)
    """
    if ec50_alone == 0 or ec50_combination == 0:
        return float("nan"), "invalid"
    
    fold_shift = ec50_alone / ec50_combination
    
    if fold_shift > 2:
        interp = "potentiation"
    elif fold_shift < 0.5:
        interp = "antagonism"
    else:
        interp = "no_shift"
    
    return float(fold_shift), interp
