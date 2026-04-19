#!/bin/sh
set -e

echo "Waiting for ChromaDB at ${CHROMA_URL:-http://chromadb:8000}..."
until curl -sf "${CHROMA_URL:-http://chromadb:8000}/api/v2/heartbeat" > /dev/null 2>&1; do
  sleep 1
done
echo "ChromaDB is ready."

echo "Running ingest..."
npx tsx src/ingest.ts

echo "Starting server..."
exec node dist/server.js
