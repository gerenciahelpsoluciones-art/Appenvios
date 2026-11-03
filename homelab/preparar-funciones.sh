#!/usr/bin/env bash
# Copia las funciones del repositorio (supabase/functions) a homelab/functions,
# junto con el enrutador main/. Se corre cada vez que cambie una función.
set -euo pipefail
cd "$(dirname "$0")"
ORIGEN="${1:-../supabase/functions}"

rm -rf functions
mkdir -p functions
for f in _shared send-email siigo-proxy; do
  cp -r "$ORIGEN/$f" functions/
done
cp -r functions-main functions/main
echo "Funciones listas: $(ls functions | tr '\n' ' ')"
