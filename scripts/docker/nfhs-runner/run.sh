#!/bin/sh
# Helper run script for local Docker development
IMAGE_NAME="nfhs-runner"
if ! docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
  echo "Building $IMAGE_NAME..."
  docker build -t "$IMAGE_NAME" -f scripts/docker/nfhs-runner/Dockerfile . || exit 1
fi

echo "Run with: docker run -d --name nfhs-runner -e NFHS_EMAIL=you@x.com -e NFHS_PASSWORD='pw' -p 127.0.0.1:3002:3002 --restart unless-stopped nfhs-runner"
