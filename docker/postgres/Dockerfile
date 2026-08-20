FROM postgres:16-alpine

# The official PostgreSQL entrypoint executes these files in lexical order
# exactly once when it initializes an empty data directory.
COPY prisma/migrations/20260724130000_postgresql_baseline/migration.sql \
  /docker-entrypoint-initdb.d/001-schema.sql
COPY prisma/migrations/20260820123000_add_audit_events/migration.sql \
  /docker-entrypoint-initdb.d/002-audit-events.sql
COPY docker/postgres/002-seed.sql \
  /docker-entrypoint-initdb.d/003-seed.sql
