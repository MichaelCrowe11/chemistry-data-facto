"""Extended molecular descriptors using Mordred + RDKit."""

from __future__ import annotations

from typing import Dict, Optional, List, Set
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)

try:
    from mordred import Calculator, descriptors as mordred_descriptors
    from rdkit import Chem
    MORDRED_AVAILABLE = True
except ImportError:
    MORDRED_AVAILABLE = False
    Calculator = None
    mordred_descriptors = None

from .chem_utils import to_mol, RDKIT_AVAILABLE


class DescriptorCalculator:
    """High-performance descriptor calculator with caching."""
    
    def __init__(self, descriptor_set: str = "2D"):
        """
        Initialize calculator.
        
        Args:
            descriptor_set: "2D", "3D", or "all"
        """
        self.descriptor_set = descriptor_set
        self._calculator = None
        
        if MORDRED_AVAILABLE:
            calc = Calculator()
            
            if descriptor_set == "2D":
                # 2D descriptors only (faster, no conformer generation)
                calc.register(mordred_descriptors.ABC)
                calc.register(mordred_descriptors.ABCGG)
                calc.register(mordred_descriptors.AcidBase)
                calc.register(mordred_descriptors.Aromatic)
                calc.register(mordred_descriptors.AtomCount)
                calc.register(mordred_descriptors.Autocorrelation)
                calc.register(mordred_descriptors.BalabanJ)
                calc.register(mordred_descriptors.BaryszMatrix)
                calc.register(mordred_descriptors.BertzCT)
                calc.register(mordred_descriptors.BondCount)
                calc.register(mordred_descriptors.Charge)
                calc.register(mordred_descriptors.Chi)
                calc.register(mordred_descriptors.Constitutional)
                calc.register(mordred_descriptors.EState)
                calc.register(mordred_descriptors.ExtendedTopochemical)
                calc.register(mordred_descriptors.Framework)
                calc.register(mordred_descriptors.FragmentComplexity)
                calc.register(mordred_descriptors.HydrogenBond)
                calc.register(mordred_descriptors.InformationContent)
                calc.register(mordred_descriptors.KappaShapeIndex)
                calc.register(mordred_descriptors.Lipinski)
                calc.register(mordred_descriptors.McGowanVolume)
                calc.register(mordred_descriptors.MoeType)
                calc.register(mordred_descriptors.MolecularDistanceEdge)
                calc.register(mordred_descriptors.PathCount)
                calc.register(mordred_descriptors.Polarizability)
                calc.register(mordred_descriptors.RingCount)
                calc.register(mordred_descriptors.RotatableBond)
                calc.register(mordred_descriptors.SLogP)
                calc.register(mordred_descriptors.TopologicalCharge)
                calc.register(mordred_descriptors.TopologicalIndex)
                calc.register(mordred_descriptors.VdwVolumeABC)
                calc.register(mordred_descriptors.VertexAdjacency)
                calc.register(mordred_descriptors.WalkCount)
                calc.register(mordred_descriptors.Weight)
                calc.register(mordred_descriptors.WienerIndex)
                calc.register(mordred_descriptors.ZagrebIndex)
                
            elif descriptor_set == "3D":
                # 3D descriptors (requires conformer generation)
                calc.register(mordred_descriptors.GeometricalIndex)
                calc.register(mordred_descriptors.Gravitational)
                calc.register(mordred_descriptors.MomentOfInertia)
                calc.register(mordred_descriptors.RDF)
                calc.register(mordred_descriptors.WHIM)
                calc.register(mordred_descriptors.CPSA)
                
            else:  # "all"
                # All available descriptors
                calc.register(mordred_descriptors)
            
            self._calculator = calc
            logger.info(f"Mordred calculator initialized with {len(calc.descriptors)} descriptors")
    
    @lru_cache(maxsize=1000)
    def calculate(self, smiles: str) -> Optional[Dict[str, float]]:
        """
        Calculate all descriptors for a molecule.
        
        Args:
            smiles: SMILES string
        
        Returns:
            Dict of descriptor_name -> value, None for errors/missing
        """
        if not MORDRED_AVAILABLE or not RDKIT_AVAILABLE:
            logger.warning("Mordred or RDKit not available")
            return None
        
        mol = to_mol(smiles)
        if mol is None:
            return None
        
        try:
            # Calculate all descriptors
            result = self._calculator(mol)
            
            # Convert to dict, handling errors
            desc_dict = {}
            for desc, value in zip(self._calculator.descriptors, result):
                name = str(desc)
                # Handle Mordred error types
                if value is None or str(value).startswith("Error"):
                    desc_dict[name] = None
                else:
                    try:
                        desc_dict[name] = float(value)
                    except (ValueError, TypeError):
                        desc_dict[name] = None
            
            return desc_dict
            
        except Exception as e:
            logger.error(f"Error calculating Mordred descriptors for {smiles}: {e}")
            return None
    
    def calculate_subset(
        self, smiles: str, descriptor_names: List[str]
    ) -> Optional[Dict[str, float]]:
        """Calculate specific subset of descriptors."""
        all_desc = self.calculate(smiles)
        if all_desc is None:
            return None
        
        return {k: v for k, v in all_desc.items() if k in descriptor_names}
    
    def get_descriptor_names(self) -> List[str]:
        """Get list of all available descriptor names."""
        if self._calculator is None:
            return []
        return [str(d) for d in self._calculator.descriptors]
    
    def filter_valid(self, desc_dict: Dict[str, float]) -> Dict[str, float]:
        """Remove None/NaN/inf values from descriptor dict."""
        import math
        return {
            k: v
            for k, v in desc_dict.items()
            if v is not None and math.isfinite(v)
        }


