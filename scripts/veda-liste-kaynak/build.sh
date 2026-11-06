#!/bin/bash
cd "$(dirname "$0")"
OUT="$1"
{ echo "(() => {"; cat a-core.js b-data.js c-charts.js d-views.js e-export.js f-main.js; echo "})();"; } > "$OUT"
node --check "$OUT" && wc -c "$OUT"
# Küçültme (yayın): node_modules/.bin/esbuild "$OUT" --minify --target=es2020 --outfile="$OUT"
