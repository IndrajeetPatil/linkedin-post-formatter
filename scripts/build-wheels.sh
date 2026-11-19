#!/usr/bin/env bash
# Cross-compiles the packages in wheels/requirements.txt to WebAssembly wheels
# for the Pyodide release pinned in package.json, writing them to src/wheels/.
# Needs uv and rustup; Emscripten and the Rust target are installed on demand.
set -euo pipefail
cd "$(dirname "$0")/.."

pyodide_version=$(node -p 'require("pyodide/package.json").version')
pyodide() { uvx --python 3.14 --from 'pyodide-build[resolve]==0.39.4' pyodide "$@"; }

pyodide xbuildenv install "$pyodide_version"
pyodide xbuildenv install-emscripten
rust_toolchain=$(pyodide config get rust_toolchain)
rustup toolchain install "$rust_toolchain" --profile minimal --target wasm32-unknown-emscripten

rm -rf src/wheels
RUSTUP_TOOLCHAIN=$rust_toolchain pyodide build -r wheels/requirements.txt -o src/wheels
ls -l src/wheels
