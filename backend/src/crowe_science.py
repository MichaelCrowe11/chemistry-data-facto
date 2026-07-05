"""Crowe Science: a chemistry workbench on the Crowe workbench core.

Local token-gated server, browser console, and a Crowe-model agent loop over a
chemistry tool pack (RDKit + scipy). No third-party hosted models.

Run:  python src/crowe_science.py serve [--port N] [--no-open]
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from crowe_chem import (  # noqa: E402
    CHEM_DEFAULT_MODEL,
    CHEM_MODELS,
    CHEM_SYSTEM,
    CHEM_TOOLS,
    chem_execute,
)
from crowe_workbench import create_app, serve  # noqa: E402

app = create_app(
    title="Crowe Science",
    subtitle="Chemistry workbench. Real RDKit and pharmacology tools, reasoned on Crowe models.",
    system=CHEM_SYSTEM,
    tools=CHEM_TOOLS,
    execute_tool=chem_execute,
    models=CHEM_MODELS,
    default_model=CHEM_DEFAULT_MODEL,
    placeholder="e.g. Analyze caffeine, give its Lipinski profile, and compare it to theophylline.",
    footer="Engine: crowe_copilot (RDKit, scipy). Reasoning: Crowe model stack via Foundry gateway. No third-party hosted models.",
)


if __name__ == "__main__":
    serve(app, "Crowe Science")
