#!/bin/bash

echo "🚀 Deploying application stack..."
docker stack deploy -c infra/app.yml hv-app
