NFHS headless runner: set-and-forget instructions

Options:

1) systemd (recommended on a server)
- Copy scripts/nfhs-runner.service to /etc/systemd/system/nfhs-runner.service
- Edit environment vars via /etc/default/nfhs-runner or systemctl set-environment
- Commands:
    sudo systemctl daemon-reload
    sudo systemctl enable --now nfhs-runner
    sudo journalctl -u nfhs-runner -f

2) Docker (no sudo privilege needed on host if Docker is available)
- Build and run using scripts/docker/nfhs-runner/README.md commands.

3) Local file (quick)
- Create credential file: mkdir -p ~/.nfhs && printf '{"email":"you@x.com","password":"yourpass"}' > ~/.nfhs/credentials.json && chmod 600 ~/.nfhs/credentials.json
- Runner will detect credentials and obtain tokens. Token endpoint: http://127.0.0.1:3002/token

Security:
- Set NFHS_RUNNER_SECRET to require X-Runner-Secret header when fetching /token.
- Protect credentials and token files (600 perms).

Integration:
- Point helper server (scripts/server.mjs) or backend to fetch token from http://127.0.0.1:3002/token and pass X-Runner-Secret header if configured.
