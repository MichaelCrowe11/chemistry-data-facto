"""Crowe Logic Mycology: a cultivation workbench on the Crowe workbench core.

Same skeleton as Crowe Science (local server, token gate, browser console, Crowe-model
agent loop) with a cultivation tool pack that reads the live Crowe Sense sensor rig.

Run:  python src/crowe_mycology.py serve [--port N] [--no-open]
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from crowe_sense import (  # noqa: E402
    CULT_DEFAULT_MODEL,
    CULT_MODELS,
    CULT_SYSTEM,
    CULT_TOOLS,
    cult_execute,
)
from crowe_sense import cult_execute as _cult_execute  # noqa: E402
from crowe_workbench import create_app, serve  # noqa: E402


def _register_sense_routes(app):
    @app.get("/api/v1/sense/snapshot")
    def sense_snapshot():
        # Reuse the live-telemetry tool that powers the agent.
        return _cult_execute("sense_now", {})


app = create_app(
    title="Crowe Logic Mycology",
    subtitle="Cultivation workbench. Reads your Crowe Sense rig, reasons on Crowe models.",
    system=CULT_SYSTEM,
    tools=CULT_TOOLS,
    execute_tool=cult_execute,
    models=CULT_MODELS,
    default_model=CULT_DEFAULT_MODEL,
    placeholder="e.g. How are my fruiting tents doing right now? Is tent-2 CO2 too high for fruiting?",
    footer="Sensors: Crowe Sense (live). Reasoning: Crowe model stack via Foundry gateway. No third-party hosted models.",
    dashboard_endpoint="/api/v1/sense/snapshot",
    on_app=_register_sense_routes,
)


if __name__ == "__main__":
    serve(app, "Crowe Logic Mycology")
