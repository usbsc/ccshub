FROM node:24-bullseye-slim

# Install Chromium and minimal deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends chromium wget ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files to install production deps
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --production --no-audit --no-fund; else npm install --production --no-audit --no-fund; fi

# Copy runner
COPY scripts/nfhs-headless-runner.mjs ./scripts/

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
EXPOSE 3002
CMD ["node", "scripts/nfhs-headless-runner.mjs"]
