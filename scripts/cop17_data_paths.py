import glob
import os
from pathlib import Path

import pandas as pd


def resolve_data_root() -> Path:
    env_root = os.environ.get("COP17_DATA_ROOT")
    candidates = [
        Path(env_root) if env_root else None,
        Path(__file__).resolve().parents[2] / "COP17_Data",
        Path("/Users/erkardo/Desktop/COP17_Mongolia/COP17_Data"),
        Path("/Users/erkardo/Desktop/COP17_Data"),
    ]

    for candidate in candidates:
        if candidate and (candidate / "forcop17").exists():
            return candidate

    checked = [str(candidate) for candidate in candidates if candidate]
    raise FileNotFoundError(
        "COP17_Data root not found. Checked: " + ", ".join(checked)
    )


def resolve_schema_dir(schema: str) -> Path:
    return resolve_data_root() / "forcop17" / schema


def table_glob(schema: str, table: str) -> list[str]:
    base = resolve_schema_dir(schema)
    pattern = base / f"{schema}.{table}" / "1" / "*.parquet"
    return sorted(glob.glob(str(pattern)))


def read_table_frame(schema: str, table: str) -> pd.DataFrame:
    files = table_glob(schema, table)
    if not files:
        raise FileNotFoundError(f"Parquet table not found for {schema}.{table}")
    return pd.read_parquet(files[0])
