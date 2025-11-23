"""RDKit-based chemistry utilities for structure handling."""

from __future__ import annotations

from typing import Optional, Dict, List, Tuple
import logging

try:
    from rdkit import Chem
    from rdkit.Chem import AllChem, Descriptors, rdMolDescriptors
    from rdkit.Chem.MolStandardize import rdMolStandardize
    from rdkit import RDLogger
    
    # Suppress RDKit warnings
    RDLogger.DisableLog("rdApp.*")
    RDKIT_AVAILABLE = True
except ImportError:
    RDKIT_AVAILABLE = False
    Chem = None

logger = logging.getLogger(__name__)


def to_mol(smiles: str) -> Optional[object]:
    """Convert SMILES to RDKit Mol object."""
    if not RDKIT_AVAILABLE or not smiles:
        return None
    try:
        return Chem.MolFromSmiles(smiles)
    except Exception as e:
        logger.debug(f"Failed to parse SMILES '{smiles}': {e}")
        return None


def standardize_smiles(smiles: str) -> Optional[str]:
    """
    Standardize SMILES: remove salts, canonicalize tautomer, neutralize, return canonical SMILES.
    
    Returns None if invalid or RDKit unavailable.
    """
    if not RDKIT_AVAILABLE:
        logger.warning("RDKit not available for SMILES standardization")
        return None
    
    mol = to_mol(smiles)
    if mol is None:
        return None
    
    try:
        # Clean up (remove salts, normalize)
        params = rdMolStandardize.CleanupParameters()
        mol = rdMolStandardize.Cleanup(mol, params)
        
        # Canonicalize tautomer
        te = rdMolStandardize.TautomerEnumerator()
        mol = te.Canonicalize(mol)
        
        # Neutralize charges
        uncharger = rdMolStandardize.Uncharger()
        mol = uncharger.uncharge(mol)
        
        # Return canonical SMILES
        return Chem.MolToSmiles(mol, canonical=True)
    except Exception as e:
        logger.error(f"Error standardizing SMILES '{smiles}': {e}")
        return None


def to_inchi(smiles: str) -> Optional[str]:
    """Convert SMILES to InChI."""
    if not RDKIT_AVAILABLE:
        return None
    mol = to_mol(smiles)
    if not mol:
        return None
    try:
        return Chem.MolToInchi(mol)
    except:
        return None


def to_inchikey(smiles: str) -> Optional[str]:
    """Convert SMILES to InChIKey."""
    if not RDKIT_AVAILABLE:
        return None
    mol = to_mol(smiles)
    if not mol:
        return None
    try:
        return Chem.MolToInchiKey(mol)
    except:
        return None


def descriptors(smiles: str) -> Optional[Dict[str, float]]:
    """
    Compute lightweight molecular descriptors for triage.
    
    Returns dict with: mw, logp, tpsa, hbd, hba, rot_bonds
    """
    if not RDKIT_AVAILABLE:
        return None
    
    mol = to_mol(smiles)
    if not mol:
        return None
    
    try:
        return {
            "mw": Descriptors.MolWt(mol),
            "logp": Descriptors.MolLogP(mol),
            "tpsa": rdMolDescriptors.CalcTPSA(mol),
            "hbd": rdMolDescriptors.CalcNumHBD(mol),
            "hba": rdMolDescriptors.CalcNumHBA(mol),
            "rot_bonds": rdMolDescriptors.CalcNumRotatableBonds(mol),
        }
    except Exception as e:
        logger.error(f"Error computing descriptors for '{smiles}': {e}")
        return None


def morgan_bits(smiles: str, radius: int = 2, n_bits: int = 2048) -> Optional[List[int]]:
    """
    Generate Morgan fingerprint as bit vector.
    
    Returns list of 0/1 integers of length n_bits.
    """
    if not RDKIT_AVAILABLE:
        return None
    
    mol = to_mol(smiles)
    if not mol:
        return None
    
    try:
        fp = AllChem.GetMorganFingerprintAsBitVect(mol, radius, nBits=n_bits)
        return [int(b) for b in fp.ToBitString()]
    except Exception as e:
        logger.error(f"Error generating fingerprint for '{smiles}': {e}")
        return None


def tanimoto_similarity(smiles1: str, smiles2: str, radius: int = 2) -> Optional[float]:
    """Calculate Tanimoto similarity between two SMILES using Morgan fingerprints."""
    if not RDKIT_AVAILABLE:
        return None
    
    fp1 = morgan_bits(smiles1, radius=radius)
    fp2 = morgan_bits(smiles2, radius=radius)
    
    if not fp1 or not fp2:
        return None
    
    # Tanimoto coefficient
    intersection = sum(a and b for a, b in zip(fp1, fp2))
    union = sum(a or b for a, b in zip(fp1, fp2))
    
    return intersection / union if union > 0 else 0.0


def has_substructure(smiles: str, smarts: str) -> Optional[bool]:
    """Check if molecule contains substructure defined by SMARTS pattern."""
    if not RDKIT_AVAILABLE:
        return None
    
    mol = to_mol(smiles)
    patt = Chem.MolFromSmarts(smarts) if smarts else None
    
    if not mol or not patt:
        return None
    
    try:
        return mol.HasSubstructMatch(patt)
    except Exception as e:
        logger.error(f"Error checking substructure '{smarts}' in '{smiles}': {e}")
        return None


def murcko_scaffold(smiles: str) -> Optional[str]:
    """Extract Bemis-Murcko scaffold."""
    if not RDKIT_AVAILABLE:
        return None
    
    mol = to_mol(smiles)
    if not mol:
        return None
    
    try:
        from rdkit.Chem.Scaffolds import MurckoScaffold
        scaffold = MurckoScaffold.GetScaffoldForMol(mol)
        return Chem.MolToSmiles(scaffold) if scaffold else None
    except Exception as e:
        logger.error(f"Error extracting scaffold from '{smiles}': {e}")
        return None


def lipinski_violations(props: Dict[str, float]) -> List[str]:
    """
    Check Lipinski's Rule of Five violations.
    
    Args:
        props: Dict with mw, logp, hbd, hba keys
    
    Returns:
        List of violation descriptions
    """
    violations = []
    
    if props.get("mw", 0) > 500:
        violations.append("MW > 500")
    if props.get("logp", 0) > 5:
        violations.append("LogP > 5")
    if props.get("hbd", 0) > 5:
        violations.append("HBD > 5")
    if props.get("hba", 0) > 10:
        violations.append("HBA > 10")
    
    return violations