# Curated descriptor sets for different use cases
ADME_DESCRIPTORS = [
    "MW",  # Molecular weight
    "nHBAcc",  # H-bond acceptors
    "nHBDon",  # H-bond donors
    "MLogP",  # LogP
    "TPSA",  # Topological polar surface area
    "nRot",  # Rotatable bonds
    "nAromAtom",  # Aromatic atoms
    "nAromBond",  # Aromatic bonds
    "fChar",  # Formal charge
    "nRing",  # Ring count
]

DRUG_LIKE_DESCRIPTORS = ADME_DESCRIPTORS + [
    "nHetero",  # Heteroatoms
    "nHeavyAtom",  # Heavy atoms
    "nSpiro",  # Spiro atoms
    "nBridgehead",  # Bridgehead atoms
    "nStereo",  # Stereocenters
    "SLogP",  # S-LogP
    "SMR",  # Molar refractivity
]

SHAPE_DESCRIPTORS = [
    "Kier1",  # Kier shape index 1
    "Kier2",  # Kier shape index 2  
    "Kier3",  # Kier shape index 3
    "Phi",  # Flexibility
    "ABCGG",  # Atom-bond connectivity
]

TOPOLOGICAL_DESCRIPTORS = [
    "BalabanJ",  # Balaban's J
    "BertzCT",  # Complexity
    "Zagreb1",  # Zagreb index 1
    "Zagreb2",  # Zagreb index 2
    "Diameter",  # Molecular diameter
    "Radius",  # Molecular radius
    "Petitjean",  # Petitjean index
]


def calculate_drug_likeness_score(desc: Dict[str, float]) -> Optional[float]:
    """
    Calculate drug-likeness score based on Lipinski and extended rules.
    
    Returns:
        Score 0-1 (1 = perfect drug-like, 0 = many violations)
    """
    violations = 0
    
    # Lipinski's Rule of Five
    if desc.get("MW", 0) > 500:
        violations += 1
    if desc.get("MLogP", 0) > 5:
        violations += 1
    if desc.get("nHBDon", 0) > 5:
        violations += 1
    if desc.get("nHBAcc", 0) > 10:
        violations += 1
    
    # Extended rules
    if desc.get("TPSA", 0) > 140:
        violations += 0.5
    if desc.get("nRot", 0) > 10:
        violations += 0.5
    if desc.get("nRing", 0) > 7:
        violations += 0.5
    
    # Score calculation
    max_violations = 6.5
    score = max(0, 1 - (violations / max_violations))
    return score


def calculate_lead_likeness_score(desc: Dict[str, float]) -> Optional[float]:
    """
    Calculate lead-likeness score (more restrictive than drug-likeness).
    
    Lead-like: MW 250-350, LogP 1-3, Rot ≤ 7, Rings ≤ 4
    """
    violations = 0
    
    mw = desc.get("MW", 0)
    if mw < 250 or mw > 350:
        violations += 1
    
    logp = desc.get("MLogP", 0)
    if logp < 1 or logp > 3:
        violations += 1
    
    if desc.get("nRot", 0) > 7:
        violations += 1
    
    if desc.get("nRing", 0) > 4:
        violations += 1
    
    score = max(0, 1 - (violations / 4))
    return score
