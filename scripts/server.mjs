import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const app = express();
app.use(bodyParser.json({ limit: '5mb' }));

// Allow CORS for local dev (Admin UI on different port). On production (GitHub Pages) admin UI is hidden.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// In-memory NFHS auth
let nfhsAuth = {
  token: null,
  username: null,
  expiresAt: 0,
};

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const HIGHLIGHTS_DIR = path.join(PUBLIC_DIR, 'highlights');
const CLIPS_DIR = path.join(HIGHLIGHTS_DIR, 'clips');
fs.mkdirSync(CLIPS_DIR, { recursive: true });

app.post('/api/temp-nfhs-token', async (req, res) => {
  const { email, username, password } = req.body || {};
  const identity = email || username;
  if (!identity || !password) return res.status(400).json({ error: 'email and password required' });

  try {
    // Perform an initial GET to establish cookies/session that CloudFront/WAF may require
    const baseResp = await fetch('https://www.nfhsnetwork.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    let cookieHeader = '';
    try {
      const sc = baseResp.headers.get('set-cookie');
      if (sc) cookieHeader = sc;
    } catch (e) { /* ignore */ }

    // Attempt JSON POST with cookies (closest to browser XHR)
    let resp = await fetch('https://www.nfhsnetwork.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://www.nfhsnetwork.com',
        'Referer': 'https://www.nfhsnetwork.com/',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify({ email: identity, password }),
    });

    // If CloudFront rejects JSON POST (403), try a form-encoded POST with the same cookies
    if (!resp.ok && resp.status === 403) {
      console.warn('NFHS JSON login returned 403 — attempting form-encoded fallback');
      const formBody = new URLSearchParams({ email: identity, password }).toString();
      resp = await fetch('https://www.nfhsnetwork.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': 'https://www.nfhsnetwork.com',
          'Referer': 'https://www.nfhsnetwork.com/',
          'X-Requested-With': 'XMLHttpRequest',
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        body: formBody,
      });
    }

    // Handle non-OK upstream responses more verbosely
    if (!resp.ok) {
      // If configured, attempt a headless browser login (requires puppeteer and USE_HEADLESS_LOGIN=1)
      if (resp.status === 403 && process.env.USE_HEADLESS_LOGIN === '1') {
        try {
          console.warn('Attempting headless browser login via puppeteer');
          const puppeteer = await import('puppeteer');
          const launchOpts = { args: ['--no-sandbox', '--disable-setuid-sandbox'] };
          if (process.env.PUPPETEER_EXECUTABLE_PATH) launchOpts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
          const browser = await puppeteer.launch(launchOpts);
          const page = await browser.newPage();
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
          await page.goto('https://www.nfhsnetwork.com/login', { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
          // Try to fill common selectors; site may differ.
          try { await page.type('input[name="username"]', username, { delay: 50 }); } catch (e) {}
          try { await page.type('input[name="password"]', password, { delay: 50 }); } catch (e) {}
          try { await Promise.all([page.click('button[type="submit"]'), page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 })]); } catch (e) {}
          // Try to extract token from localStorage or cookies
          const token = await page.evaluate(() => {
            try { return localStorage.getItem('token') || localStorage.getItem('access_token') || null; } catch (e) { return null; }
          });
          const cookies = await page.cookies();
          await browser.close();
          if (token) {
            nfhsAuth.token = token;
            nfhsAuth.username = username;
            nfhsAuth.expiresAt = Date.now() + 5 * 60 * 1000;
            return res.json({ ok: true, expiresAt: nfhsAuth.expiresAt, method: 'headless-token' });
          }
          return res.status(502).json({ error: 'NFHS auth failed (headless attempt)', status: 502, cookies: cookies.map(c => ({ name: c.name, domain: c.domain })) });
        } catch (e) {
          console.error('Headless login failed', e);
          // fall through to normal handling
        }
      }

      const txt = await resp.text();
      console.error('NFHS auth response status:', resp.status);
      console.error('NFHS auth response body (truncated):', txt.slice(0, 1000));
      const ct = resp.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        try {
          const json = JSON.parse(txt);
          return res.status(resp.status).json({ error: 'NFHS auth failed', status: resp.status, upstream: json });
        } catch (e) {
          return res.status(resp.status).json({ error: 'NFHS auth failed', status: resp.status, upstreamBodyPreview: txt.slice(0, 1000) });
        }
      }
      return res.status(resp.status).json({ error: 'NFHS auth failed', status: resp.status, upstreamBodyPreview: txt.slice(0, 1000) });
    }

    const data = await resp.json();
    nfhsAuth.token = data.token || data.access_token || null;
    nfhsAuth.username = username;
    nfhsAuth.expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    return res.json({ ok: true, expiresAt: nfhsAuth.expiresAt });
  } catch (e) {
    console.error('auth error', e);
    return res.status(500).json({ error: e.message || String(e) });
  }
});

