#!/bin/bash

# Get migration name from arguments
MIGRATION_NAME=$1

# Basic validation
if [ -z "$MIGRATION_NAME" ]; then
  echo "❌ Error: You must provide a migration name."
  echo "👉 Example: ./scripts/migration-create.sh create_users_table"
  exit 1
fi

# Create timestamp
TIMESTAMP=$(date +%s%3N)

# Sanitize name (lowercase, replace non-alphanumeric with underscores)
SAFE_NAME=$(echo "$MIGRATION_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/_/g' | sed 's/倫/_/g')

FILENAME="${TIMESTAMP}_${SAFE_NAME}.sql"
MIGRATIONS_DIR="database/migrations"

# Ensure directory exists
mkdir -p "$MIGRATIONS_DIR"

FILE_PATH="$MIGRATIONS_DIR/$FILENAME"

# Default content
cat <<EOF > "$FILE_PATH"
-- Migration: $SAFE_NAME
-- Created at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

-- Write your SQL below.
-- Use BEGIN and COMMIT to ensure atomic transactions.

BEGIN;

-- CREATE TABLE ...

COMMIT;
EOF

echo "✅ Migration created successfully!"
echo "📄 File: $FILE_PATH"
