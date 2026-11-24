#!/usr/bin/env bash
# Sobe um Postgres temporário, aplica a migration e roda os testes de acesso.
# Uso: bash supabase/testes/rodar-testes.sh  (precisa do Postgres 15+ instalado)
set -euo pipefail
PASTA="$(cd "$(dirname "$0")" && pwd)"
BIN="${PG_BIN:-$(dirname "$(command -v pg_ctl || ls /usr/lib/postgresql/*/bin/pg_ctl | tail -1)")}"
DADOS="$(mktemp -d)"
PORTA=54329
trap '"$BIN/pg_ctl" -D "$DADOS" stop -m fast >/dev/null 2>&1 || true; rm -rf "$DADOS"' EXIT
"$BIN/initdb" -D "$DADOS" -U postgres --auth=trust >/dev/null
"$BIN/pg_ctl" -D "$DADOS" -o "-p $PORTA -k $DADOS" -l "$DADOS/log" start >/dev/null
P="psql -h $DADOS -p $PORTA -U postgres -d postgres -v ON_ERROR_STOP=1 -q"
$P -f "$PASTA/00-ambiente-local.sql"
$P -f "$PASTA/../migrations/20261118000000_inicial.sql"
$P -f "$PASTA/10-dados-teste.sql"
$P -f "$PASTA/20-testes-acesso.sql"