function normalizePlayType(type) {
  const s = (type || '').toLowerCase();
  if (s.includes('touchdown') || s.includes('td')) return 'touchdown';
  if (s.includes('sack')) return 'sack';
  if (s.includes('interception') || s.includes('int')) return 'interception';
  if (s.includes('fumble')) return 'fumble';
  return 'other';
}

function parseTimestamp(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(x => parseInt(x));
  if (parts.length === 1) return parts[0] || 0;
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

async function fetchVideos() {
  if (!nfhsAuth.token) throw new Error('Not authenticated');
  const resp = await fetch('https://www.nfhsnetwork.com/api/broadcasts/videos', {
    headers: { Authorization: `Bearer ${nfhsAuth.token}`, 'Content-Type': 'application/json' },
  });
  if (!resp.ok) throw new Error(`NFHS videos fetch failed: ${resp.status}`);
  const json = await resp.json();
  return json.videos || [];
}

function extractPlaysFromText(title, description) {
  const plays = [];
  const full = `${title || ''} ${description || ''}`;
  const re = /([A-Za-z\s]+?)\s*[-–]\s*([A-Za-z\s]+?)\s*#?(\d+)?\s*[-–]\s*(touchdown|sack|interception|fumble|pass|run|catch)\s*(?:at|@)?\s*(\d+:?\d*)?/gi;
  let m;
  while ((m = re.exec(full)) !== null) {
    const team = (m[1] || '').trim();
    const player = (m[2] || '').trim();
    const num = m[3] ? parseInt(m[3]) : undefined;
    const type = normalizePlayType(m[4] || '');
    const ts = parseTimestamp(m[5]);
    plays.push({ team, player, playerNumber: num, playType: type, timestamp: ts, description: `${player} ${type}` });
  }
  return plays;
}

app.post('/api/generate-highlights', async (req, res) => {
  if (!nfhsAuth.token || nfhsAuth.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Not authenticated or token expired' });
  }

  try {
    const videos = await fetchVideos();
    const plays = [];
    for (const v of videos) {
      const found = extractPlaysFromText(v.title, v.description);
      for (const f of found) {
        plays.push({
          id: `play-${v.id}-${f.timestamp}`,
          videoId: v.id,
          videoUrl: v.url,
          title: v.title,
          thumbnailUrl: v.thumbnailUrl,
          date: v.date,
          ...f,
          duration: 10,
        });
      }
    }

    // Take top 10 newest
    const sorted = plays.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    const week = Math.ceil((Date.now() - new Date(new Date().getFullYear(),8,1).getTime())/(7*24*3600*1000));
    const outMeta = { week, generatedAt: new Date().toISOString(), plays: sorted };

    const metaPath = path.join(HIGHLIGHTS_DIR, `week-${week}.json`);
    fs.writeFileSync(metaPath, JSON.stringify(outMeta, null, 2), 'utf-8');

    // Try to create per-play clips using ffmpeg if available
    const ffmpegAvailable = (() => {
      try { execSync('ffmpeg -version', { stdio: 'ignore' }); return true; } catch (e) { return false; }
    })();

    for (const p of sorted) {
      const outClip = path.join(CLIPS_DIR, `${p.id}.mp4`);
      if (fs.existsSync(outClip)) continue;
      if (!ffmpegAvailable) continue;
      try {
        // Use ffmpeg to create a short clip. If NFHS requires auth headers, ffmpeg may not work; this is best-effort.
        const cmd = `ffmpeg -y -ss ${p.timestamp} -i "${p.videoUrl}" -t ${p.duration} -c copy "${outClip}"`;
        execSync(cmd, { stdio: 'ignore', timeout: 1000 * 60 * 2 });
      } catch (e) {
        console.warn('ffmpeg clip failed for', p.id, e.message || e);
      }
    }

    return res.json({ ok: true, metaPath: `/highlights/week-${week}.json`, clipsAvailable: ffmpegAvailable });
  } catch (e) {
    console.error('generate error', e);
    return res.status(500).json({ error: e.message || String(e) });
  }
});

// Serve static public directory so highlights are accessible
app.use('/', express.static(PUBLIC_DIR, { index: false }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`NFHS helper server listening on http://0.0.0.0:${PORT}/`);
  console.log('Endpoints: POST /api/temp-nfhs-token, POST /api/generate-highlights');
});
