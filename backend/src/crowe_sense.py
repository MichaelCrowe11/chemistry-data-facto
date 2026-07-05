"""Crowe Sense cultivation tool pack.

Tools that read the live Crowe Sense telemetry (the Raspberry Pi sensor rig over
Tailscale) so a Crowe model can reason about real grow-room conditions.
"""
from __future__ import annotations

import os
import urllib.request
import json as _json

SENSE_URL = (os.getenv("CROWE_SENSE_URL") or "http://100.123.229.57:8078").rstrip("/")
_TIMEOUT = 12
_METRICS = ["temperature_c", "humidity_pct", "co2_ppm", "vpd_kpa", "light_lux"]

# General cultivation guidance, not lab-validated setpoints. [low, high] per metric.
FRUITING = {
    "generic": {"temperature_c": [18, 24], "humidity_pct": [85, 95], "co2_ppm": [0, 1000], "vpd_kpa": [0.4, 1.2]},
    "oyster": {"temperature_c": [15, 24], "humidity_pct": [85, 95], "co2_ppm": [0, 800], "vpd_kpa": [0.5, 1.0]},
    "lions_mane": {"temperature_c": [18, 24], "humidity_pct": [90, 95], "co2_ppm": [0, 1000], "vpd_kpa": [0.4, 0.8]},
    "shiitake": {"temperature_c": [15, 21], "humidity_pct": [80, 90], "co2_ppm": [0, 1000], "vpd_kpa": [0.5, 1.2]},
    "reishi": {"temperature_c": [21, 27], "humidity_pct": [85, 95], "co2_ppm": [0, 2000], "vpd_kpa": [0.3, 0.9]},
    "king_oyster": {"temperature_c": [15, 18], "humidity_pct": [85, 90], "co2_ppm": [0, 800], "vpd_kpa": [0.5, 1.0]},
}
COLONIZATION = {"temperature_c": [21, 27], "humidity_pct": [85, 100], "co2_ppm": [0, 40000], "vpd_kpa": [0, 3.0]}

CULT_MODELS = {"deepseek-v4-pro", "crowenimbus", "teeai"}
CULT_DEFAULT_MODEL = os.getenv("CROWE_MYCOLOGY_MODEL", "deepseek-v4-pro")

CULT_SYSTEM = (
    "You are Crowe Logic Mycology, a cultivation assistant for gourmet and medicinal "
    "mushroom growing. You read a real sensor rig (Crowe Sense) via tools: temperature, "
    "relative humidity, CO2, VPD, and light across fruiting tents and a flow hood. For any "
    "question about current or recent grow-room conditions, call the tools and reason from "
    "the real numbers, not from memory. Interpret conditions for the relevant growth stage "
    "(colonization wants higher CO2 and no light; fruiting wants fresh air, lower CO2, high "
    "humidity, and light) and flag anything out of range. You have environmental data only, "
    "not yield or contamination outcomes, so do not claim to predict yield. Keep any "
    "medicinal-mushroom claims non-clinical. "
    "Write in plain editorial prose: no emojis, no em dashes, no marketing language. Use short "
    "paragraphs and compact tables, and report readings with their units."
)

CULT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "sense_now",
            "description": "Get the current Crowe Sense snapshot: latest temperature, humidity, "
            "CO2, VPD, and light for every sensor node (fruiting tents and flow hood), with the "
            "reading age in seconds and total readings logged.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "sense_history",
            "description": "Summarize a recent window of one metric for one sensor node: min, max, "
            "mean, latest, and sample count.",
            "parameters": {
                "type": "object",
                "properties": {
                    "node": {"type": "string", "description": "e.g. tent-1, tent-2, hood-1"},
                    "metric": {
                        "type": "string",
                        "enum": _METRICS,
                    },
                    "hours": {"type": "number", "description": "look-back window in hours, default 6"},
                },
                "required": ["node", "metric"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "sense_alert",
            "description": "Compare current readings across all sensor nodes against a species and "
            "growth-stage profile, and flag which metrics (temperature, humidity, CO2, VPD) are out "
            "of range and in which direction. Profiles are general cultivation guidance, not "
            "lab-validated setpoints.",
            "parameters": {
                "type": "object",
                "properties": {
                    "species": {
                        "type": "string",
                        "description": "oyster, lions_mane, shiitake, reishi, king_oyster; defaults to generic",
                    },
                    "stage": {"type": "string", "enum": ["fruiting", "colonization"], "description": "defaults to fruiting"},
                },
                "required": [],
            },
        },
    },
]


def _fetch(hours: float) -> dict:
    url = f"{SENSE_URL}/api/data?hours={hours}"
    with urllib.request.urlopen(url, timeout=_TIMEOUT) as r:
        return _json.loads(r.read().decode())


def cult_execute(name: str, args: dict) -> dict:
    try:
        if name == "sense_now":
            d = _fetch(1)
            snap = d.get("snapshot", {})
            nodes = {}
            for node, metrics in snap.items():
                if node.endswith("-derived") or node == "pi":
                    continue
                nodes[node] = {
                    m: {"value": v.get("value"), "unit": v.get("unit"), "quality": v.get("quality"), "age_s": v.get("age")}
                    for m, v in metrics.items()
                    if isinstance(v, dict)
                }
            return {"node": d.get("node"), "total_readings": d.get("count"), "nodes": nodes}
        if name == "sense_history":
            node = args["node"]
            metric = args["metric"]
            hours = float(args.get("hours", 6))
            d = _fetch(hours)
            key = f"{node}|{metric}"
            series = d.get("series", {}).get(key)
            if not series:
                return {"error": f"no series for {key}", "available_keys_sample": list(d.get("series", {}).keys())[:12]}
            values = [pt[1] for pt in series if isinstance(pt, (list, tuple)) and len(pt) == 2 and pt[1] is not None]
            if not values:
                return {"error": f"empty series for {key}"}
            return {
                "node": node,
                "metric": metric,
                "hours": hours,
                "n": len(values),
                "min": round(min(values), 4),
                "max": round(max(values), 4),
                "mean": round(sum(values) / len(values), 4),
                "latest": round(values[-1], 4),
            }
        if name == "sense_alert":
            species = (args.get("species") or "generic").lower().replace(" ", "_")
            stage = (args.get("stage") or "fruiting").lower()
            profile = COLONIZATION if stage == "colonization" else FRUITING.get(species, FRUITING["generic"])
            known = stage == "colonization" or species in FRUITING
            snap = _fetch(1).get("snapshot", {})
            nodes = {}
            for node, metrics in snap.items():
                if node.endswith("-derived") or node == "pi":
                    continue
                flags = []
                for m, (lo, hi) in profile.items():
                    info = metrics.get(m)
                    if not isinstance(info, dict) or info.get("value") is None:
                        continue
                    v = info["value"]
                    if v < lo:
                        flags.append({"metric": m, "value": v, "status": "low", "expected": [lo, hi], "unit": info.get("unit")})
                    elif v > hi:
                        flags.append({"metric": m, "value": v, "status": "high", "expected": [lo, hi], "unit": info.get("unit")})
                nodes[node] = {"in_range": not flags, "flags": flags}
            return {
                "species": species,
                "profile_known": known,
                "stage": stage,
                "profile": profile,
                "nodes": nodes,
                "note": "General cultivation guidance, not lab-validated setpoints.",
            }
        return {"error": f"unknown tool: {name}"}
    except Exception as e:
        return {"error": f"{type(e).__name__}: {e}"}
