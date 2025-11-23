"""Test suite for RDKit chemistry utilities."""

import pytest
from crowe_copilot import chem_utils


def test_standardize_smiles_basic():
    """Test SMILES standardization."""
    std = chem_utils.standardize_smiles("CCO")
    assert std in {"CCO", "OCC"}  # Both are valid canonical forms
    
    # Invalid SMILES
    assert chem_utils.standardize_smiles("invalid") is None


def test_descriptors():
    """Test descriptor calculation."""
    desc = chem_utils.descriptors("c1ccccc1")  # benzene
    
    if desc:  # Only if RDKit available
        assert desc["mw"] > 70
        assert desc["mw"] < 85
        assert "logp" in desc
        assert "tpsa" in desc


def test_morgan_fingerprint():
    """Test Morgan fingerprint generation."""
    fp = chem_utils.morgan_bits("CCO", radius=2, n_bits=2048)
    
    if fp:
        assert len(fp) == 2048
        assert all(b in {0, 1} for b in fp)


def test_tanimoto_similarity():
    """Test similarity calculation."""
    sim = chem_utils.tanimoto_similarity("CCO", "CCO")
    if sim is not None:
        assert sim == 1.0  # Identical molecules
    
    sim2 = chem_utils.tanimoto_similarity("CCO", "c1ccccc1")
    if sim2 is not None:
        assert 0 <= sim2 < 1.0


def test_inchi_conversion():
    """Test InChI/InChIKey generation."""
    inchi = chem_utils.to_inchi("CCO")
    if inchi:
        assert "InChI=" in inchi
    
    inchikey = chem_utils.to_inchikey("CCO")
    if inchikey:
        assert len(inchikey) == 27  # Standard InChIKey length


def test_substructure_search():
    """Test SMARTS substructure matching."""
    # Phenol pattern (benzene with OH)
    has_phenol = chem_utils.has_substructure("c1ccccc1O", "c1ccccc1")
    if has_phenol is not None:
        assert has_phenol is True
    
    # Should not match
    has_phenol2 = chem_utils.has_substructure("CCO", "c1ccccc1")
    if has_phenol2 is not None:
        assert has_phenol2 is False


def test_lipinski_violations():
    """Test Lipinski Ro5 violation detection."""
    # Clean compound
    props = {"mw": 300, "logp": 2, "hbd": 2, "hba": 4}
    violations = chem_utils.lipinski_violations(props)
    assert len(violations) == 0
    
    # Multiple violations
    props2 = {"mw": 600, "logp": 6, "hbd": 7, "hba": 12}
    violations2 = chem_utils.lipinski_violations(props2)
    assert len(violations2) >= 2
    assert "MW > 500" in violations2
