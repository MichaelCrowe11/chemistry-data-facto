#!/bin/bash
# Build double-clickable macOS .app bundles for the Crowe workbenches.
# Operon-style thin launcher: the app starts the local daemon (which opens your
# browser with a one-time login token). Reproducible; run from the repo root.
#
#   ./package_apps.sh            # builds into ~/Applications
#
# Portability note: these bundles run the project virtualenv at BACKEND below.
# They are your-machine apps. A fully portable/signed build (bundled Python +
# RDKit) needs PyInstaller/py2app + an Apple Developer cert; see PORTABLE.md.
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$REPO/backend"
APPS="${1:-$HOME/Applications}"
mkdir -p "$APPS"

make_icns() {
  local src="$1" out="$2" t
  t="$(mktemp -d)/icon.iconset"; mkdir -p "$t"
  sips -z 16 16     "$src" --out "$t/icon_16x16.png"      >/dev/null
  sips -z 32 32     "$src" --out "$t/icon_16x16@2x.png"   >/dev/null
  sips -z 32 32     "$src" --out "$t/icon_32x32.png"      >/dev/null
  sips -z 64 64     "$src" --out "$t/icon_32x32@2x.png"   >/dev/null
  sips -z 128 128   "$src" --out "$t/icon_128x128.png"    >/dev/null
  sips -z 256 256   "$src" --out "$t/icon_128x128@2x.png" >/dev/null
  sips -z 256 256   "$src" --out "$t/icon_256x256.png"    >/dev/null
  sips -z 512 512   "$src" --out "$t/icon_256x256@2x.png" >/dev/null
  sips -z 512 512   "$src" --out "$t/icon_512x512.png"    >/dev/null
  sips -z 1024 1024 "$src" --out "$t/icon_512x512@2x.png" >/dev/null
  iconutil -c icns "$t" -o "$out"
}

make_app() {
  local name="$1" module="$2" bundle_id="$3" icon_png="$4"
  local app="$APPS/$name.app"
  rm -rf "$app"
  mkdir -p "$app/Contents/MacOS" "$app/Contents/Resources"
  make_icns "$icon_png" "$app/Contents/Resources/appicon.icns"
  cat > "$app/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>$name</string>
  <key>CFBundleDisplayName</key><string>$name</string>
  <key>CFBundleExecutable</key><string>launcher</string>
  <key>CFBundleIdentifier</key><string>$bundle_id</string>
  <key>CFBundleIconFile</key><string>appicon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>0.1.0</string>
  <key>LSMinimumSystemVersion</key><string>13.0</string>
  <key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
  cat > "$app/Contents/MacOS/launcher" <<SH
#!/bin/bash
LOGDIR="\$HOME/.crowe-workbench"; mkdir -p "\$LOGDIR"
exec env PYTHONUNBUFFERED=1 "$BACKEND/.venv/bin/python" "$BACKEND/src/$module" serve >> "\$LOGDIR/$module.log" 2>&1
SH
  chmod +x "$app/Contents/MacOS/launcher"
  touch "$app"  # nudge Finder to refresh the icon
  echo "built: $app"
}

make_app "Crowe Science"        crowe_science.py  com.crowelogic.science  "$REPO/assets/science.png"
make_app "Crowe Logic Mycology" crowe_mycology.py com.crowelogic.mycology "$REPO/assets/mycology.png"
echo "done -> $APPS"
