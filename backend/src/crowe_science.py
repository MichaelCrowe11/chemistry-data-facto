"""crowe-science: a local scientific workbench, operon-shaped.

Adopts the Claude Science runtime model, honestly adapted to a Python-native
science stack: a headless local server that runs where your data lives, gates on
a one-time token, and serves a UI to your own browser. No Electron, no bundled
browser. The science engine is your real crowe_copilot backend (RDKit, dose
response, knowledge graph, ChEMBL/PubChem, ORCID/Zenodo).

Run:  python src/crowe_science.py serve [--port N] [--no-open]
"""
from __future__ import annotations

import argparse
import os
import secrets
import socket
import sys
import webbrowser

# make `import api` resolve when run from the backend dir
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from starlette.middleware.base import BaseHTTPMiddleware  # noqa: E402
from starlette.responses import HTMLResponse, JSONResponse, RedirectResponse  # noqa: E402

from api import app  # the real FastAPI chemistry daemon  # noqa: E402
from crowe_agent import router as agent_router  # Crowe-model agent loop  # noqa: E402

app.include_router(agent_router)

SESSION_TOKEN = secrets.token_urlsafe(24)
COOKIE = "crowe_science_session"
OPEN_PATHS = {"/health"}


class TokenGate(BaseHTTPMiddleware):
    """One-time login link, then a session cookie. Mirrors operon's model."""

    async def dispatch(self, request, call_next):
        path = request.url.path
        if path in OPEN_PATHS:
            return await call_next(request)

        qtok = request.query_params.get("token")
        if qtok and secrets.compare_digest(qtok, SESSION_TOKEN):
            resp = RedirectResponse(url=path or "/")
            resp.set_cookie(COOKIE, SESSION_TOKEN, httponly=True, samesite="lax")
            return resp

        cookie = request.cookies.get(COOKIE)
        if cookie and secrets.compare_digest(cookie, SESSION_TOKEN):
            return await call_next(request)

        return JSONResponse(
            {"detail": "Unauthorized. Open the login link printed by 'crowe-science serve'."},
            status_code=401,
        )


app.add_middleware(TokenGate)


