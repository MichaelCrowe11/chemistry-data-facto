# Packaging the Crowe workbenches

## What exists now
Two double-clickable macOS apps, built by `./package_apps.sh` into `~/Applications`:

- **Crowe Science.app** (chemistry workbench)
- **Crowe Logic Mycology.app** (cultivation workbench)

Each is a thin launcher (operon model): double-click starts the local daemon, which
opens your browser with a one-time login token. Launcher output is logged to
`~/.crowe-workbench/<module>.log` so a failed launch is debuggable.

Rebuild after code changes:

```
./package_apps.sh
```

## The honest limit
These bundles run the project virtualenv at `backend/.venv`. They are **your-machine
apps**: they will not run on another Mac, because the Python interpreter and the
native dependencies (RDKit, numpy, scipy) live in that venv, not inside the bundle.

## Path to a portable, distributable build (larger effort)
1. **Bundle Python + deps** with PyInstaller (or py2app). RDKit / numpy / scipy ship
   native extensions, so this needs `--collect-all rdkit`, hidden-import hooks, and a
   test pass on a clean machine. Expect a large bundle.
2. **Code sign + notarize** with an Apple Developer ID, or the app is quarantined on
   any machine that downloads it (Gatekeeper).
3. Optionally split into a thin native launcher + a compiled payload, the way Claude
   Science does it, once the payload builds cleanly.

Until then, the `package_apps.sh` bundles are the right tool for running the apps on
this machine.
