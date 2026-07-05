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
  :root{
    --bg:#080a0d; --s0:#0b0e12; --s1:#11151b; --s2:#171c24; --s3:#1e242d; --s4:#262d38;
    --ink:#eceae4; --dim:#a3a097; --faint:#8a887f;
    --gold:#d2ad62; --gold2:#e7c984; --gold-dim:#9a7e44;
    --hair:rgba(255,255,255,.08); --hair-top:rgba(255,255,255,.14);
    --z1:0 1px 2px rgba(8,10,13,.4);
    --z2:0 4px 12px rgba(8,10,13,.45), 0 1px 0 var(--hair-top) inset;
    --z3:0 16px 40px rgba(8,10,13,.55), 0 1px 0 var(--hair-top) inset;
    --glass:linear-gradient(150deg,rgba(255,255,255,.13) 0%,rgba(255,255,255,.045) 42%,rgba(210,173,98,.05) 100%);
    --ease:cubic-bezier(.16,1,.3,1);
    --warn:#dcb05a; --bad:#db7c66; --ok:#8cb87c;
  }
  *{ box-sizing:border-box; }
  html,body{ height:100%; }
  body{ margin:0; background:var(--bg); color:var(--ink); font:15px/1.55 Inter, system-ui, sans-serif; -webkit-font-smoothing:antialiased; }
  .app{ display:grid; grid-template-columns:236px 1fr; height:100vh; }
  /* sidebar */
  .sidebar{ background:var(--s0); border-right:1px solid var(--hair); display:flex; flex-direction:column; padding:16px 12px; }
  .brand{ display:flex; align-items:center; gap:9px; padding:8px 10px 16px; font-family:Fraunces, Georgia, serif; font-weight:600; font-size:17px; letter-spacing:-.01em; }
  .brand .dot{ width:8px; height:8px; border-radius:999px; background:var(--gold); box-shadow:0 0 12px var(--gold-dim); }
  .grp{ font:500 10px 'JetBrains Mono', monospace; letter-spacing:.16em; text-transform:uppercase; color:var(--faint); padding:16px 10px 6px; }
  .nav{ display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:9px; color:var(--dim); font-size:13.5px; cursor:pointer; transition:background 120ms var(--ease), color 120ms var(--ease); }
  .nav .m{ width:5px; height:5px; border-radius:2px; background:var(--faint); transition:background 120ms var(--ease); }
  .nav:hover{ background:var(--s2); color:var(--ink); }
  .nav.active{ background:var(--s2); color:var(--ink); box-shadow:inset 0 1px 0 var(--hair-top); }
  .nav.active .m{ background:var(--gold); box-shadow:0 0 8px var(--gold-dim); }
  .spacer{ flex:1; }
  .side-foot{ font:10.5px 'JetBrains Mono', monospace; color:var(--faint); padding:10px; border-top:1px solid var(--hair); }
  .side-foot .ok{ color:var(--ok); } .side-foot .off{ color:var(--bad); }
  /* content */
  .content{ display:flex; flex-direction:column; min-width:0; position:relative; }
  .topbar{ height:54px; flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; padding:0 22px; border-bottom:1px solid var(--hair); background:var(--s0); }
  .crumbs{ font:500 13px Inter; color:var(--dim); }
  .crumbs b{ color:var(--ink); font-weight:600; }
  .tr{ display:flex; align-items:center; gap:10px; }
  .kbd{ font:11px 'JetBrains Mono', monospace; color:var(--dim); border:1px solid var(--hair); border-top-color:var(--hair-top); background:var(--s2); padding:5px 9px; border-radius:7px; cursor:pointer; transition:background 120ms var(--ease); }
  .kbd:hover{ background:var(--s3); color:var(--ink); }
  select#model{ background:var(--s2); color:var(--dim); border:1px solid var(--hair); border-top-color:var(--hair-top); border-radius:8px; padding:6px 8px; font:12px 'JetBrains Mono', monospace; }
  .scroll{ flex:1 1 auto; overflow:auto; padding:22px 24px 24px; }
  .view{ display:none; } .view.active{ display:block; animation:rise 200ms var(--ease); }
  @keyframes rise{ from{ opacity:0; transform:translateY(6px);} to{ opacity:1; transform:none; } }
  h2.vh{ margin:2px 0 4px; font-family:Fraunces, Georgia, serif; font-weight:600; font-size:21px; }
  .vsub{ color:var(--dim); font-size:12.5px; margin-bottom:18px; }
  /* cards */
  .cards{ display:grid; grid-template-columns:repeat(auto-fit,minmax(215px,1fr)); gap:12px; }
  .card{ background:var(--s1); border:1px solid var(--hair); border-top-color:var(--hair-top); border-radius:14px; box-shadow:var(--z2); padding:15px 17px; }
  .card h3{ margin:0 0 12px; font:500 11px 'JetBrains Mono', monospace; letter-spacing:.08em; text-transform:uppercase; color:var(--gold-dim); }
  .tiles{ display:grid; grid-template-columns:1fr 1fr; gap:11px 16px; }
  .tile .k{ font-size:11px; color:var(--faint); }
  .tile .v{ font:600 17px Inter, sans-serif; margin-top:1px; }
  .tile .v.warn{ color:var(--warn); } .tile .v .u{ font-size:11px; color:var(--faint); font-weight:400; }
  .note{ font:11px 'JetBrains Mono', monospace; color:var(--faint); margin-top:14px; }
  .skel{ height:96px; border-radius:14px; background:linear-gradient(100deg,var(--s1) 30%,var(--s2) 50%,var(--s1) 70%); background-size:200% 100%; animation:sh 1.2s infinite; }
  @keyframes sh{ from{ background-position:200% 0; } to{ background-position:-200% 0; } }
  /* quickstart */
  .qs{ background:var(--s1); border:1px solid var(--hair); border-top-color:var(--hair-top); border-radius:14px; box-shadow:var(--z2); padding:18px 20px; margin-top:16px; }
  .qs h3{ margin:0 0 6px; font-size:14px; }
  .qs p{ margin:0 0 14px; color:var(--dim); font-size:13px; }
  .pill{ display:inline-block; font:11px 'JetBrains Mono', monospace; color:var(--dim); background:var(--s2); border:1px solid var(--hair); border-radius:999px; padding:4px 10px; margin:0 6px 6px 0; }
  .gbtn{ background:var(--gold); color:#161006; font:600 13px Inter; border:0; border-radius:9px; padding:9px 16px; cursor:pointer; transition:filter 110ms var(--ease), transform 110ms var(--ease); }
  .gbtn:hover{ filter:brightness(1.08); } .gbtn:active{ transform:translateY(1px); }
  /* chat */
  .chat{ display:flex; flex-direction:column; gap:12px; max-width:840px; }
  .msg{ padding:12px 15px; border-radius:13px; font-size:14px; max-width:88%; }
  .msg p{ margin:0 0 9px; } .msg p:last-child{ margin-bottom:0; }
  .user{ align-self:flex-end; background:var(--s3); border:1px solid var(--hair); border-top-color:var(--hair-top); white-space:pre-wrap; }
  .bot{ align-self:flex-start; background:var(--s1); border:1px solid var(--hair); border-top-color:var(--hair-top); box-shadow:var(--z2); }
  .bot table{ border-collapse:collapse; margin:8px 0; font-size:13px; }
  .bot td,.bot th{ border-bottom:1px solid var(--hair); padding:6px 16px 6px 0; text-align:left; }
  .bot th{ color:var(--gold-dim); font-weight:600; }
  .bot code{ font-family:'JetBrains Mono', monospace; font-size:12px; background:var(--s2); color:var(--gold2); padding:1px 6px; border-radius:5px; }
  .bot a{ color:var(--gold2); }
  .dots span{ display:inline-block; width:5px; height:5px; margin-right:3px; border-radius:999px; background:var(--dim); animation:blink 1.2s infinite; }
  .dots span:nth-child(2){ animation-delay:.2s; } .dots span:nth-child(3){ animation-delay:.4s; }
  @keyframes blink{ 0%,80%,100%{ opacity:.25; } 40%{ opacity:1; } }
  .trace{ align-self:flex-start; font:11px 'JetBrains Mono', monospace; color:var(--gold-dim); letter-spacing:.02em; margin:-4px 2px 0; }
  /* composer */
  .composer{ flex:0 0 auto; padding:14px 24px 18px; border-top:1px solid var(--hair); background:var(--s0); }
  .row{ display:flex; gap:10px; max-width:840px; }
  input#ask{ flex:1; background:var(--s2); border:1px solid var(--hair); border-top-color:var(--hair-top); color:var(--ink); border-radius:11px; padding:13px 15px; font:15px Inter; }
  input#ask::placeholder{ color:var(--faint); }
  input#ask:focus{ outline:none; border-color:var(--gold-dim); box-shadow:0 0 0 2px rgba(210,173,98,.22); }
  button#send{ background:var(--gold); color:#161006; font:600 14px Inter; border:0; border-radius:11px; padding:0 20px; cursor:pointer; transition:filter 110ms var(--ease), transform 110ms var(--ease); }
  button#send:hover{ filter:brightness(1.08); } button#send:active{ transform:translateY(1px); }
  .chint{ color:var(--faint); font-size:11px; margin-top:9px; }
  /* sessions / lists */
  .rowitem{ display:flex; justify-content:space-between; gap:16px; padding:12px 14px; border:1px solid var(--hair); border-top-color:var(--hair-top); border-radius:11px; background:var(--s1); margin-bottom:9px; cursor:pointer; transition:background 120ms var(--ease); }
  .rowitem:hover{ background:var(--s2); }
  .rowitem .q{ color:var(--ink); font-size:13.5px; } .rowitem .meta{ color:var(--faint); font:11px 'JetBrains Mono', monospace; white-space:nowrap; }
  .kv{ display:flex; gap:10px; font-size:13px; padding:7px 0; border-bottom:1px solid var(--hair); }
  .kv .k{ color:var(--dim); width:150px; } .kv .v{ color:var(--ink); font-family:'JetBrains Mono', monospace; font-size:12.5px; }
  /* command palette */
  .overlay{ position:fixed; inset:0; background:rgba(8,10,13,.55); display:none; align-items:flex-start; justify-content:center; padding-top:13vh; z-index:60; }
  .overlay.open{ display:flex; animation:fade 120ms var(--ease); }
  @keyframes fade{ from{ opacity:0; } to{ opacity:1; } }
  .palette{ width:min(560px,92vw); background:var(--glass); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border:1px solid var(--hair-top); border-radius:15px; box-shadow:var(--z3); overflow:hidden; }
  .palette input{ width:100%; background:transparent; border:0; border-bottom:1px solid var(--hair); color:var(--ink); font:15px Inter; padding:16px 18px; outline:none; }
  .palette input::placeholder{ color:var(--faint); }
  .pitems{ max-height:320px; overflow:auto; padding:6px; }
  .pitem{ display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-radius:9px; color:var(--dim); font-size:13.5px; cursor:pointer; }
  .pitem .h{ font:10.5px 'JetBrains Mono', monospace; color:var(--faint); }
  .pitem.sel, .pitem:hover{ background:rgba(255,255,255,.06); color:var(--ink); }
  @media (prefers-reduced-motion: reduce){ *{ animation:none !important; transition:none !important; } }
</style></head>
<body>
<div class="app">
  <aside class="sidebar">
    <div class="brand"><span class="dot"></span>__TITLE__</div>
    <div class="grp">Dashboard</div>
    <div class="nav" data-view="overview"><span class="m"></span>Overview</div>
    <div class="grp">Build</div>
    <div class="nav" data-view="workbench"><span class="m"></span>Workbench</div>
    <div class="nav" data-view="sessions"><span class="m"></span>Sessions</div>
    <div class="grp">Insight</div>
    <div class="nav" data-view="analytics"><span class="m"></span>Analytics</div>
    <div class="spacer"></div>
    <div class="nav" data-view="settings"><span class="m"></span>Settings</div>
    <div class="side-foot" id="sidefoot">gateway ...</div>
  </aside>
  <div class="content">
    <div class="topbar">
      <div class="crumbs"><b id="viewname">Workbench</b></div>
      <div class="tr">
        <div class="kbd" id="palbtn">Search  ⌘K</div>
        <select id="model" title="Crowe model">__MODELS__</select>
      </div>
    </div>
    <div class="scroll">
      <section id="v-overview" class="view">
        <h2 class="vh">Overview</h2>
        <div class="vsub">__SUBTITLE__</div>
        <div id="cards" class="cards"></div>
        <div class="qs">
          <h3>Quickstart</h3>
          <p>Ask in plain language. The agent calls the tools below and reports what they return.</p>
          <div id="toolpills"></div>
          <button class="gbtn" id="sample">Run a sample</button>
        </div>
      </section>
      <section id="v-workbench" class="view">
        <div id="chat" class="chat"></div>
      </section>
      <section id="v-sessions" class="view">
        <h2 class="vh">Sessions</h2>
        <div class="vsub">Every answer is saved with the exact tools that produced it.</div>
        <div id="sesslist"></div>
      </section>
      <section id="v-analytics" class="view">
        <h2 class="vh">Analytics</h2>
        <div class="vsub">Usage across saved sessions.</div>
        <div id="analytics" class="cards"></div>
      </section>
      <section id="v-settings" class="view">
        <h2 class="vh">Settings</h2>
        <div class="vsub">Runtime and model configuration.</div>
        <div id="settings"></div>
      </section>
    </div>
    <div class="composer" id="composer" style="display:none">
      <div class="row">
        <input id="ask" placeholder="__PLACEHOLDER__"/>
        <button id="send">Send</button>
      </div>
      <div class="chint">__FOOTER__</div>
    </div>
  </div>
</div>
<div class="overlay" id="overlay"><div class="palette">
  <input id="palinput" placeholder="Type a command..." autocomplete="off"/>
  <div class="pitems" id="pitems"></div>
</div></div>
<script>
const SID=(self.crypto&&crypto.randomUUID)?crypto.randomUUID():(''+Math.random()).slice(2);
const DASH_EP="__DASH_EP__";
const history=[]; const chat=document.getElementById('chat');
const LBL={temperature_c:'Temp',humidity_pct:'Humidity',co2_ppm:'CO2',vpd_kpa:'VPD',light_lux:'Light'};
function md(x){ return (window.marked? marked.parse(x): x); }
function warnCls(m,v){ if(v==null) return '';
  if(m==='co2_ppm'&&v>1000) return 'warn';
  if(m==='vpd_kpa'&&(v<0.4||v>1.6)) return 'warn';
  if(m==='temperature_c'&&(v<15||v>26)) return 'warn';
  if(m==='humidity_pct'&&v<80) return 'warn'; return ''; }

/* ---- views ---- */
const NAMES={overview:'Overview',workbench:'Workbench',sessions:'Sessions',analytics:'Analytics',settings:'Settings'};
let current='';
function showView(v){
  current=v;
  document.querySelectorAll('.view').forEach(s=>s.classList.remove('active'));
  document.getElementById('v-'+v).classList.add('active');
  document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active', n.dataset.view===v));
  document.getElementById('viewname').textContent=NAMES[v];
  document.getElementById('composer').style.display = (v==='workbench')?'block':'none';
  if(v==='sessions') loadSessions();
  if(v==='analytics') loadAnalytics();
  if(v==='settings') loadSettings();
  if(v==='overview') renderDash();
}
document.querySelectorAll('.nav').forEach(n=>n.addEventListener('click',()=>showView(n.dataset.view)));

/* ---- overview: sensors + quickstart ---- */
async function renderDash(){
  const el=document.getElementById('cards'); if(!el) return;
  if(!DASH_EP){ el.innerHTML=''; return; }
  if(!el.dataset.loaded) el.innerHTML='<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
  try{ const d=await (await fetch(DASH_EP)).json(); const nodes=d.nodes||{}; let h='';
    for(const [node,mets] of Object.entries(nodes)){ let tiles='';
      for(const [m,info] of Object.entries(mets)){ const v=info.value; const dp=(m==='co2_ppm'||m==='light_lux')?0:2;
        tiles+='<div class="tile"><div class="k">'+(LBL[m]||m)+'</div><div class="v '+warnCls(m,v)+'">'+(v==null?'-':(+v).toFixed(dp))+' <span class="u">'+(info.unit||'')+'</span></div></div>'; }
      h+='<div class="card"><h3>'+node+'</h3><div class="tiles">'+tiles+'</div></div>'; }
    if(d.total_readings) h+='<div class="note">'+(+d.total_readings).toLocaleString()+' readings logged. Live, refreshes every 20s.</div>';
    el.innerHTML=h; el.dataset.loaded='1';
  }catch(e){ el.innerHTML='<div class="note">sensor unreachable</div>'; } }
if(DASH_EP) setInterval(()=>{ if(current==='overview') renderDash(); }, 20000);

async function loadInfo(){
  try{ const d=await (await fetch('/api/v1/agent/info')).json();
    document.getElementById('toolpills').innerHTML=(d.tools||[]).map(t=>'<span class="pill">'+t+'</span>').join('');
    const sf=document.getElementById('sidefoot');
    sf.innerHTML = d.gateway_configured? 'gateway <span class="ok">online</span><br>'+d.default_model : 'gateway <span class="off">offline</span>';
    return d;
  }catch(e){ return {}; } }

/* ---- chat (optimistic) ---- */
function bubble(role,html,raw){ const d=document.createElement('div'); d.className='msg '+(role==='user'?'user':'bot');
  if(role==='user'){ d.textContent=html; } else { d.innerHTML = raw? html : md(html); }
  chat.appendChild(d); document.querySelector('.scroll').scrollTop=1e9; return d; }
async function ask(preset){ const i=document.getElementById('ask'); const m=(preset||i.value).trim(); if(!m) return;
  if(!preset) i.value=''; if(current!=='workbench') showView('workbench');
  bubble('user',m); const t=bubble('bot','<span class="dots"><span></span><span></span><span></span></span>',true);
  try{ const r=await fetch('/api/v1/agent/chat',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message:m,history,model:document.getElementById('model').value,session_id:SID})});
    const d=await r.json(); t.innerHTML=md(d.reply||'(no reply)');
    if(d.trace&&d.trace.length){ const e=document.createElement('div'); e.className='trace';
      e.textContent='called: '+d.trace.map(x=>x.tool).join('  ·  '); chat.appendChild(e); }
    history.push({role:'user',content:m}); history.push({role:'assistant',content:d.reply||''});
    document.querySelector('.scroll').scrollTop=1e9;
  }catch(e){ t.textContent='Error: '+e.message; } }
