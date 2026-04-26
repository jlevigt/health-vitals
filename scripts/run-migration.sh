#!/bin/bash

echo "🔄 Running migrations in production..."
docker stack deploy -c infra/migrator.yml hv-migrator
