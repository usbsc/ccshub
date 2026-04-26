import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { URL } from 'url';

// Minimal helper server using built-in http to avoid external deps (works in offline envs)
// Provides endpoints used by Admin UI: POST /api/temp-nfhs-token, POST /api/generate-highlights, GET /api/broadcasts/videos

let nfhsAuth = { token: null, username: null, expiresAt: 0 };
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const HIGHLIGHTS_DIR = path.join(PUBLIC_DIR, 'highlights');
const CLIPS_DIR = path.join(HIGHLIGHTS_DIR, 'clips');
fs.mkdirSync(CLIPS_DIR, { recursive: true });

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body);
}

function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

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

async function handleTempToken(req, res) {
  try {
    const body = await parseJSONBody(req);
    const { email, username, password } = body || {};
    const identity = email || username;
    if (!identity || !password) return sendJSON(res, 400, { error: 'email and password required' });

    // initial GET to establish cookies
    const baseResp = await fetch('https://www.nfhsnetwork.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
    });
    let cookieHeader = '';
    try {
      const sc = baseResp.headers.get('set-cookie');
      if (sc) cookieHeader = sc;
    } catch (e) {}

    // Try JSON POST
    let resp = await fetch('https://www.nfhsnetwork.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0',
        'Origin': 'https://www.nfhsnetwork.com',
        'Referer': 'https://www.nfhsnetwork.com/',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify({ email: identity, password }),
    });

    if (!resp.ok && resp.status === 403) {
      const formBody = new URLSearchParams({ email: identity, password }).toString();
      resp = await fetch('https://www.nfhsnetwork.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0',
          'Origin': 'https://www.nfhsnetwork.com',
          'Referer': 'https://www.nfhsnetwork.com/',
          'X-Requested-With': 'XMLHttpRequest',
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        body: formBody,
      });
    }

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      // CloudFront 403 - give actionable guidance for admin to run headless login locally
      if (resp.status === 403 && /cloudfront/i.test(txt)) {
        return sendJSON(res, 403, {
          error: 'NFHS auth blocked by CloudFront (403). Use a local headless login to bypass.',
          suggestion: 'Install Chrome and run: cd ccshub && npm install puppeteer --legacy-peer-deps && NODE_ENV=development USE_HEADLESS_LOGIN=1 node scripts/server.mjs',
          upstreamBodyPreview: txt.slice(0, 1000),
        });
      }
      const ct = resp.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        try {
          const json = JSON.parse(txt);
          return sendJSON(res, resp.status, { error: 'NFHS auth failed', status: resp.status, upstream: json });
        } catch (e) {
          return sendJSON(res, resp.status, { error: 'NFHS auth failed', status: resp.status, upstreamBodyPreview: txt.slice(0, 1000) });
        }
      }
      return sendJSON(res, resp.status, { error: 'NFHS auth failed', status: resp.status, upstreamBodyPreview: txt.slice(0, 1000) });
    }

    const data = await resp.json().catch(() => ({}));
    nfhsAuth.token = data.token || data.access_token || null;
    nfhsAuth.username = username;
    nfhsAuth.expiresAt = Date.now() + 5 * 60 * 1000;
    return sendJSON(res, 200, { ok: true, expiresAt: nfhsAuth.expiresAt });
  } catch (e) {
    console.error('auth error', e);
    return sendJSON(res, 500, { error: String(e) });
  }
}

// Allow manual token paste from Admin UI: POST /api/set-token
async function handleSetToken(req, res) {
  try {
    const body = await parseJSONBody(req);
    const { token } = body || {};
    if (!token) return sendJSON(res, 400, { error: 'token required' });
    nfhsAuth.token = token;
    nfhsAuth.username = 'manual';
    nfhsAuth.expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    return sendJSON(res, 200, { ok: true, expiresAt: nfhsAuth.expiresAt });
  } catch (e) {
    console.error('set token error', e);
    return sendJSON(res, 500, { error: String(e) });
  }
}

