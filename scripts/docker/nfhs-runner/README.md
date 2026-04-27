Quick Docker usage for NFHS headless runner

Build image:
  cd ccshub
  docker build -t nfhs-runner -f scripts/docker/nfhs-runner/Dockerfile .

Run container (recommended):
  docker run -d --name nfhs-runner \
    -e NFHS_EMAIL=you@example.com -e NFHS_PASSWORD='yourpass' \
    -e NFHS_RUNNER_SECRET='set-a-secret' \
    -p 127.0.0.1:3002:3002 \
    --restart unless-stopped nfhs-runner

Notes:
- The container exposes the token endpoint on host 127.0.0.1:3002/token.
- Provide credentials via NFHS_EMAIL/NFHS_PASSWORD env vars or mount a credentials.json at /root/.nfhs/credentials.json inside container.
- Set NFHS_RUNNER_SECRET to require X-Runner-Secret when fetching the token.
