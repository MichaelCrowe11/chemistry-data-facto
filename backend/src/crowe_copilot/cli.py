"""Command-line interface for compound standardization and analysis."""

from __future__ import annotations

from pathlib import Path
from typing import Optional, List
import sys
import json

import typer
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich import print as rprint
import polars as pl

app = typer.Typer(
    name="np-copilot",
    help="Natural Products Chemistry Intelligence CLI",
    add_completion=False,
)
console = Console()


@app.command()
def standardize(
    input_file: Path = typer.Argument(..., help="Input CSV/Excel file with SMILES column"),
    output_file: Path = typer.Argument(..., help="Output file (.csv, .xlsx, .jsonl)"),
    smiles_column: str = typer.Option("smiles", "--smiles-col", "-s", help="SMILES column name"),
    name_column: Optional[str] = typer.Option(None, "--name-col", "-n", help="Compound name column"),
    descriptors: bool = typer.Option(True, "--descriptors/--no-descriptors", help="Calculate descriptors"),
    mordred: bool = typer.Option(False, "--mordred/--no-mordred", help="Use Mordred (slow but comprehensive)"),
    parallel: bool = typer.Option(True, "--parallel/--sequential", help="Parallel processing"),
):
    """
    Standardize SMILES and compute molecular descriptors.
    
    Example:
        np-copilot standardize compounds.csv output.xlsx --mordred
    """
    from .chem_utils import standardize_smiles, descriptors as calc_descriptors, to_inchikey
    from .descriptors import DescriptorCalculator, DRUG_LIKE_DESCRIPTORS
    
    console.print(f"[bold blue]Loading data from {input_file}...[/bold blue]")
    
    # Load input
    if input_file.suffix == ".csv":
        df = pl.read_csv(input_file)
    elif input_file.suffix in {".xlsx", ".xls"}:
        df = pl.read_excel(input_file)
    else:
        console.print(f"[red]Unsupported input format: {input_file.suffix}[/red]")
        raise typer.Exit(1)
    
    if smiles_column not in df.columns:
        console.print(f"[red]SMILES column '{smiles_column}' not found in {input_file}[/red]")
        raise typer.Exit(1)
    
    console.print(f"[green]Loaded {len(df)} compounds[/green]")
    
    # Standardization
    results = []
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Standardizing compounds...", total=len(df))
        
        for row in df.iter_rows(named=True):
            smiles = row.get(smiles_column)
            name = row.get(name_column) if name_column else f"Compound_{len(results)+1}"
            
            if not smiles:
                progress.advance(task)
                continue
            
            result = {"original_smiles": smiles, "name": name}
            
            # Standardize
            std_smiles = standardize_smiles(smiles)
            result["std_smiles"] = std_smiles
            result["is_valid"] = std_smiles is not None
            
            if std_smiles:
                # InChIKey
                inchikey = to_inchikey(std_smiles)
                result["inchikey"] = inchikey
                
                # Descriptors
                if descriptors:
                    if mordred:
                        calc = DescriptorCalculator(descriptor_set="2D")
                        desc = calc.calculate(std_smiles)
                        if desc:
                            desc = calc.filter_valid(desc)
                            result.update(desc)
                    else:
                        desc = calc_descriptors(std_smiles)
                        if desc:
                            result.update(desc)
            
            results.append(result)
            progress.advance(task)
    
    # Create output DataFrame
    result_df = pl.DataFrame(results)
    
    # Write output
    console.print(f"[bold blue]Writing results to {output_file}...[/bold blue]")
    
    if output_file.suffix == ".csv":
        result_df.write_csv(output_file)
    elif output_file.suffix == ".xlsx":
        result_df.write_excel(output_file)
    elif output_file.suffix == ".jsonl":
        with output_file.open("w") as f:
            for row in result_df.iter_rows(named=True):
                f.write(json.dumps(row) + "\n")
    else:
        console.print(f"[red]Unsupported output format: {output_file.suffix}[/red]")
        raise typer.Exit(1)
    
    # Summary statistics
    valid_count = result_df.filter(pl.col("is_valid")).height
    
    table = Table(title="Standardization Summary")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="green")
    
    table.add_row("Total compounds", str(len(df)))
    table.add_row("Valid SMILES", str(valid_count))
    table.add_row("Invalid/Failed", str(len(df) - valid_count))
    table.add_row("Success rate", f"{100 * valid_count / len(df):.1f}%")
    
    console.print(table)
    console.print(f"[bold green]✓ Results saved to {output_file}[/bold green]")


