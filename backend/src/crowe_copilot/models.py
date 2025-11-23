"""Core typed domain models for natural products and assays."""

from __future__ import annotations

from typing import Literal, Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl, field_validator
from .units import Q_, u

Confidence = Literal["high", "medium", "low"]
DataSource = Literal[
    "ChEMBL", "PubChem", "NPASS", "GNPS", "UNPD", "FooDB", "Literature", "Manual"
]
AssayType = Literal["binding", "functional", "cell_viability", "enzyme", "reporter", "antimicrobial"]
Readout = Literal["IC50", "EC50", "Ki", "Kd", "%Inhibition", "AUC", "MIC", "MBC", "GI50"]


class Evidence(BaseModel):
    """Evidence supporting a claim with provenance."""

    source: DataSource
    accession: str = Field(..., description="e.g., CHEMBL25, CID2244, DOI:10.1038/...")
    url: Optional[HttpUrl] = None
    assay_type: Optional[str] = None
    n: Optional[int] = Field(None, ge=1, description="Number of replicates")
    confidence: Confidence = "medium"
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Compound(BaseModel):
    """Chemical compound with identifiers and computed properties."""

    name: str
    identifiers: Dict[str, str] = Field(
        default_factory=dict, description="ChEMBL, PubChem, InChIKey, etc."
    )
    smiles: Optional[str] = None
    std_smiles: Optional[str] = Field(None, description="Standardized canonical SMILES")
    inchi: Optional[str] = None
    inchikey: Optional[str] = None
    formula: Optional[str] = None

    # Computed properties
    mw: Optional[float] = Field(None, ge=20, le=3000, description="Molecular weight (g/mol)")
    logp: Optional[float] = Field(None, ge=-5, le=10, description="Partition coefficient")
    tpsa: Optional[float] = Field(None, ge=0, le=400, description="Topological polar surface area (Ų)")
    hbd: Optional[int] = Field(None, ge=0, le=20, description="Hydrogen bond donors")
    hba: Optional[int] = Field(None, ge=0, le=30, description="Hydrogen bond acceptors")
    rot_bonds: Optional[int] = Field(None, ge=0, le=60, description="Rotatable bonds")
    
    # Metadata
    evidence: List[Evidence] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def lipinski_ro5_pass(self) -> Optional[bool]:
        """Check Lipinski's Rule of Five."""
        if None in [self.mw, self.logp, self.hbd, self.hba]:
            return None
        return (
            self.mw <= 500
            and self.logp <= 5
            and self.hbd <= 5
            and self.hba <= 10
        )


class Target(BaseModel):
    """Biological target (protein, pathway, cell line, organism)."""

    name: str
    identifiers: Dict[str, str] = Field(default_factory=dict, description="ChEMBL, UniProt, etc.")
    organism: Optional[str] = None
    target_type: Optional[str] = Field(
        None, description="protein, GPCR, enzyme, kinase, pathway, cell_line"
    )
    gene_names: List[str] = Field(default_factory=list)
    evidence: List[Evidence] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Extract(BaseModel):
    """Natural product extract with preparation details."""

    species: str = Field(..., description="Organism name (preferably binomial)")
    part: str = Field(..., description="fruiting body, mycelium, leaves, roots, etc.")
    solvent: str = Field(..., description="MeOH, EtOAc, H2O, etc.")
    conditions: Dict[str, Any] = Field(
        default_factory=dict, description="ratio, time_h, temp_C, pH, etc."
    )
    yield_percent: Optional[float] = Field(None, ge=0, le=100)
    mass_mg: Optional[float] = Field(None, ge=0, description="Extract mass obtained")
    evidence: List[Evidence] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Fraction(BaseModel):
    """Chromatographic or preparative fraction."""

    name: str
    method: str = Field(..., description="C18 SPE, HPLC, Flash, etc.")
    parent_extract_id: Optional[str] = None
    rt_min: Optional[float] = Field(None, ge=0, description="Retention time in minutes")
    wavelength_nm: Optional[int] = Field(None, ge=200, le=800, description="Detection wavelength")
    mass_mg: Optional[float] = Field(None, ge=0)
    evidence: List[Evidence] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AssayResult(BaseModel):
    """Single assay measurement with full context."""

    assay_id: str
    compound_id: Optional[str] = None
    extract_id: Optional[str] = None
    fraction_id: Optional[str] = None
    assay_type: AssayType
    target_id: Optional[str] = None
    readout: Readout
    value: float = Field(..., description="Numeric value in specified unit")
    unit: str = "uM"
    n: int = Field(default=3, ge=1, description="Number of replicates")
    std_dev: Optional[float] = Field(None, ge=0)
    conditions: Dict[str, Any] = Field(default_factory=dict, description="Assay-specific params")
    evidence: List[Evidence] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @field_validator("unit")
    @classmethod
    def _unit_ok(cls, v: str) -> str:
        """Validate unit with pint."""
        try:
            _ = Q_(1, v)
        except Exception as e:
            raise ValueError(f"Invalid unit '{v}': {e}")
        return v


class DoseResponseFit(BaseModel):
    """Fitted dose-response curve parameters."""

    model: Literal["4PL", "5PL"]
    top: float = Field(..., description="Maximum response")
    bottom: float = Field(..., description="Minimum response")
    ec50: float = Field(..., gt=0, description="Half-maximal effective concentration")
    hill: float = Field(..., description="Hill slope")
    asymmetry: Optional[float] = Field(None, description="5PL asymmetry parameter")
    r2: Optional[float] = Field(None, ge=0, le=1, description="Goodness of fit")
    ci95: Optional[Dict[str, List[float]]] = Field(
        None, description="95% confidence intervals {param: [low, high]}"
    )
    unit: str = "uM"
    data_points: int = Field(..., ge=3)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MixtureComponent(BaseModel):
    """Component of a mixture with composition."""

    compound_id: str
    w_w_percent: Optional[float] = Field(None, ge=0, le=100, description="Weight percent")
    molar_ratio: Optional[float] = Field(None, ge=0)
    est_uM: Optional[float] = Field(None, ge=0, description="Estimated concentration")


class Mixture(BaseModel):
    """Multi-component mixture (extract, formulation, co-treatment)."""

    name: str
    components: List[MixtureComponent]
    total_conc_uM: Optional[float] = Field(None, ge=0)
    evidence: List[Evidence] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def mass_balance_ok(self, tol: float = 2.0) -> bool:
        """Check if w/w percentages sum to ~100%."""
        parts = [c.w_w_percent for c in self.components if c.w_w_percent is not None]
        if not parts:
            return True
        return abs(sum(parts) - 100.0) <= tol


class Publication(BaseModel):
    """Research publication or dataset."""

    title: str
    authors: List[str] = Field(default_factory=list)
    doi: Optional[str] = None
    pmid: Optional[str] = None
    journal: Optional[str] = None
    year: Optional[int] = Field(None, ge=1800, le=2100)
    abstract: Optional[str] = None
    url: Optional[HttpUrl] = None
    zenodo_doi: Optional[str] = Field(None, description="Zenodo dataset DOI")
    orcid_contributors: List[str] = Field(default_factory=list, description="ORCID iDs")
    created_at: datetime = Field(default_factory=datetime.utcnow)
