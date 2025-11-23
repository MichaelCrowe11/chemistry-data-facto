import polars as pl
import pyarrow as pa
from pathlib import Path
from crowe_copilot.pq_registry import SCHEMAS, validate_table, write_validated_parquet

def test_validate_and_write(tmp_path: Path):
    df = pl.DataFrame({"compound_id":["X"], "name":["x"], "smiles":["CCO"], "std_smiles":["CCO"],
                       "inchikey":["K"], "source":["test"], "accession":["A"],
                       "mw":[46.07], "logp":[-0.3], "tpsa":[20.0], "hbd":[1], "hba":[1]})
    out = tmp_path/"compounds.parquet"
    write_validated_parquet("compounds", df, out)
    assert out.exists()