@app.command()
def analyze(
    input_file: Path = typer.Argument(..., help="Input file with standardized compounds"),
    smiles_column: str = typer.Option("std_smiles", "--smiles-col", "-s"),
):
    """
    Analyze compound library (drug-likeness, diversity, etc.).
    """
    from .descriptors import (
        calculate_drug_likeness_score,
        calculate_lead_likeness_score,
        DescriptorCalculator,
    )
    
    console.print(f"[bold blue]Loading {input_file}...[/bold blue]")
    
    if input_file.suffix == ".csv":
        df = pl.read_csv(input_file)
    elif input_file.suffix in {".xlsx", ".xls"}:
        df = pl.read_excel(input_file)
    else:
        console.print(f"[red]Unsupported format[/red]")
        raise typer.Exit(1)
    
    # Calculate drug-likeness
    calc = DescriptorCalculator(descriptor_set="2D")
    
    scores = []
    for smiles in df[smiles_column]:
        if not smiles:
            scores.append(None)
            continue
        
        desc = calc.calculate(smiles)
        if desc:
            drug_score = calculate_drug_likeness_score(desc)
            lead_score = calculate_lead_likeness_score(desc)
            scores.append({"drug_like": drug_score, "lead_like": lead_score})
        else:
            scores.append(None)
    
    # Summary
    drug_scores = [s["drug_like"] for s in scores if s and s["drug_like"]]
    lead_scores = [s["lead_like"] for s in scores if s and s["lead_like"]]
    
    table = Table(title="Compound Library Analysis")
    table.add_column("Property", style="cyan")
    table.add_column("Mean", style="green")
    table.add_column("Median", style="yellow")
    
    import statistics
    
    if drug_scores:
        table.add_row(
            "Drug-likeness",
            f"{statistics.mean(drug_scores):.3f}",
            f"{statistics.median(drug_scores):.3f}",
        )
    
    if lead_scores:
        table.add_row(
            "Lead-likeness",
            f"{statistics.mean(lead_scores):.3f}",
            f"{statistics.median(lead_scores):.3f}",
        )
    
    console.print(table)


@app.command()
def fetch(
    source: str = typer.Argument(..., help="Data source: chembl, pubchem, npass"),
    query: str = typer.Argument(..., help="Search query or ID"),
    output: Optional[Path] = typer.Option(None, "--output", "-o", help="Output file"),
    limit: int = typer.Option(100, "--limit", "-l", help="Max results"),
):
    """
    Fetch compounds from external databases.
    
    Examples:
        np-copilot fetch chembl caffeine --limit 10
        np-copilot fetch pubchem "aspirin" -o aspirin.csv
    """
    console.print(f"[bold blue]Fetching from {source}...[/bold blue]")
    
    results = []
    
    if source.lower() == "chembl":
        try:
            from chembl_webresource_client.new_client import new_client
            
            molecule = new_client.molecule
            compounds = molecule.search(query)[:limit]
            
            for comp in compounds:
                results.append({
                    "chembl_id": comp.get("molecule_chembl_id"),
                    "name": comp.get("pref_name"),
                    "smiles": comp.get("molecule_structures", {}).get("canonical_smiles"),
                    "formula": comp.get("molecule_properties", {}).get("full_molecular_formula"),
                    "mw": comp.get("molecule_properties", {}).get("full_mwt"),
                })
        except ImportError:
            console.print("[red]chembl-webresource-client not installed[/red]")
            raise typer.Exit(1)
    
    elif source.lower() == "pubchem":
        try:
            import pubchempy as pcp
            
            compounds = pcp.get_compounds(query, "name", listkey_count=limit)
            
            for comp in compounds:
                results.append({
                    "pubchem_cid": comp.cid,
                    "name": comp.iupac_name or query,
                    "smiles": comp.canonical_smiles,
                    "formula": comp.molecular_formula,
                    "mw": comp.molecular_weight,
                })
        except ImportError:
            console.print("[red]pubchempy not installed[/red]")
            raise typer.Exit(1)
    
    else:
        console.print(f"[red]Unknown source: {source}[/red]")
        raise typer.Exit(1)
    
    if not results:
        console.print("[yellow]No results found[/yellow]")
        return
    
    # Display
    df = pl.DataFrame(results)
    console.print(df)
    
    # Save
    if output:
        df.write_csv(output)
        console.print(f"[green]✓ Saved to {output}[/green]")


@app.command()
def serve(
    host: str = typer.Option("0.0.0.0", "--host"),
    port: int = typer.Option(8000, "--port", "-p"),
    reload: bool = typer.Option(False, "--reload"),
):
    """Start FastAPI server."""
    import uvicorn
    from .api import app as fastapi_app
    
    console.print(f"[bold green]Starting server on {host}:{port}...[/bold green]")
    uvicorn.run("crowe_copilot.api:app", host=host, port=port, reload=reload)


@app.command()
def version():
    """Show version information."""
    from . import __version__
    
    console.print(f"[bold]np-copilot[/bold] version {__version__}")
    
    # Check dependencies
    deps = []
    try:
        import rdkit
        deps.append(("RDKit", rdkit.__version__))
    except ImportError:
        deps.append(("RDKit", "[red]NOT INSTALLED[/red]"))
    
    try:
        import mordred
        deps.append(("Mordred", mordred.__version__))
    except ImportError:
        deps.append(("Mordred", "[red]NOT INSTALLED[/red]"))
    
    try:
        import matchms
        deps.append(("matchms", matchms.__version__))
    except ImportError:
        deps.append(("matchms", "[red]NOT INSTALLED[/red]"))
    
    table = Table(title="Dependencies")
    table.add_column("Package")
    table.add_column("Version")
    
    for name, ver in deps:
        table.add_row(name, str(ver))
    
    console.print(table)


if __name__ == "__main__":
    app()
