#!/bin/bash

echo "🚀 Deploying infrastructure stack..."
docker stack deploy -c infra/infra.yml hv-infra
