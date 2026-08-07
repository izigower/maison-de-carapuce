#!/usr/bin/env bash
# Rejoue les migrations sur un Postgres jetable et vérifie recherche + sécurité.
#
#   ./supabase/tests/run.sh
#
# Nécessite Docker. Aucun impact sur la base Supabase de production.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUPA="$(dirname "$DIR")"
CONTAINER=mdc-test
PSQL=(docker exec -e PGPASSWORD=test "$CONTAINER" psql -U postgres -d mdc)

cleanup() { docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "▸ Démarrage de Postgres…"
cleanup
docker run -d --name "$CONTAINER" \
  -e POSTGRES_PASSWORD=test -e POSTGRES_DB=mdc postgres:16 >/dev/null

for _ in $(seq 1 60); do
  docker exec "$CONTAINER" pg_isready -U postgres -d mdc >/dev/null 2>&1 && break
  sleep 1
done

# Ordre réel de Supabase : schéma, droits par défaut des rôles API,
# puis la migration qui les restreint.
FILES=(
  "$DIR/00_stubs.sql"
  "$SUPA/migrations/001_initial.sql"
  "$DIR/05_grants.sql"
  "$SUPA/migrations/002_search_moderation.sql"
  "$SUPA/seed.sql"
)
[[ -f "$SUPA/seed_tcgdex.sql" ]] && FILES+=("$SUPA/seed_tcgdex.sql")

echo "▸ Application des migrations…"
for f in "${FILES[@]}"; do
  docker cp "$f" "$CONTAINER:/tmp/current.sql" >/dev/null
  if ! "${PSQL[@]}" -v ON_ERROR_STOP=1 -q -f /tmp/current.sql >/tmp/mdc-migrate.log 2>&1; then
    echo "✗ Échec sur $(basename "$f") :"
    tail -20 /tmp/mdc-migrate.log
    exit 1
  fi
  echo "  ✓ $(basename "$f")"
done

# Les fonctions créées par 002 doivent être appelables par les rôles API.
"${PSQL[@]}" -q -c \
  "GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;" >/dev/null

for t in 10_search 20_security; do
  echo ""
  echo "════════ $t ════════"
  docker cp "$DIR/$t.sql" "$CONTAINER:/tmp/$t.sql" >/dev/null
  "${PSQL[@]}" -f "/tmp/$t.sql" 2>&1
done

echo ""
echo "▸ Terminé. Relis la sortie : dans 20_security, chaque ERROR attendue"
echo "  (policy violation, « Réservé aux conservateurs », « permission denied »)"
echo "  est un test qui PASSE."
