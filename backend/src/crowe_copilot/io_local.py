"""Local file I/O utilities for safe data persistence."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable, Dict, Any, List, Optional
import json
import logging

logger = logging.getLogger(__name__)


def read_jsonl(path: Path) -> Iterable[Dict[str, Any]]:
    """
    Read JSONL file line by line.
    
    Args:
        path: Path to .jsonl file
    
    Yields:
        Dicts loaded from each line
    """
    with path.open("r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing line {line_num} in {path}: {e}")
                continue


def write_jsonl(path: Path, rows: Iterable[Dict[str, Any]]) -> int:
    """
    Write iterable of dicts to JSONL file.
    
    Args:
        path: Output .jsonl path
        rows: Iterable of JSON-serializable dicts
    
    Returns:
        Number of rows written
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
            count += 1
    
    logger.info(f"Wrote {count} rows to {path}")
    return count


def read_json(path: Path) -> Any:
    """Read JSON file."""
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, data: Any, indent: int = 2) -> None:
    """Write data to JSON file with pretty formatting."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=indent)
    logger.info(f"Wrote JSON to {path}")


def append_jsonl(path: Path, row: Dict[str, Any]) -> None:
    """Append single row to JSONL file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")


def list_data_files(directory: Path, pattern: str = "*.jsonl") -> List[Path]:
    """List all matching data files in directory."""
    if not directory.exists():
        return []
    return sorted(directory.glob(pattern))
