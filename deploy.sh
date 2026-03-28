#!/bin/bash
# Havbruk Prisportal – deploy script for Hetzner
# Run this on the server after cloning the repo.
# Usage: ./deploy.sh

set -e

echo "=== Havbruk Prisportal Deploy ==="

# Check .env exists
if [ ! -f .env ]; then
  echo "ERROR: .env file missing. Copy .env.example and fill in values."
  exit 1
fi

# Pull latest code (if using git on server)
if [ -d .git ]; then
  echo ">>> Pulling latest code..."
  git pull
fi

# Build and restart containers
echo ">>> Building containers..."
docker compose -f docker-compose.prod.yml --env-file .env build --no-cache

echo ">>> Starting containers..."
docker compose -f docker-compose.prod.yml --env-file .env up -d

echo ">>> Waiting for backend to start..."
sleep 5

# Show status
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=== Deploy complete ==="
echo "App should be running on port 80."
echo "Check logs: docker compose -f docker-compose.prod.yml logs -f"