document.getElementById('send').addEventListener('click',()=>ask());
document.getElementById('ask').addEventListener('keydown',e=>{ if(e.key==='Enter') ask(); });
document.getElementById('sample').addEventListener('click',()=>ask(document.getElementById('ask').placeholder));

/* ---- sessions / analytics / settings ---- */
function ago(ts){ const s=Math.max(0,(Date.now()/1000-ts)); if(s<60) return Math.round(s)+'s ago'; if(s<3600) return Math.round(s/60)+'m ago'; return Math.round(s/3600)+'h ago'; }
async function loadSessions(){ const el=document.getElementById('sesslist'); el.innerHTML='<div class="skel"></div>';
  try{ const d=await (await fetch('/api/v1/history?limit=40')).json();
    if(!d.turns.length){ el.innerHTML='<div class="note">No saved turns yet.</div>'; return; }
    el.innerHTML=d.turns.map(t=>'<div class="rowitem" data-sid="'+t.session_id+'"><div class="q">'+(t.question||'').replace(/</g,'&lt;')+'</div><div class="meta">'+t.model+'  '+ago(t.ts)+'</div></div>').join('');
    el.querySelectorAll('.rowitem').forEach(r=>r.addEventListener('click',()=>openSession(r.dataset.sid)));
  }catch(e){ el.innerHTML='<div class="note">history unavailable</div>'; } }
