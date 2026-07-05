"""Crowe Science agent: chat over the chemistry engine, powered by Crowe models only.

Routes through the Foundry Agent Gateway (OpenAI-compatible) to the Crowe/CroweLM
model stack: deepseek-v4-pro, crowenimbus, teeai. No Anthropic or OpenAI-hosted
models are used. The agent calls the real crowe_copilot engine (RDKit + scipy
pharmacology) as function tools.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import httpx
import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel

from crowe_copilot import chem_utils, dose_response

ALLOWED_MODELS = {"deepseek-v4-pro", "crowenimbus", "teeai"}
DEFAULT_MODEL = os.getenv("CROWE_SCIENCE_MODEL", "deepseek-v4-pro")


def _secret(name: str) -> str | None:
    """Read a value from the environment, falling back to ~/.env.secrets."""
    v = os.getenv(name)
    if v:
        return v
    try:
        for line in (Path.home() / ".env.secrets").read_text().splitlines():
            s = line.strip()
            if s.startswith("export "):
                s = s[7:]
            if s.startswith(name + "="):
                return s.split("=", 1)[1].strip().strip('"').strip("'")
    except Exception:
        pass
    return None


GATEWAY_URL = (_secret("FOUNDRY_GATEWAY_URL") or "").rstrip("/")
GATEWAY_KEY = _secret("CROWE_SCIENCE_GATEWAY_KEY") or _secret("FOUNDRY_GATEWAY_ADMIN_KEY")

SYSTEM = (
    "You are Crowe Science, a chemistry research assistant focused on natural products "
    "and medicinal fungi. You are backed by real tools (RDKit cheminformatics and scipy "
    "pharmacology). For any structural, physicochemical, similarity, or dose-response "
    "question, call the appropriate tool rather than estimating from memory, then report "
    "exactly what the tool returned with honest caveats. Keep compound claims non-clinical: "
    "describe bioactivity of research interest, never therapeutic effect. "
    "Write in plain editorial prose: no emojis, no em dashes, no marketing language. Use short "
    "paragraphs and compact tables, and report numbers with their units."
)

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "analyze_compound",
            "description": "Standardize a SMILES and compute RDKit descriptors (MW, logP, TPSA, "
            "H-bond donors/acceptors, rotatable bonds), Lipinski violations, InChIKey, and the "
            "Bemis-Murcko scaffold.",
            "parameters": {
                "type": "object",
                "properties": {"smiles": {"type": "string", "description": "SMILES string"}},
                "required": ["smiles"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "compare_compounds",
            "description": "Tanimoto similarity between two molecules using Morgan fingerprints.",
            "parameters": {
                "type": "object",
                "properties": {
                    "smiles1": {"type": "string"},
                    "smiles2": {"type": "string"},
                    "radius": {"type": "integer", "description": "Morgan radius, default 2"},
                },
                "required": ["smiles1", "smiles2"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "substructure_match",
            "description": "Check whether a molecule (SMILES) contains a SMARTS substructure pattern.",
            "parameters": {
                "type": "object",
                "properties": {"smiles": {"type": "string"}, "smarts": {"type": "string"}},
                "required": ["smiles", "smarts"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "fit_dose_response",
            "description": "Fit a 4-parameter logistic (4PL) dose-response curve. Returns EC50/IC50 "
            "(potency, in the concentration units provided), Hill slope, top and bottom plateaus, "
            "and R-squared.",
            "parameters": {
                "type": "object",
                "properties": {
                    "concentrations_uM": {"type": "array", "items": {"type": "number"}},
                    "responses": {"type": "array", "items": {"type": "number"}},
                },
                "required": ["concentrations_uM", "responses"],
            },
        },
    },
]


def _jsonable(x):
    if isinstance(x, np.floating):
        return float(x)
    if isinstance(x, np.integer):
        return int(x)
    if isinstance(x, np.ndarray):
        return x.tolist()
    if isinstance(x, dict):
        return {k: _jsonable(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [_jsonable(v) for v in x]
    return x


def execute_tool(name: str, args: dict) -> dict:
    try:
        if name == "analyze_compound":
            s = args["smiles"]
            desc = chem_utils.descriptors(s)
            return {
                "input_smiles": s,
                "standardized_smiles": chem_utils.standardize_smiles(s),
                "inchikey": chem_utils.to_inchikey(s),
                "descriptors": desc,
                "lipinski_violations": chem_utils.lipinski_violations(desc) if desc else [],
                "murcko_scaffold": chem_utils.murcko_scaffold(s),
            }
        if name == "compare_compounds":
            r = int(args.get("radius", 2))
            return {
                "tanimoto": chem_utils.tanimoto_similarity(args["smiles1"], args["smiles2"], radius=r),
                "method": f"Morgan_r{r}",
            }
        if name == "substructure_match":
            return {"has_substructure": chem_utils.has_substructure(args["smiles"], args["smarts"])}
        if name == "fit_dose_response":
            x = np.asarray(args["concentrations_uM"], dtype=float)
            y = np.asarray(args["responses"], dtype=float)
            params, errs, r2 = dose_response.fit_4pl(x, y)
            return {"fit": "4PL", "parameters": params, "std_errors": errs, "r_squared": r2}
        return {"error": f"unknown tool: {name}"}
    except Exception as e:  # keep the agent loop alive; surface the error to the model
        return {"error": f"{type(e).__name__}: {e}"}


def _gateway_chat(model: str, messages: list, tools=None) -> dict:
    payload = {"model": model, "messages": messages, "max_tokens": 1500}
    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = "auto"
    resp = httpx.post(
        f"{GATEWAY_URL}/v1/chat/completions",
        headers={"Authorization": f"Bearer {GATEWAY_KEY}", "Content-Type": "application/json"},
        json=payload,
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]


router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    history: list = []
    model: str | None = None


@router.get("/api/v1/agent/info")
def info():
    return {
        "gateway_configured": bool(GATEWAY_URL and GATEWAY_KEY),
        "default_model": DEFAULT_MODEL,
        "models": sorted(ALLOWED_MODELS),
        "tools": [t["function"]["name"] for t in TOOLS],
    }


@router.post("/api/v1/agent/chat")
def chat(req: ChatRequest):
    if not (GATEWAY_URL and GATEWAY_KEY):
        return {"reply": "Crowe gateway not configured (FOUNDRY_GATEWAY_URL / key missing).", "trace": []}
    model = req.model if req.model in ALLOWED_MODELS else DEFAULT_MODEL
    messages = [{"role": "system", "content": SYSTEM}] + list(req.history) + [
        {"role": "user", "content": req.message}
    ]
    trace: list = []
    try:
        for _ in range(6):
            msg = _gateway_chat(model, messages, TOOLS)
            tool_calls = msg.get("tool_calls")
            if tool_calls:
                # content must be null (not "") on tool-call turns: an empty string
                # breaks the gateway's translation to the Responses API (type: '').
                messages.append(
                    {"role": "assistant", "content": msg.get("content") or None, "tool_calls": tool_calls}
                )
                for tc in tool_calls:
                    fn = tc["function"]["name"]
                    try:
                        a = json.loads(tc["function"].get("arguments") or "{}")
                    except Exception:
                        a = {}
                    out = _jsonable(execute_tool(fn, a))
                    trace.append({"tool": fn, "input": a, "output": out})
                    messages.append(
                        {"role": "tool", "tool_call_id": tc["id"], "content": json.dumps(out)}
                    )
                continue
            return {"reply": msg.get("content", ""), "trace": trace, "model": model}
        return {"reply": "(stopped after too many tool steps)", "trace": trace, "model": model}
    except httpx.HTTPStatusError as e:
        return {"reply": f"gateway error {e.response.status_code}: {e.response.text[:200]}", "trace": trace}
    except Exception as e:
        return {"reply": f"error: {type(e).__name__}: {e}", "trace": trace}