CONSOLE_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Crowe Science</title>
<style>
  :root { --cream:#f6f3ec; --ink:#1c1a17; --muted:#6b6459; --line:#e0dacd; --gold:#9a7b3f; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--cream); color:var(--ink);
         font:16px/1.5 Inter, system-ui, -apple-system, sans-serif; }
  header { padding:28px 32px 16px; border-bottom:1px solid var(--line); }
  h1 { margin:0; font-size:22px; letter-spacing:.2px; }
  .sub { color:var(--muted); font-size:13px; margin-top:4px; }
  main { max-width:820px; margin:0 auto; padding:28px 32px; }
  label { display:block; font-size:13px; color:var(--muted); margin-bottom:6px; }
  .row { display:flex; gap:10px; }
  input { flex:1; padding:11px 12px; border:1px solid var(--line); border-radius:8px;
          background:#fff; font:14px ui-monospace, JetBrains Mono, monospace; color:var(--ink); }
  button { padding:11px 18px; border:0; border-radius:8px; background:var(--ink); color:var(--cream);
           font-weight:600; cursor:pointer; }
  button:hover { background:#000; }
  .card { margin-top:22px; border:1px solid var(--line); border-radius:12px; background:#fff;
          padding:18px 20px; }
  .k { color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.6px; }
  .v { font:14px ui-monospace, JetBrains Mono, monospace; word-break:break-all; margin:2px 0 12px; }
  table { width:100%; border-collapse:collapse; font-size:14px; }
  td { padding:6px 8px; border-bottom:1px solid var(--line); }
  td:first-child { color:var(--muted); width:45%; }
  .warn { color:var(--gold); font-size:14px; }
  .hint { color:var(--muted); font-size:12px; margin-top:6px; }
  footer { max-width:820px; margin:0 auto; padding:8px 32px 40px; color:var(--muted); font-size:12px; }
</style>
</head>
<body>
<header>
  <h1>Crowe Science</h1>
  <div class="sub">Local workbench. Runs on your machine, served to your browser.</div>
</header>
<main>
  <label for="smiles">Compound (SMILES)</label>
  <div class="row">
    <input id="smiles" placeholder="CC(=O)Oc1ccccc1C(=O)O   (aspirin)" value="CC(=O)Oc1ccccc1C(=O)O"/>
    <button id="go">Analyze</button>
  </div>
  <div class="hint">Standardizes the structure and computes descriptors with RDKit, on this machine.</div>
  <div id="out"></div>

  <div style="margin-top:34px; border-top:1px solid var(--line); padding-top:24px;">
    <label for="ask">Ask Crowe Science</label>
    <div id="chat"></div>
    <div class="row">
      <input id="ask" placeholder="e.g. Compare caffeine and theophylline, and give caffeine's Lipinski profile."/>
      <select id="model" title="Crowe model" style="border:1px solid var(--line); border-radius:8px; padding:0 10px; background:#fff; font:13px Inter, sans-serif;">
        <option value="deepseek-v4-pro">deepseek-v4-pro</option>
        <option value="crowenimbus">crowenimbus</option>
        <option value="teeai">teeai</option>
      </select>
      <button id="send">Send</button>
    </div>
    <div class="hint">Runs on Crowe models through your gateway. It calls the chemistry engine as tools and reports what they return.</div>
  </div>
</main>
<footer>Chemistry engine: crowe_copilot (RDKit, scipy). Reasoning: Crowe model stack via Foundry gateway. No third-party hosted models.</footer>
<script>
const out = document.getElementById('out');
async function analyze() {
  const smiles = document.getElementById('smiles').value.trim();
  if (!smiles) return;
  out.innerHTML = '<div class="card">Analyzing...</div>';
  try {
    const r = await fetch('/api/v1/chemistry/standardize', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({smiles})
    });
    if (!r.ok) { out.innerHTML = '<div class="card warn">Request failed ('+r.status+')</div>'; return; }
    const d = await r.json();
    let desc = '';
    if (d.descriptors) {
      desc = '<table>' + Object.entries(d.descriptors).map(
        ([k,v]) => '<tr><td>'+k+'</td><td>'+(typeof v==='number'? v.toFixed(3): v)+'</td></tr>'
      ).join('') + '</table>';
    }
    const viol = (d.lipinski_violations && d.lipinski_violations.length)
      ? '<div class="warn">Lipinski: '+d.lipinski_violations.join(', ')+'</div>'
      : '<div class="hint">No Lipinski violations.</div>';
    out.innerHTML =
      '<div class="card">' +
        '<div class="k">Standardized SMILES</div><div class="v">'+(d.std_smiles||'-')+'</div>' +
        '<div class="k">InChIKey</div><div class="v">'+(d.inchikey||'-')+'</div>' +
        '<div class="k">Descriptors</div>'+desc + viol +
      '</div>';
  } catch (e) {
    out.innerHTML = '<div class="card warn">Error: '+e.message+'</div>';
  }
}
document.getElementById('go').addEventListener('click', analyze);
document.getElementById('smiles').addEventListener('keydown', e => { if (e.key==='Enter') analyze(); });

const chat = document.getElementById('chat');
const history = [];
function bubble(role, text) {
  const d = document.createElement('div');
  d.style.cssText = 'margin:10px 0; padding:10px 12px; border-radius:10px; font-size:14px; white-space:pre-wrap; '
    + (role === 'user' ? 'background:#efe9dc; margin-left:60px;' : 'background:#fff; border:1px solid var(--line); margin-right:60px;');
  d.textContent = text;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
  return d;
}
async function ask() {
  const input = document.getElementById('ask');
  const message = input.value.trim();
  if (!message) return;
  input.value = '';
  bubble('user', message);
  const thinking = bubble('assistant', 'Thinking...');
  try {
    const r = await fetch('/api/v1/agent/chat', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({message, history, model: document.getElementById('model').value})
    });
    const d = await r.json();
    thinking.textContent = d.reply || '(no reply)';
    if (d.trace && d.trace.length) {
      const t = document.createElement('div');
      t.style.cssText = 'font:12px ui-monospace, monospace; color:var(--muted); margin:2px 60px 12px 0;';
      t.textContent = 'tools: ' + d.trace.map(x => x.tool).join(', ');
      chat.appendChild(t);
    }
    history.push({role: 'user', content: message});
    history.push({role: 'assistant', content: d.reply || ''});
  } catch (e) {
    thinking.textContent = 'Error: ' + e.message;
  }
}
document.getElementById('send').addEventListener('click', ask);
document.getElementById('ask').addEventListener('keydown', e => { if (e.key === 'Enter') ask(); });
</script>
</body>
</html>"""


@app.get("/", response_class=HTMLResponse)
async def console() -> str:
    return CONSOLE_HTML


def _free_port(preferred: int | None) -> int:
    if preferred:
        return preferred
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def main() -> None:
    ap = argparse.ArgumentParser(prog="crowe-science")
    ap.add_argument("cmd", nargs="?", default="serve", choices=["serve"])
    ap.add_argument("--port", type=int, default=None)
    ap.add_argument("--no-open", action="store_true")
    args = ap.parse_args()

    port = _free_port(args.port)
    url = f"http://127.0.0.1:{port}/?token={SESSION_TOKEN}"
    print("\n  Crowe Science")
    print(f"  Web UI -> {url}")
    print("  One-time login link. It sets a session cookie, then the daemon requires it.")
    print("  Ctrl-C to stop.\n")
    if not args.no_open:
        try:
            webbrowser.open(url)
        except Exception:
            pass

    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")


if __name__ == "__main__":
    main()