async function openSession(sid){ const el=document.getElementById('sesslist'); el.innerHTML='<div class="skel"></div>';
  try{ const d=await (await fetch('/api/v1/history/'+sid)).json();
    let h='<div class="rowitem" id="back"><div class="q">← back to sessions</div></div>';
    for(const t of d.turns){ h+='<div class="card" style="margin-bottom:12px"><div class="note" style="margin:0 0 8px">'+t.model+'  ·  tools: '+(t.trace||[]).map(x=>x.tool).join(', ')+'</div><div style="color:var(--ink);font-size:13.5px;margin-bottom:8px">'+(t.question||'').replace(/</g,'&lt;')+'</div><div class="bot" style="max-width:none">'+md(t.reply||'')+'</div></div>'; }
    el.innerHTML=h; document.getElementById('back').addEventListener('click',loadSessions);
  }catch(e){ el.innerHTML='<div class="note">could not load session</div>'; } }
async function loadAnalytics(){ const el=document.getElementById('analytics'); el.innerHTML='<div class="skel"></div>';
  try{ const d=await (await fetch('/api/v1/history?limit=500')).json(); const t=d.turns;
    const models={}; const sess=new Set(); t.forEach(x=>{ models[x.model]=(models[x.model]||0)+1; sess.add(x.session_id); });
    const mrows=Object.entries(models).map(([k,v])=>'<div class="tile"><div class="k">'+k+'</div><div class="v">'+v+'</div></div>').join('');
    el.innerHTML='<div class="card"><h3>Totals</h3><div class="tiles"><div class="tile"><div class="k">Turns</div><div class="v">'+t.length+'</div></div><div class="tile"><div class="k">Sessions</div><div class="v">'+sess.size+'</div></div></div></div>'
      +'<div class="card"><h3>By model</h3><div class="tiles">'+(mrows||'<div class="note">none yet</div>')+'</div></div>';
  }catch(e){ el.innerHTML='<div class="note">unavailable</div>'; } }
