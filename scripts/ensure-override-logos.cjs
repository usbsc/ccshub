#!/usr/bin/env node
/*
Ensure every team from teams.override has a local logo.
- Reads src/app/data/teams.override.ts to get the simplified list
- Reads src/app/data/teams.maxpreps.generated.ts to reuse existing maxpreps entries
- For each override entry, tries to: use existing local maxpreps logo; else download maxpreps remote logo if present; else download override.logo_url; else create placeholder SVG
- Writes files to public/logos/maxpreps/<id>.<ext>
- Updates teams.maxpreps.generated.ts to include/point to local schoolMascotUrl entries
*/

const fs = require('fs');
const path = require('path');
const https = require('https');

function fetchBuffer(url, timeout = 20000) {
  return new Promise((resolve, reject) => {
    try {
      const req = https.get(url, { timeout }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve(fetchBuffer(res.headers.location, timeout));
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error('Status ' + res.statusCode));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ buf: Buffer.concat(chunks), contentType: res.headers['content-type'] || null }));
      });
      req.on('error', reject);
      req.on('timeout', () => req.destroy(new Error('timeout')));
    } catch (err) {
      reject(err);
    }
  });
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getExtFromContentType(ct) {
  if (!ct) return 'png';
  if (ct.includes('png')) return 'png';
  if (ct.includes('gif')) return 'gif';
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg';
  if (ct.includes('svg')) return 'svg';
  return 'png';
}

function createPlaceholderSvg(initials, primary = '#111827', secondary = '#3b82f6') {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">\n  <defs>\n    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">\n      <stop offset="0" stop-color="${primary}"/>\n      <stop offset="1" stop-color="${secondary}"/>\n    </linearGradient>\n  </defs>\n  <rect x="8" y="8" width="240" height="240" rx="48" fill="url(#g)"/>\n  <rect x="16" y="16" width="224" height="224" rx="40" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="8"/>\n  <text x="128" y="140" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="88" font-weight="900" fill="rgba(255,255,255,0.95)" letter-spacing="2">${initials}</text>\n</svg>`;
}

function getInitialsFromName(name) {
  const words = name.replace(/[^a-zA-Z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1) return (words[0].slice(0, 2)).toUpperCase();
  return 'CC';
}

(async function main(){
  const repoRoot = path.resolve(__dirname, '..');
  const overridePath = path.join(repoRoot, 'src', 'app', 'data', 'teams.override.ts');
  const mpPath = path.join(repoRoot, 'src', 'app', 'data', 'teams.maxpreps.generated.ts');
  const outDir = path.join(repoRoot, 'public', 'logos', 'maxpreps');
  ensureDir(outDir);

  if (!fs.existsSync(overridePath)) {
    console.error('Missing', overridePath);
    process.exit(2);
  }
  if (!fs.existsSync(mpPath)) {
    console.error('Missing', mpPath);
    process.exit(3);
  }

  const overrideSrc = fs.readFileSync(overridePath, 'utf8');
  const arrMatch = overrideSrc.match(/export const baseTeamsOverride[\s\S]*?=\s*(\[[\s\S]*\])\s*;/);
  if (!arrMatch) {
    console.error('Failed to parse baseTeamsOverride');
    process.exit(4);
  }
  let overrideArr;
  try { overrideArr = Function('return ' + arrMatch[1])(); } catch (err) { console.error('Failed eval override', err.message); process.exit(5); }

  const mpSrc = fs.readFileSync(mpPath, 'utf8');
  const objMatch = mpSrc.match(/export const maxprepsTeamData[\s\S]*?=\s*({[\s\S]*})\s*;/);
  if (!objMatch) { console.error('Failed to find maxprepsTeamData object'); process.exit(6); }
  let mpObj;
  try { mpObj = Function('return ' + objMatch[1])(); } catch (err) { console.error('Failed eval maxpreps', err.message); process.exit(7); }

  for (const t of overrideArr) {
    const name = t.name;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^[-]+|[-]+$/g, '');
    const preferredRemote = mpObj[id]?.schoolMascotUrl || null;
    let localExists = false;
    // If mpObj already points to local file, check file exists
    if (preferredRemote && preferredRemote.startsWith('/logos/maxpreps/')) {
      const abs = path.join(repoRoot, 'public', preferredRemote.replace(/^\//, ''));
      if (fs.existsSync(abs)) {
        localExists = true;
      }
    }

    let savedFilename = null;

    if (!localExists) {
      // Try to download from mpObj remote if present and is http
      let tried = false;
      if (preferredRemote && preferredRemote.startsWith('http')) {
        tried = true;
        try {
          process.stdout.write(`Downloading maxpreps remote for ${id}... `);
          const { buf, contentType } = await fetchBuffer(preferredRemote);
          const ext = getExtFromContentType(contentType);
          savedFilename = `${id}.${ext}`;
          fs.writeFileSync(path.join(outDir, savedFilename), buf, { mode: 0o644 });
          console.log('saved', savedFilename);
        } catch (err) {
          console.log('failed', err.message);
          savedFilename = null;
        }
      }

      // If not saved yet, try override.logo_url
      if (!savedFilename && t.logo_url) {
        try {
          process.stdout.write(`Downloading override logo for ${id}... `);
          const { buf, contentType } = await fetchBuffer(t.logo_url);
          const ext = getExtFromContentType(contentType);
          savedFilename = `${id}.${ext}`;
          fs.writeFileSync(path.join(outDir, savedFilename), buf, { mode: 0o644 });
          console.log('saved', savedFilename);
        } catch (err) {
          console.log('failed', err.message);
          savedFilename = null;
        }
      }

      // If still not saved, write placeholder
      if (!savedFilename) {
        const initials = getInitialsFromName(name);
        const svg = createPlaceholderSvg(initials);
        savedFilename = `${id}.svg`;
        fs.writeFileSync(path.join(outDir, savedFilename), svg, { mode: 0o644 });
        console.log(`Wrote placeholder for ${id} -> ${savedFilename}`);
      }

      // Point mpObj[id].schoolMascotUrl to local path
      if (!mpObj[id]) mpObj[id] = {};
      mpObj[id].schoolMascotUrl = `/logos/maxpreps/${savedFilename}`;
    }
  }

  // Replace object literal in source with updated JSON
  const replaced = mpSrc.replace(objMatch[1], JSON.stringify(mpObj, null, 2));
  const now = new Date().toISOString();
  const replaced2 = replaced.replace(/export const MAXPREPS_TEAMS_GENERATED_AT = \"[^"]*\";/, `export const MAXPREPS_TEAMS_GENERATED_AT = \"${now}\";`);
  fs.writeFileSync(mpPath, replaced2, 'utf8');
  console.log('Updated', mpPath, 'and ensured local logos in', outDir);
})();
