from __future__ import annotations
from typing import Dict, Any, Optional, Iterable
from pathlib import Path
import pyarrow as pa
import pyarrow.dataset as ds
import pyarrow.compute as pc
import polars as pl

# Canonical schemas (Arrow)
SCHEMAS: Dict[str, pa.schema] = {
    "compounds": pa.schema([
        ("compound_id", pa.string()),
        ("name", pa.string()),
        ("smiles", pa.string()),
        ("std_smiles", pa.string()),
        ("inchikey", pa.string()),
        ("source", pa.string()),
        ("accession", pa.string()),
        ("mw", pa.float64()),
        ("logp", pa.float64()),
        ("tpsa", pa.float64()),
        ("hbd", pa.int64()),
        ("hba", pa.int64()),
    ]),
    "assays": pa.schema([
        ("assay_id", pa.string()),
        ("compound_id", pa.string()),
        ("target_id", pa.string()),
        ("assay_type", pa.string()),
        ("readout", pa.string()),
        ("value", pa.float64()),
        ("unit", pa.string()),
        ("n", pa.int64()),
    ]),
    "spectra": pa.schema([
        ("spectrum_id", pa.string()),
        ("precursor_mz", pa.float64()),
        ("ionmode", pa.string()),
        ("charge", pa.int64()),
        ("inchikey", pa.string()),
        ("source", pa.string()),
        ("peaks_mz", pa.list_(pa.float64())),
        ("peaks_int", pa.list_(pa.float64())),
    ]),
    "kg_nodes": pa.schema([
        ("ntype", pa.string()),
        ("nid", pa.string()),
        # flexible attrs may be present; we validate required core fields only
    ]),
    "kg_edges": pa.schema([
        ("src_type", pa.string()),
        ("src_id", pa.string()),
        ("dst_type", pa.string()),
        ("dst_id", pa.string()),
        ("key", pa.string()),
        ("etype", pa.string()),
    ]),
}

def validate_table(name: str, table: pa.Table, strict: bool = False) -> None:
    """
    Validate that required fields in registry are present and of compatible type.
    If strict=True, exact type equality is required for registered fields.
    """
    sch = SCHEMAS[name]
    for field in sch:
        if field.name not in table.schema.names:
            raise ValueError(f"Missing required field '{field.name}' for schema '{name}'")
        dst = table.schema.field(field.name).type
        if strict and dst != field.type:
            raise TypeError(f"Field '{field.name}' has type {dst}, expected {field.type}")

def write_validated_parquet(name: str, df: pl.DataFrame, path: Path) -> None:
    table = df.to_arrow()
    validate_table(name, table, strict=False)
    path.parent.mkdir(parents=True, exist_ok=True)
    with pa.OSFile(str(path), "wb") as sink:
        pa.parquet.write_table(table, sink)

def open_dataset(path: Path, format: str = "parquet", partitioning: Optional[str] = "hive") -> ds.Dataset:
    return ds.dataset(str(path), format=format, partitioning=partitioning)

def scan_select_filter(
    dataset: ds.Dataset,
    columns: Optional[Iterable[str]] = None,
    filter_expr: Optional[Any] = None,  # pyarrow compute expression
    limit: Optional[int] = None,
) -> pl.DataFrame:
    scan = dataset.to_table(columns=columns, filter=filter_expr) if filter_expr else dataset.to_table(columns=columns)
    if limit is not None and limit > 0:
        scan = scan.slice(length=limit)
    return pl.from_arrow(scan)

def expr_eq(col: str, value: Any):
    return pc.equal(pc.field(col), pc.scalar(value))

def expr_in(col: str, values: Iterable[Any]):
    return pc.is_in(pc.field(col), value_set=pa.array(list(values)))
