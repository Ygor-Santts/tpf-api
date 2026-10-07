#!/bin/sh
# Daily backup of the database and the portfolio files, kept for 7 days.
# Run from the tpf-api folder on the server; the cron line is in the README.
set -eu
cd "$(dirname "$0")/.."
DIR=backups
DAY=$(date +%F)
mkdir -p "$DIR"
dc() { docker compose --env-file .env.server -f docker-compose.server.yml "$@"; }

dc exec -T db sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --no-tablespaces --single-transaction "$MYSQL_DATABASE"' \
  | gzip > "$DIR/banco-$DAY.sql.gz"
dc exec -T api tar -czf - -C /usr/src uploads > "$DIR/fotos-$DAY.tar.gz"

find "$DIR" -type f -mtime +7 -delete
echo "Backup ok: $DIR/banco-$DAY.sql.gz $DIR/fotos-$DAY.tar.gz"