async function loadSettings(){ const el=document.getElementById('settings'); const d=await loadInfo();
  el.innerHTML='<div class="kv"><div class="k">Gateway</div><div class="v">'+(d.gateway_configured?'online':'offline')+'</div></div>'
    +'<div class="kv"><div class="k">Default model</div><div class="v">'+(d.default_model||'-')+'</div></div>'
    +'<div class="kv"><div class="k">Models</div><div class="v">'+((d.models||[]).join(', '))+'</div></div>'
    +'<div class="kv"><div class="k">Tools</div><div class="v">'+((d.tools||[]).join(', '))+'</div></div>'
    +'<div class="kv"><div class="k">Session id</div><div class="v">'+SID+'</div></div>'; }

/* ---- command palette ---- */
const ACTIONS=[
  {t:'Go to Overview', h:'view', fn:()=>showView('overview')},
  {t:'Go to Workbench', h:'view', fn:()=>{ showView('workbench'); document.getElementById('ask').focus(); }},
  {t:'Go to Sessions', h:'view', fn:()=>showView('sessions')},
  {t:'Go to Analytics', h:'view', fn:()=>showView('analytics')},
  {t:'Go to Settings', h:'view', fn:()=>showView('settings')},
  {t:'Run a sample query', h:'run', fn:()=>ask(document.getElementById('ask').placeholder)},
];
const overlay=document.getElementById('overlay'); const pin=document.getElementById('palinput'); const pit=document.getElementById('pitems'); let psel=0;
function models(){ return Array.from(document.getElementById('model').options).map(o=>o.value); }
function allActions(){ return ACTIONS.concat(models().map(m=>({t:'Model: '+m, h:'model', fn:()=>{ document.getElementById('model').value=m; }}))); }
function renderPalette(){ const q=pin.value.toLowerCase(); const items=allActions().filter(a=>a.t.toLowerCase().includes(q)); psel=Math.min(psel,Math.max(0,items.length-1));
  pit.innerHTML=items.map((a,i)=>'<div class="pitem'+(i===psel?' sel':'')+'" data-i="'+i+'"><span>'+a.t+'</span><span class="h">'+a.h+'</span></div>').join('');
  pit._items=items; pit.querySelectorAll('.pitem').forEach(el=>el.addEventListener('click',()=>{ items[+el.dataset.i].fn(); closePalette(); })); }
function openPalette(){ overlay.classList.add('open'); pin.value=''; psel=0; renderPalette(); setTimeout(()=>pin.focus(),20); }
function closePalette(){ overlay.classList.remove('open'); }
document.getElementById('palbtn').addEventListener('click',openPalette);
overlay.addEventListener('click',e=>{ if(e.target===overlay) closePalette(); });
pin.addEventListener('input',()=>{ psel=0; renderPalette(); });
pin.addEventListener('keydown',e=>{ const items=pit._items||[];
  if(e.key==='ArrowDown'){ psel=Math.min(psel+1,items.length-1); renderPalette(); e.preventDefault(); }
  else if(e.key==='ArrowUp'){ psel=Math.max(psel-1,0); renderPalette(); e.preventDefault(); }
  else if(e.key==='Enter'){ if(items[psel]){ items[psel].fn(); closePalette(); } }
  else if(e.key==='Escape'){ closePalette(); } });
window.addEventListener('keydown',e=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); overlay.classList.contains('open')?closePalette():openPalette(); } });

/* ---- boot ---- */
loadInfo();
showView(DASH_EP? 'overview':'workbench');
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
