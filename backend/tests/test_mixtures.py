"""Test suite for mixture analysis and synergy scoring."""

import pytest
from crowe_copilot.mixtures import (
    bliss_independence,
    hsa_reference,
    synergy_score_bliss,
    synergy_score_hsa,
    classify_synergy,
    combination_index_loewe,
    mixture_ec50_shift,
)


def test_bliss_independence():
    """Test Bliss independence calculation."""
    assert bliss_independence(0.5, 0.5) == pytest.approx(0.75)
    assert bliss_independence(0.0, 0.0) == 0.0
    assert bliss_independence(1.0, 1.0) == 1.0
    assert bliss_independence(0.3, 0.4) == pytest.approx(0.58)


def test_hsa_reference():
    """Test HSA reference model."""
    assert hsa_reference(0.5, 0.3) == 0.5
    assert hsa_reference(0.2, 0.8) == 0.8
    assert hsa_reference(0.0, 0.0) == 0.0


def test_synergy_score_bliss():
    """Test Bliss synergy scoring."""
    curve_a = {1.0: 0.2, 10.0: 0.5, 100.0: 0.8}
    curve_b = {1.0: 0.3, 10.0: 0.6, 100.0: 0.9}
    
    # Synergistic combination
    curve_ab = {
        (1.0, 1.0): 0.6,  # Expected: 0.2 + 0.3 - 0.06 = 0.44 → delta = +0.16
        (10.0, 10.0): 0.9,  # Expected: 0.5 + 0.6 - 0.3 = 0.8 → delta = +0.1
    }
    
    scores = synergy_score_bliss(curve_a, curve_b, curve_ab)
    
    assert scores["n_points"] == 2
    assert scores["mean_delta"] > 0  # Synergy
    assert "std_delta" in scores


def test_synergy_score_hsa():
    """Test HSA synergy scoring."""
    curve_a = {1.0: 0.3, 10.0: 0.6}
    curve_b = {1.0: 0.2, 10.0: 0.5}
    curve_ab = {(1.0, 1.0): 0.5, (10.0, 10.0): 0.8}  # Above max(ea, eb)
    
    scores = synergy_score_hsa(curve_a, curve_b, curve_ab)
    
    assert scores["mean_delta"] > 0


def test_classify_synergy():
    """Test synergy classification."""
    assert classify_synergy(0.15, threshold=0.1) == "synergy"
    assert classify_synergy(-0.15, threshold=0.1) == "antagonism"
    assert classify_synergy(0.05, threshold=0.1) == "additive"


def test_combination_index_loewe():
    """Test Loewe combination index."""
    # Additive: CI should be ~1
    ci = combination_index_loewe(
        conc_a=5, conc_b=10, ec50_a=10, ec50_b=20, fa=0.5
    )
    assert ci == pytest.approx(1.0, rel=0.1)
    
    # Synergistic: CI < 1
    ci_syn = combination_index_loewe(
        conc_a=2, conc_b=5, ec50_a=10, ec50_b=20, fa=0.5
    )
    assert ci_syn < 1.0


def test_mixture_ec50_shift():
    """Test EC50 shift calculation."""
    fold, interp = mixture_ec50_shift(ec50_alone=20, ec50_combination=5)
    
    assert fold == pytest.approx(4.0)
    assert interp == "potentiation"
    
    fold2, interp2 = mixture_ec50_shift(ec50_alone=10, ec50_combination=30)
    assert fold2 < 0.5
    assert interp2 == "antagonism"
    
    fold3, interp3 = mixture_ec50_shift(ec50_alone=10, ec50_combination=12)
    assert interp3 == "no_shift"


def test_synergy_empty_grid():
    """Test synergy scoring with empty data."""
    scores = synergy_score_bliss({}, {}, {})
    
    assert scores["n_points"] == 0
    assert scores["mean_delta"] != scores["mean_delta"]  # NaN check
