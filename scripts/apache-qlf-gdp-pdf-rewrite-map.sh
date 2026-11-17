#!/usr/bin/env bash
# RewriteMap prg pour le relais panier PDF (VirtualHost qualif / prod).
#
# Entrée (stdin, une ligne par lookup Apache) : chaîne QUERY_STRING, ex.
#   url=https%3A%2F%2Fdata.geopf.fr%2Fannexes%2Fgeodesie%2F...
# Sortie (stdout) : URL cible décodée, ou "-" si refus / paramètre absent.
#
# Liste blanche alignée sur @ign/gdp-tools (isAllowedGeodesyPdfFetchUrl) :
#   *.ign.fr, ign.fr, *.geopf.fr, geopf.fr — http/https uniquement.
#
# Dépendance : python3 (stdlib urllib).
# Déploiement typique : /etc/apache2/gdp/apache-qlf-gdp-pdf-rewrite-map.sh (chmod 755).
# Référence VirtualHost : scripts/apache-qlf-gdp.conf.example

set -euo pipefail

while IFS= read -r query || [[ -n "${query:-}" ]]; do
  /usr/bin/python3 - "$query" <<'PY'
import sys
import urllib.parse

query = sys.argv[1] if len(sys.argv) > 1 else ""
params = urllib.parse.parse_qs(query, keep_blank_values=False)
raw_urls = params.get("url") or []
if not raw_urls:
    print("-")
    raise SystemExit(0)

target = raw_urls[0].strip()
if not target:
    print("-")
    raise SystemExit(0)

try:
    parsed = urllib.parse.urlparse(target)
except ValueError:
    print("-")
    raise SystemExit(0)

if parsed.scheme not in ("http", "https"):
    print("-")
    raise SystemExit(0)

host = (parsed.hostname or "").lower()
allowed = (
    host == "ign.fr"
    or host.endswith(".ign.fr")
    or host == "geopf.fr"
    or host.endswith(".geopf.fr")
)
print(target if allowed else "-")
PY
done
