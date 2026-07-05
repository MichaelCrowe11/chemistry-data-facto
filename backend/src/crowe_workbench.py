"""Shared Crowe workbench core.

A local, token-gated server that serves a browser console and runs a Crowe-model
agent loop over a domain tool pack. Reused by every Crowe workbench app (chemistry,
mycology, ...). Reasoning runs on the Crowe model stack via the Foundry gateway;
no third-party hosted models.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import secrets
import socket
import sqlite3
import threading
import time
import webbrowser
from pathlib import Path

import httpx
from fastapi import FastAPI
from pydantic import BaseModel
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import HTMLResponse, JSONResponse, RedirectResponse

try:
    import numpy as _np
except Exception:  # numpy optional in the core
    _np = None


def _secret(name: str) -> str | None:
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


def jsonable(x):
    if _np is not None:
        if isinstance(x, _np.floating):
            return float(x)
        if isinstance(x, _np.integer):
            return int(x)
        if isinstance(x, _np.ndarray):
            return x.tolist()
    if isinstance(x, dict):
        return {k: jsonable(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [jsonable(v) for v in x]
    return x


def gateway_chat(model: str, messages: list, tools=None) -> dict:
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


def run_agent(model, system, tools, execute_tool, message, history, max_steps=6) -> dict:
    messages = [{"role": "system", "content": system}] + list(history) + [
        {"role": "user", "content": message}
    ]
    trace: list = []
    for _ in range(max_steps):
        msg = gateway_chat(model, messages, tools)
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
                out = jsonable(execute_tool(fn, a))
                trace.append({"tool": fn, "input": a, "output": out})
                messages.append({"role": "tool", "tool_call_id": tc["id"], "content": json.dumps(out)})
            continue
        return {"reply": msg.get("content", ""), "trace": trace, "model": model}
    return {"reply": "(stopped after too many tool steps)", "trace": trace, "model": model}


_TEMPLATE = """<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>__TITLE__</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<style>
  :root{ --paper:#f7f3ea; --panel:#fffdf8; --ink:#1a1714; --dim:#6b6457; --gold:#b8893a;
    --line:rgba(26,23,20,.12); --line-2:rgba(26,23,20,.06);
    --z:0 1px 2px rgba(26,23,20,.05), 0 8px 24px rgba(26,23,20,.06); }
  *{ box-sizing:border-box; }
  body{ margin:0; background:var(--paper); color:var(--ink); font:16px/1.6 Inter, system-ui, sans-serif; -webkit-font-smoothing:antialiased; }
  header{ padding:32px 32px 20px; border-bottom:1px solid var(--line); }
  .brand{ display:flex; align-items:center; gap:11px; }
  .dot{ width:9px; height:9px; border-radius:999px; background:var(--gold); }
  h1{ margin:0; font-family:Fraunces, Georgia, serif; font-weight:600; font-size:26px; letter-spacing:-.01em; }
  .sub{ color:var(--dim); font-size:13px; margin-top:7px; }
  main{ max-width:840px; margin:0 auto; padding:28px 32px 120px; }
  .chat{ display:flex; flex-direction:column; gap:14px; min-height:100px; }
  .msg{ padding:12px 15px; border-radius:12px; font-size:14.5px; max-width:84%; }
  .msg p{ margin:0 0 10px; } .msg p:last-child{ margin-bottom:0; }
  .user{ align-self:flex-end; background:#efe7d5; border:1px solid var(--line-2); white-space:pre-wrap; }
  .bot{ align-self:flex-start; background:var(--panel); border:1px solid var(--line); box-shadow:var(--z); }
  .bot table{ border-collapse:collapse; margin:8px 0; font-size:13.5px; }
  .bot td,.bot th{ border-bottom:1px solid var(--line-2); padding:5px 14px 5px 0; text-align:left; }
  .bot code{ font-family:'JetBrains Mono', ui-monospace, monospace; font-size:12.5px; background:rgba(26,23,20,.05); padding:1px 5px; border-radius:5px; }
  .trace{ align-self:flex-start; font:11.5px/1.4 'JetBrains Mono', ui-monospace, monospace; color:var(--gold); letter-spacing:.02em; margin:-6px 2px 0; }
  .composer{ position:fixed; left:0; right:0; bottom:0; background:linear-gradient(180deg, rgba(247,243,234,0), var(--paper) 34%); padding:16px 0 20px; }
  .composer-in{ max-width:840px; margin:0 auto; padding:0 32px; }
  .row{ display:flex; gap:10px; }
  input#ask{ flex:1; padding:13px 15px; border:1px solid var(--line); border-radius:10px; background:var(--panel); font:15px Inter, sans-serif; color:var(--ink); }
  input#ask:focus{ outline:2px solid var(--gold); outline-offset:0; border-color:transparent; }
  select{ border:1px solid var(--line); border-radius:10px; padding:0 10px; background:var(--panel); font:12.5px 'JetBrains Mono', monospace; color:var(--dim); }
  button{ padding:0 20px; border:0; border-radius:10px; background:var(--ink); color:var(--paper); font:600 14px Inter, sans-serif; cursor:pointer; transition:transform 110ms cubic-bezier(.16,1,.3,1); }
  button:hover{ background:#000; } button:active{ transform:translateY(1px); }
  .hint{ color:var(--dim); font-size:11.5px; margin-top:8px; }
  .dash{ display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px; margin-bottom:24px; }
  .dash:empty{ display:none; }
  .card{ background:var(--panel); border:1px solid var(--line); border-radius:12px; box-shadow:var(--z); padding:14px 16px; }
  .card h3{ margin:0 0 10px; font:500 12px 'JetBrains Mono', monospace; letter-spacing:.06em; text-transform:uppercase; color:var(--dim); }
  .tiles{ display:grid; grid-template-columns:1fr 1fr; gap:9px 14px; }
  .tile .k{ font-size:11px; color:var(--dim); }
  .tile .v{ font:600 16px Inter, sans-serif; } .tile .v.warn{ color:#b5642a; }
  .tile .u{ font-size:11px; color:var(--dim); font-weight:400; }
  .dash-note{ grid-column:1/-1; font:11px 'JetBrains Mono', monospace; color:var(--dim); }
  @media (prefers-reduced-motion: reduce){ *{ transition:none !important; } }
</style></head>
<body>
<header><div class="brand"><span class="dot"></span><h1>__TITLE__</h1></div><div class="sub">__SUBTITLE__</div></header>
<main><div id="dash" class="dash"></div><div id="chat" class="chat"></div></main>
<div class="composer"><div class="composer-in">
  <div class="row">
    <input id="ask" placeholder="__PLACEHOLDER__"/>
    <select id="model" title="Crowe model">__MODELS__</select>
    <button id="send">Send</button>
  </div>
  <div class="hint">__FOOTER__</div>
</div></div>
<script>
const chat=document.getElementById('chat'); const history=[];
const SID=(self.crypto&&crypto.randomUUID)?crypto.randomUUID():(''+Math.random()).slice(2);
const DASH_EP="__DASH_EP__";
const LBL={temperature_c:'Temp',humidity_pct:'Humidity',co2_ppm:'CO2',vpd_kpa:'VPD',light_lux:'Light'};
function warnCls(m,v){ if(v==null) return '';
  if(m==='co2_ppm'&&v>1000) return 'warn';
  if(m==='vpd_kpa'&&(v<0.4||v>1.6)) return 'warn';
  if(m==='temperature_c'&&(v<15||v>26)) return 'warn';
  if(m==='humidity_pct'&&v<80) return 'warn'; return ''; }
async function renderDash(){ if(!DASH_EP) return; const el=document.getElementById('dash');
  try{ const d=await (await fetch(DASH_EP)).json(); const nodes=d.nodes||{}; let h='';
    for(const [node,mets] of Object.entries(nodes)){ let tiles='';
      for(const [m,info] of Object.entries(mets)){ const v=info.value;
        const dp=(m==='co2_ppm'||m==='light_lux')?0:2;
        tiles+=`<div class="tile"><div class="k">${LBL[m]||m}</div><div class="v ${warnCls(m,v)}">${v==null?'-':(+v).toFixed(dp)} <span class="u">${info.unit||''}</span></div></div>`; }
      h+=`<div class="card"><h3>${node}</h3><div class="tiles">${tiles}</div></div>`; }
    if(d.total_readings) h+=`<div class="dash-note">${(+d.total_readings).toLocaleString()} readings logged</div>`;
    el.innerHTML=h;
  }catch(e){ el.innerHTML='<div class="dash-note">sensor unreachable</div>'; } }
if(DASH_EP){ renderDash(); setInterval(renderDash, 20000); }
function md(x){ return (window.marked ? marked.parse(x) : x); }
function bubble(role,text){const d=document.createElement('div'); d.className='msg '+(role==='user'?'user':'bot');
  if(role==='user'){ d.textContent=text; } else { d.innerHTML=md(text); }
  chat.appendChild(d); window.scrollTo(0,document.body.scrollHeight); return d;}
async function ask(){const i=document.getElementById('ask'); const m=i.value.trim(); if(!m) return; i.value='';
  bubble('user',m); const t=bubble('bot','...');
  try{const r=await fetch('/api/v1/agent/chat',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({message:m,history,model:document.getElementById('model').value,session_id:SID})});
    const d=await r.json(); t.innerHTML=md(d.reply||'(no reply)');
    if(d.trace&&d.trace.length){const e=document.createElement('div'); e.className='trace';
      e.textContent='called: '+d.trace.map(x=>x.tool).join('  ,  '); chat.appendChild(e);}
    history.push({role:'user',content:m}); history.push({role:'assistant',content:d.reply||''});
    window.scrollTo(0,document.body.scrollHeight);
  }catch(e){t.textContent='Error: '+e.message;}}
document.getElementById('send').addEventListener('click',ask);
document.getElementById('ask').addEventListener('keydown',e=>{if(e.key==='Enter')ask();});
</script></body></html>"""


def build_console(title, subtitle, placeholder, models, footer, dashboard_endpoint="") -> str:
    opts = "".join(f'<option value="{m}">{m}</option>' for m in models)
    return (
        _TEMPLATE.replace("__TITLE__", title)
        .replace("__SUBTITLE__", subtitle)
        .replace("__PLACEHOLDER__", placeholder)
        .replace("__MODELS__", opts)
        .replace("__FOOTER__", footer)
        .replace("__DASH_EP__", dashboard_endpoint or "")
    )


class _ChatReq(BaseModel):
    message: str
    history: list = []
    model: str | None = None
    session_id: str | None = None


def create_app(*, title, subtitle, system, tools, execute_tool, models, default_model, placeholder, footer, dashboard_endpoint=None, on_app=None, data_dir=None) -> FastAPI:
    app = FastAPI(title=title)
    token = secrets.token_urlsafe(24)
    cookie = "crowe_wb_session"

    # Persistence: every turn (question, model, reply, full tool trace) is saved so
    # each answer traces to the exact tool calls and data that produced it.
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "workbench"
    ddir = Path(data_dir) if data_dir else (Path.home() / ".crowe-workbench" / slug)
    ddir.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(str(ddir / "sessions.db"), check_same_thread=False)
    db.execute(
        "CREATE TABLE IF NOT EXISTS turns (id INTEGER PRIMARY KEY AUTOINCREMENT, "
        "session_id TEXT, ts REAL, model TEXT, question TEXT, reply TEXT, trace TEXT)"
    )
    db.commit()
    db_lock = threading.Lock()

    class TokenGate(BaseHTTPMiddleware):
        async def dispatch(self, request, call_next):
            path = request.url.path
            if path == "/health":
                return await call_next(request)
            q = request.query_params.get("token")
            if q and secrets.compare_digest(q, token):
                resp = RedirectResponse(url=path or "/")
                resp.set_cookie(cookie, token, httponly=True, samesite="lax")
                return resp
            c = request.cookies.get(cookie)
            if c and secrets.compare_digest(c, token):
                return await call_next(request)
            return JSONResponse({"detail": "Unauthorized. Open the login link the launcher printed."}, status_code=401)

    app.add_middleware(TokenGate)
    app.state.session_token = token
    if on_app is not None:
        on_app(app)
    html = build_console(title, subtitle, placeholder, models, footer, dashboard_endpoint or "")

    @app.get("/health")
    def health():
        return {"status": "ok", "app": title}

    @app.get("/api/v1/agent/info")
    def info():
        return {
            "gateway_configured": bool(GATEWAY_URL and GATEWAY_KEY),
            "default_model": default_model,
            "models": sorted(models),
            "tools": [t["function"]["name"] for t in tools],
        }

    @app.post("/api/v1/agent/chat")
    def chat(req: _ChatReq):
        sid = req.session_id or secrets.token_hex(8)
        if not (GATEWAY_URL and GATEWAY_KEY):
            return {"reply": "Crowe gateway not configured (FOUNDRY_GATEWAY_URL / key missing).", "trace": [], "session_id": sid}
        m = req.model if req.model in models else default_model
        try:
            result = run_agent(m, system, tools, execute_tool, req.message, req.history)
        except httpx.HTTPStatusError as e:
            result = {"reply": f"gateway error {e.response.status_code}: {e.response.text[:200]}", "trace": []}
        except Exception as e:
            result = {"reply": f"error: {type(e).__name__}: {e}", "trace": []}
        result["session_id"] = sid
        try:
            with db_lock:
                db.execute(
                    "INSERT INTO turns (session_id, ts, model, question, reply, trace) VALUES (?,?,?,?,?,?)",
                    (sid, time.time(), result.get("model", m), req.message,
                     result.get("reply", ""), json.dumps(result.get("trace", []))),
                )
                db.commit()
        except Exception:
            pass
        return result

    @app.get("/api/v1/history")
    def history(limit: int = 30):
        with db_lock:
            rows = db.execute(
                "SELECT session_id, ts, model, question, substr(reply,1,160) FROM turns ORDER BY id DESC LIMIT ?",
                (int(limit),),
            ).fetchall()
        return {"turns": [
            {"session_id": r[0], "ts": r[1], "model": r[2], "question": r[3], "reply_preview": r[4]} for r in rows
        ]}

    @app.get("/api/v1/history/{sid}")
    def history_session(sid: str):
        with db_lock:
            rows = db.execute(
                "SELECT ts, model, question, reply, trace FROM turns WHERE session_id=? ORDER BY id ASC", (sid,)
            ).fetchall()
        return {"session_id": sid, "turns": [
            {"ts": r[0], "model": r[1], "question": r[2], "reply": r[3], "trace": json.loads(r[4] or "[]")} for r in rows
        ]}

    @app.get("/", response_class=HTMLResponse)
    def console():
        return html

    return app


def serve(app: FastAPI, name: str = "Crowe Workbench") -> None:
    ap = argparse.ArgumentParser(prog=name)
    ap.add_argument("cmd", nargs="?", default="serve", choices=["serve"])
    ap.add_argument("--port", type=int, default=None)
    ap.add_argument("--no-open", action="store_true")
    args = ap.parse_args()

    port = args.port
    if not port:
        s = socket.socket()
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
        s.close()

    url = f"http://127.0.0.1:{port}/?token={app.state.session_token}"
    print(f"\n  {name}\n  Web UI -> {url}\n  One-time login link (sets a session cookie). Ctrl-C to stop.\n")
    if not args.no_open:
        try:
            webbrowser.open(url)
        except Exception:
            pass
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")
