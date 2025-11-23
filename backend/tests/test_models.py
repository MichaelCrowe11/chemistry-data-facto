"""Test suite for core models."""

import pytest
from datetime import datetime

from crowe_copilot.models import (
    Compound,
    Evidence,
    Mixture,
    MixtureComponent,
    AssayResult,
    DoseResponseFit,
    Target,
    Extract,
    Publication,
)


def test_compound_minimal_ok():
    """Test minimal valid compound."""
    c = Compound(name="Caffeine", identifiers={"ChEMBL": "CHEMBL113", "PubChem": "CID2519"})
    assert "ChEMBL" in c.identifiers
    assert c.name == "Caffeine"
    assert c.created_at is not None


def test_compound_lipinski():
    """Test Lipinski Ro5 check."""
    c = Compound(
        name="Aspirin",
        identifiers={},
        mw=180.2,
        logp=1.2,
        hbd=1,
        hba=4,
    )
    assert c.lipinski_ro5_pass() is True
    
    # Violates MW
    c2 = Compound(name="BigMol", identifiers={}, mw=650, logp=3, hbd=2, hba=5)
    assert c2.lipinski_ro5_pass() is False


def test_evidence_confidence_enum():
    """Test evidence confidence levels."""
    e = Evidence(source="ChEMBL", accession="CHEMBL25")
    assert e.confidence in {"high", "medium", "low"}
    assert e.source == "ChEMBL"


def test_mixture_mass_balance():
    """Test mixture mass balance validation."""
    m = Mixture(
        name="MixA",
        components=[
            MixtureComponent(compound_id="CHEMBL1", w_w_percent=60),
            MixtureComponent(compound_id="CHEMBL2", w_w_percent=40),
        ],
    )
    assert m.mass_balance_ok()
    
    # Out of balance
    m2 = Mixture(
        name="MixB",
        components=[
            MixtureComponent(compound_id="CHEMBL1", w_w_percent=50),
            MixtureComponent(compound_id="CHEMBL2", w_w_percent=30),
        ],
    )
    assert not m2.mass_balance_ok(tol=1.0)


def test_assay_result_unit_validation():
    """Test unit validation with pint."""
    # Valid unit
    a = AssayResult(
        assay_id="A001",
        compound_id="C001",
        assay_type="binding",
        readout="IC50",
        value=5.2,
        unit="uM",
    )
    assert a.unit == "uM"
    
    # Invalid unit should raise
    with pytest.raises(ValueError):
        AssayResult(
            assay_id="A002",
            compound_id="C002",
            assay_type="binding",
            readout="IC50",
            value=5.2,
            unit="invalid_unit",
        )


def test_dose_response_fit():
    """Test dose-response fit model."""
    fit = DoseResponseFit(
        model="4PL",
        top=100.0,
        bottom=0.0,
        ec50=5.2,
        hill=1.0,
        r2=0.98,
        unit="uM",
        data_points=8,
    )
    assert fit.model == "4PL"
    assert fit.ec50 > 0
    assert 0 <= fit.r2 <= 1


def test_target():
    """Test biological target model."""
    t = Target(
        name="Adenosine A2A receptor",
        identifiers={"ChEMBL": "CHEMBL203", "UniProt": "P29274"},
        organism="Homo sapiens",
        target_type="GPCR",
    )
    assert t.target_type == "GPCR"
    assert "UniProt" in t.identifiers


def test_extract():
    """Test natural product extract model."""
    e = Extract(
        species="Ganoderma lucidum",
        part="fruiting body",
        solvent="MeOH",
        conditions={"ratio": 10.0, "time_h": 24, "temp_C": 25},
        yield_percent=12.5,
    )
    assert e.species == "Ganoderma lucidum"
    assert e.conditions["temp_C"] == 25


def test_publication():
    """Test publication model."""
    p = Publication(
        title="Natural Products in Drug Discovery",
        authors=["Smith J", "Doe J"],
        doi="10.1038/example",
        year=2024,
        zenodo_doi="10.5281/zenodo.123456",
        orcid_contributors=["0000-0001-2345-6789"],
    )
    assert len(p.authors) == 2
    assert p.zenodo_doi is not None
