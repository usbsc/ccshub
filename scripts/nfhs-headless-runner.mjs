#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const HOME = process.env.HOME || '/home/usb';
const STORE_DIR = path.join(HOME, '.nfhs');
const CRED_PATH = process.env.NFHS_CREDENTIALS_PATH || path.join(STORE_DIR, 'credentials.json');
const TOKEN_PATH = process.env.NFHS_TOKEN_PATH || path.join(STORE_DIR, 'token.json');
const LOG_PATH = process.env.NFHS_RUNNER_LOG || path.join(STORE_DIR, 'runner.log');
const HTTP_PORT = process.env.NFHS_RUNNER_PORT || 3002;
const RUNNER_SECRET = process.env.NFHS_RUNNER_SECRET || null;

function ensureDir() {
  try { fs.mkdirSync(STORE_DIR, { recursive: true, mode: 0o700 }); } catch (e) {}
}

function saveToken(tokenObj) {
  try {
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenObj, null, 2), { mode: 0o600 });
  } catch (e) {
    console.error('Failed writing token file', e);
  }
}

function readCredentials() {
  const envEmail = process.env.NFHS_EMAIL;
  const envPassword = process.env.NFHS_PASSWORD;
  if (envEmail && envPassword) return { email: envEmail, password: envPassword };
  try {
    const txt = fs.readFileSync(CRED_PATH, 'utf-8');
    return JSON.parse(txt);
  } catch (e) {
    return null;
  }
}

async function sleep(ms) { await new Promise(r => setTimeout(r, ms)); }

async function headlessLogin(email, password) {
  const execPath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
  let puppeteer;
  try {
    try { puppeteer = await import('puppeteer-core'); } catch (e) { puppeteer = await import('puppeteer'); }
  } catch (e) {
    throw new Error('puppeteer or puppeteer-core not installed');
  }

  const launchOpts = { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] };
  if (execPath) launchOpts.executablePath = execPath;

  const browser = await puppeteer.launch(launchOpts);
  try {
    const page = await browser.newPage();
    await page.goto('https://www.nfhsnetwork.com/', { waitUntil: 'networkidle2', timeout: 30000 });

    const result = await page.evaluate(async (id, pw) => {
      // Try JSON
      try {
        const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ email: id, password: pw }) });
        const txt = await r.text();
        try { return { status: r.status, body: JSON.parse(txt) }; } catch (e) { return { status: r.status, bodyText: txt }; }
      } catch (e) {}
      // Try form
      try {
        const form = new URLSearchParams({ email: id, password: pw }).toString();
        const r2 = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: form });
        const txt2 = await r2.text();
        try { return { status: r2.status, body: JSON.parse(txt2) }; } catch (e) { return { status: r2.status, bodyText: txt2 }; }
      } catch (e) {}
      return { status: 0 };
    }, email, password);

    if (result && result.status === 200) {
      const body = result.body || {};
      const token = body.token || body.access_token || (body.data && body.data.token);
      if (token) return { token, raw: body };
      // try localStorage
      try {
        const ls = await page.evaluate(() => JSON.stringify(window.localStorage || {}));
        const store = JSON.parse(ls || '{}');
        for (const k of Object.keys(store)) {
          if (/token|auth/i.test(k) && typeof store[k] === 'string' && store[k].length > 20) return { token: store[k], raw: { fromLocalStorage: k } };
        }
      } catch (e) {}
    }

    throw new Error(`Headless login failed (status ${result && result.status})`);
  } finally {
    try { await browser.close(); } catch (e) {}
  }
}

async function runOnce(creds) {
  const start = Date.now();
  try {
    console.log(`[nfhs-runner] attempting login for ${creds.email}`);
    const res = await headlessLogin(creds.email, creds.password);
    const expiresAt = Date.now() + 5 * 60 * 1000; // helper uses 5 minutes
    const tokenObj = { token: res.token, expiresAt, obtainedAt: new Date().toISOString(), source: 'headless', raw: res.raw };
    saveToken(tokenObj);
    console.log('[nfhs-runner] login success, saved token');
    return tokenObj;
  } catch (e) {
    console.error('[nfhs-runner] login failed', e && e.message);
    return null;
  } finally {
    const dur = Date.now() - start;
    fs.appendFileSync(LOG_PATH, `${new Date().toISOString()} runOnce duration=${dur}ms\n`);
  }
}

function startHttpServer() {
  const http = awaitImport('http');
}

function awaitImport(name) {
  return new Promise((resolve, reject) => {
    import(name).then((m) => resolve(m)).catch(reject);
  });
}

async function httpServerMain() {
  const http = await import('http');
  const server = http.createServer((req, res) => {
    // only allow localhost
    const addr = req.socket.remoteAddress;
    if (!(addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1')) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'forbidden' }));
      return;
    }
    if (RUNNER_SECRET) {
      const secret = req.headers['x-runner-secret'] || req.headers['x-runner-token'];
      if (secret !== RUNNER_SECRET) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'unauthorized' }));
        return;
      }
    }

    if (req.method === 'GET' && req.url === '/token') {
      try {
        const txt = fs.readFileSync(TOKEN_PATH, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(txt);
      } catch (e) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'no token' }));
      }
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
  });

  server.listen(HTTP_PORT, '127.0.0.1', () => console.log(`[nfhs-runner] http server listening on http://127.0.0.1:${HTTP_PORT}/token`));
}

async function main() {
  ensureDir();
  // start http server
  httpServerMain().catch((e)=>console.error('http server failed', e));

  let creds = readCredentials();
  while (!creds || !creds.email || !creds.password) {
    console.warn('[nfhs-runner] no credentials found. Waiting for credentials (env NFHS_EMAIL/NFHS_PASSWORD or file: ' + CRED_PATH + ')');
    // wait and re-check
    // eslint-disable-next-line no-await-in-loop
    await sleep(30 * 1000);
    creds = readCredentials();
  }

  // Main loop
  while (true) {
    const tokenObj = await runOnce(creds);
    if (tokenObj && tokenObj.expiresAt) {
      const wait = Math.max(30 * 1000, tokenObj.expiresAt - Date.now() - 60 * 1000); // refresh 60s before expiry
      await sleep(wait);
    } else {
      // backoff on failure
      await sleep(60 * 1000);
    }
  }
}

main().catch(e => { console.error('Runner crashed', e); process.exit(1); });