async function handleGenerate(req, res) {
  try {
    if (!nfhsAuth.token || nfhsAuth.expiresAt < Date.now()) return sendJSON(res, 401, { error: 'Not authenticated or token expired' });
    const videos = await fetchVideos();
    const plays = [];
    for (const v of videos) {
      const found = extractPlaysFromText(v.title, v.description);
      for (const f of found) {
        plays.push({ id: `play-${v.id}-${f.timestamp}`, videoId: v.id, videoUrl: v.url, title: v.title, thumbnailUrl: v.thumbnailUrl, date: v.date, ...f, duration: 10 });
      }
    }
    const sorted = plays.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    const week = Math.ceil((Date.now() - new Date(new Date().getFullYear(),8,1).getTime())/(7*24*3600*1000));
    const outMeta = { week, generatedAt: new Date().toISOString(), plays: sorted };
    try { fs.mkdirSync(HIGHLIGHTS_DIR, { recursive: true }); } catch (e) {}
    const metaPath = path.join(HIGHLIGHTS_DIR, `week-${week}.json`);
    fs.writeFileSync(metaPath, JSON.stringify(outMeta, null, 2), 'utf-8');
    const ffmpegAvailable = (() => { try { execSync('ffmpeg -version', { stdio: 'ignore' }); return true; } catch (e) { return false; } })();
    for (const p of sorted) {
      const outClip = path.join(CLIPS_DIR, `${p.id}.mp4`);
      if (fs.existsSync(outClip)) continue;
      if (!ffmpegAvailable) continue;
      try { const cmd = `ffmpeg -y -ss ${p.timestamp} -i "${p.videoUrl}" -t ${p.duration} -c copy "${outClip}"`; execSync(cmd, { stdio: 'ignore', timeout: 1000 * 60 * 2 }); } catch (e) { console.warn('ffmpeg clip failed for', p.id, e.message || e); }
    }
    return sendJSON(res, 200, { ok: true, metaPath: `/highlights/week-${week}.json`, clipsAvailable: ffmpegAvailable });
  } catch (e) {
    console.error('generate error', e);
    return sendJSON(res, 500, { error: String(e) });
  }
}

function serveStatic(req, res, parsedUrl) {
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) return sendJSON(res, 403, { error: 'Forbidden' });
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return sendJSON(res, 404, { error: 'Not found' });
    const stream = fs.createReadStream(filePath);
    res.writeHead(200, { 'Content-Type': lookupContentType(filePath) });
    stream.pipe(res);
  });
}
function lookupContentType(p) {
  if (p.endsWith('.json')) return 'application/json';
  if (p.endsWith('.html')) return 'text/html';
  if (p.endsWith('.js')) return 'application/javascript';
  if (p.endsWith('.css')) return 'text/css';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.end();

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (req.method === 'POST' && parsedUrl.pathname === '/api/temp-nfhs-token') return await handleTempToken(req, res);
    if (req.method === 'POST' && parsedUrl.pathname === '/api/set-token') return await handleSetToken(req, res);
    if (req.method === 'POST' && parsedUrl.pathname === '/api/generate-highlights') return await handleGenerate(req, res);
    if (req.method === 'GET' && parsedUrl.pathname === '/api/broadcasts/videos') {
      try { if (!nfhsAuth.token || nfhsAuth.expiresAt < Date.now()) return sendJSON(res, 401, { error: 'Not authenticated or token expired' }); const videos = await fetchVideos(); return sendJSON(res, 200, { videos }); } catch (e) { return sendJSON(res, 500, { error: String(e) }); }
    }
    // static files
    if (req.method === 'GET') return serveStatic(req, res, parsedUrl);
    return sendJSON(res, 404, { error: 'Not found' });
  } catch (e) {
    console.error('server error', e);
    return sendJSON(res, 500, { error: String(e) });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => console.log(`NFHS helper server listening on http://0.0.0.0:${PORT}/`));
