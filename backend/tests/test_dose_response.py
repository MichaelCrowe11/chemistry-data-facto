"""Test suite for dose-response fitting."""

import pytest
import numpy as np

from crowe_copilot.dose_response import (
    four_pl,
    five_pl,
    fit_4pl,
    fit_5pl,
    auto_fit,
    calculate_ci95,
)


def test_4pl_function():
    """Test 4PL function evaluation."""
    x = np.array([0.1, 1, 10, 100])
    y = four_pl(x, top=100, bottom=0, ec50=10, hill=1.0)
    
    assert len(y) == 4
    assert y[2] == pytest.approx(50, abs=1)  # At EC50, response ~50%


def test_fit_4pl_perfect_data():
    """Test 4PL fit with synthetic perfect data."""
    # Generate perfect 4PL data
    x_true = np.logspace(-1, 3, 20)
    y_true = four_pl(x_true, top=100, bottom=0, ec50=10, hill=1.0)
    
    params, errs, r2 = fit_4pl(x_true, y_true)
    
    assert params["ec50"] == pytest.approx(10, rel=0.1)
    assert params["top"] == pytest.approx(100, rel=0.1)
    assert params["bottom"] == pytest.approx(0, abs=1)
    assert r2 > 0.99


def test_fit_4pl_noisy_data():
    """Test 4PL fit with noisy data."""
    np.random.seed(42)
    x = np.logspace(-1, 3, 15)
    y_clean = four_pl(x, top=100, bottom=5, ec50=20, hill=1.5)
    y_noisy = y_clean + np.random.normal(0, 5, size=len(y_clean))
    
    params, errs, r2 = fit_4pl(x, y_noisy)
    
    assert params["ec50"] > 0
    assert 0 <= r2 <= 1
    assert params["hill"] > 0


def test_fit_5pl():
    """Test 5PL fit."""
    np.random.seed(7)
    x = np.logspace(-1, 3, 20)
    y = five_pl(x, top=100, bottom=0, ec50=10, hill=1.0, asym=1.2)
    y_noisy = y + np.random.normal(0, 3, size=len(y))
    
    params, errs, r2 = fit_5pl(x, y_noisy)
    
    assert "asymmetry" in params
    assert params["ec50"] > 0
    assert r2 > 0.8


def test_auto_fit():
    """Test automatic model selection."""
    x = np.logspace(-1, 3, 12)
    y = four_pl(x, top=100, bottom=0, ec50=10, hill=1.0)
    
    model, params, errs, r2 = auto_fit(x, y, prefer="auto")
    
    assert model in {"4PL", "5PL"}
    assert params["ec50"] > 0
    assert r2 > 0.95


def test_calculate_ci95():
    """Test confidence interval calculation."""
    ci_low, ci_high = calculate_ci95(10.0, 0.5, n=10)
    
    assert ci_low < 10.0
    assert ci_high > 10.0
    assert ci_high - ci_low > 0


def test_fit_4pl_insufficient_data():
    """Test that fit fails with insufficient data points."""
    x = np.array([1, 10])  # Only 2 points
    y = np.array([20, 80])
    
    with pytest.raises(ValueError, match="at least 4 data points"):
        fit_4pl(x, y)
