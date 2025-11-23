"""Registry of data source fetch functions (stubs for implementation)."""

from __future__ import annotations

from typing import Optional, Dict, Any, List
import logging

logger = logging.getLogger(__name__)


def fetch_compound_by_id(source: str, accession: str) -> Optional[Dict[str, Any]]:
    """
    Fetch compound data from external source.
    
    Signature for implementation. Caller should implement caching.
    
    Args:
        source: Data source name (ChEMBL, PubChem, etc.)
        accession: Compound accession/ID
    
    Returns:
        Normalized dict with: name, identifiers, smiles, std_smiles, inchikey, evidence
        Returns None if not found or error
    """
    logger.warning(f"fetch_compound_by_id stub called for {source}:{accession}")
    return None


def fetch_target_by_id(source: str, accession: str) -> Optional[Dict[str, Any]]:
    """
    Fetch biological target data from external source.
    
    Returns:
        Normalized dict with: name, identifiers, organism, target_type, evidence
    """
    logger.warning(f"fetch_target_by_id stub called for {source}:{accession}")
    return None


def fetch_assay_by_id(source: str, accession: str) -> Optional[Dict[str, Any]]:
    """
    Fetch assay data from external source.
    
    Returns:
        Normalized dict with: assay_id, assay_type, target_id, conditions, evidence
    """
    logger.warning(f"fetch_assay_by_id stub called for {source}:{accession}")
    return None


def search_compounds_by_name(name: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Search for compounds by name across data sources.
    
    Args:
        name: Compound name (partial match OK)
        limit: Max results to return
    
    Returns:
        List of compound dicts
    """
    logger.warning(f"search_compounds_by_name stub called for '{name}'")
    return []


def search_compounds_by_structure(
    smiles: str, similarity_threshold: float = 0.8, limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Search for similar compounds by structure.
    
    Args:
        smiles: Query SMILES
        similarity_threshold: Tanimoto threshold (0-1)
        limit: Max results
    
    Returns:
        List of dicts with: compound_data, similarity_score
    """
    logger.warning(f"search_compounds_by_structure stub called for '{smiles}'")
    return []


def normalize_assay_row(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map raw API response to canonical assay schema.
    
    Args:
        raw: Raw dict from API
    
    Returns:
        Normalized dict with: assay_id, assay_type, readout, value, unit, n, conditions
    """
    # Example normalization logic - customize per source
    return {
        "assay_id": raw.get("assay_id", raw.get("id", "unknown")),
        "assay_type": raw.get("type", "unknown"),
        "readout": raw.get("readout", "unknown"),
        "value": raw.get("value"),
        "unit": raw.get("unit", "uM"),
        "n": raw.get("n", 1),
        "conditions": raw.get("conditions", {}),
    }
