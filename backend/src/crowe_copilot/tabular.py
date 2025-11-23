"""Polars-first table schemas and utilities."""

from __future__ import annotations

import polars as pl
from typing import Dict, Type

# Schema definitions using Polars dtypes
COMPOUNDS: Dict[str, Type[pl.DataType]] = {
    "compound_id": pl.Utf8,
    "name": pl.Utf8,
    "smiles": pl.Utf8,
    "std_smiles": pl.Utf8,
    "source": pl.Categorical,
    "accession": pl.Utf8,
    "inchi": pl.Utf8,
    "inchikey": pl.Utf8,
    "formula": pl.Utf8,
    "mw": pl.Float64,
    "logp": pl.Float64,
    "tpsa": pl.Float64,
    "hbd": pl.Int64,
    "hba": pl.Int64,
    "rot_bonds": pl.Int64,
    "created_at": pl.Datetime,
}

ASSAYS: Dict[str, Type[pl.DataType]] = {
    "assay_id": pl.Utf8,
    "compound_id": pl.Utf8,
    "extract_id": pl.Utf8,
    "target_id": pl.Utf8,
    "assay_type": pl.Categorical,
    "readout": pl.Categorical,
    "value": pl.Float64,
    "unit": pl.Utf8,
    "n": pl.Int64,
    "std_dev": pl.Float64,
    "created_at": pl.Datetime,
}

MIXTURE_COMPONENTS: Dict[str, Type[pl.DataType]] = {
    "mixture_id": pl.Utf8,
    "compound_id": pl.Utf8,
    "w_w_percent": pl.Float64,
    "molar_ratio": pl.Float64,
    "est_uM": pl.Float64,
}

EXTRACTS: Dict[str, Type[pl.DataType]] = {
    "extract_id": pl.Utf8,
    "species": pl.Utf8,
    "part": pl.Utf8,
    "solvent": pl.Utf8,
    "yield_percent": pl.Float64,
    "mass_mg": pl.Float64,
    "created_at": pl.Datetime,
}

TARGETS: Dict[str, Type[pl.DataType]] = {
    "target_id": pl.Utf8,
    "name": pl.Utf8,
    "organism": pl.Utf8,
    "target_type": pl.Categorical,
    "created_at": pl.Datetime,
}


def ensure_compounds(df: pl.DataFrame) -> pl.DataFrame:
    """Cast DataFrame to compounds schema."""
    return df.select(
        *[pl.col(c).cast(t, strict=False).alias(c) for c, t in COMPOUNDS.items() if c in df.columns]
    )


def ensure_assays(df: pl.DataFrame) -> pl.DataFrame:
    """Cast DataFrame to assays schema."""
    return df.select(
        *[pl.col(c).cast(t, strict=False).alias(c) for c, t in ASSAYS.items() if c in df.columns]
    )


def ensure_mixture_components(df: pl.DataFrame) -> pl.DataFrame:
    """Cast DataFrame to mixture components schema."""
    return df.select(
        *[
            pl.col(c).cast(t, strict=False).alias(c)
            for c, t in MIXTURE_COMPONENTS.items()
            if c in df.columns
        ]
    )


def ensure_extracts(df: pl.DataFrame) -> pl.DataFrame:
    """Cast DataFrame to extracts schema."""
    return df.select(
        *[pl.col(c).cast(t, strict=False).alias(c) for c, t in EXTRACTS.items() if c in df.columns]
    )


def ensure_targets(df: pl.DataFrame) -> pl.DataFrame:
    """Cast DataFrame to targets schema."""
    return df.select(
        *[pl.col(c).cast(t, strict=False).alias(c) for c, t in TARGETS.items() if c in df.columns]
    )


def join_assay_compounds(
    assays_df: pl.DataFrame, compounds_df: pl.DataFrame, how: str = "left"
) -> pl.DataFrame:
    """Join assay results with compound information."""
    return assays_df.join(compounds_df, on="compound_id", how=how, suffix="_compound")


def pivot_assay_matrix(
    assays_df: pl.DataFrame, index_col: str = "compound_id", value_col: str = "value"
) -> pl.DataFrame:
    """
    Pivot assay results to wide format (compounds × assays matrix).
    
    Args:
        assays_df: Assay results DataFrame
        index_col: Column to use as row index (e.g., compound_id)
        value_col: Column to pivot (e.g., value, readout)
    
    Returns:
        Wide-format DataFrame
    """
    return assays_df.pivot(
        values=value_col, index=index_col, columns="assay_id", aggregate_function="mean"
    )
