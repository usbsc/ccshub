#!/usr/bin/env node
/*
Sync MaxPreps logos locally.
- Reads src/app/data/teams.maxpreps.generated.ts
- For each team entry, attempts to download schoolMascotUrl
- Saves to public/logos/maxpreps/<id>.<ext>
- If download fails or missing, generates a placeholder SVG and saves as <id>.svg
- Rewrites teams.maxpreps.generated.ts to point schoolMascotUrl at the local file path

Run: node scripts/sync-maxpreps-logos.js
*/

const fs = require('fs');
const path = require('path');
const https = require('https');

function fetchBuffer(url, timeout = 20000) {
  return new Promise((resolve, reject) => {
    try {
      const req = https.get(url, { timeout }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // follow redirect
          resolve(fetchBuffer(res.headers.location, timeout));
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error('Status ' + res.statusCode));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          resolve({ buf, contentType: res.headers['content-type'] || null });
        });
      });
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy(new Error('timeout'));
      });
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
  const inPath = path.join(repoRoot, 'src/app/data/teams.maxpreps.generated.ts');
  const outDir = path.join(repoRoot, 'public', 'logos', 'maxpreps');
  ensureDir(outDir);

  if (!fs.existsSync(inPath)) {
    console.error('Cannot find', inPath);
    process.exit(2);
  }

  const src = fs.readFileSync(inPath, 'utf8');
  const objMatch = src.match(/export const maxprepsTeamData[\s\S]*?=\s*({[\s\S]*})\s*;/);
  if (!objMatch) {
    console.error('Failed to locate maxprepsTeamData object in file');
    process.exit(3);
  }

  let dataObj;
  try {
    // Evaluate the object literal safely using Function
    dataObj = Function('return ' + objMatch[1])();
  } catch (err) {
    console.error('Failed to parse maxprepsTeamData object:', err.message);
    process.exit(4);
  }

  const ids = Object.keys(dataObj);
  console.log('Found', ids.length, 'teams in maxpreps data');

  for (const id of ids) {
    const entry = dataObj[id] || {};
    let url = entry.schoolMascotUrl || null;
    let savedFilename = null;

    if (url) {
      try {
        process.stdout.write(`Downloading logo for ${id}... `);
        const { buf, contentType } = await fetchBuffer(url);
        const ext = getExtFromContentType(contentType || 'image/png');
        savedFilename = `${id}.${ext}`;
        fs.writeFileSync(path.join(outDir, savedFilename), buf, { mode: 0o644 });
        console.log('saved', savedFilename);
      } catch (err) {
        console.log('failed (download)', err.message);
        url = null; // fallthrough to placeholder
      }
    }

    if (!url) {
      // create placeholder svg and save
      const initials = getInitialsFromName(entry.maxprepsUrl?.split('/')?.pop?.() || id) || getInitialsFromName(id);
      const svg = createPlaceholderSvg(getInitialsFromName(entry.schoolMascotUrl || id) || getInitialsFromName(id));
      savedFilename = `${id}.svg`;
      fs.writeFileSync(path.join(outDir, savedFilename), svg, { mode: 0o644 });
      console.log(`Wrote placeholder for ${id} -> ${savedFilename}`);
    }

    // point to local path
    if (savedFilename) {
      entry.schoolMascotUrl = `/logos/maxpreps/${savedFilename}`;
    }
  }

  // Replace object literal in source with updated JSON
  const replaced = src.replace(objMatch[1], JSON.stringify(dataObj, null, 2));

  // Update generated at timestamp
  const now = new Date().toISOString();
  const replaced2 = replaced.replace(/export const MAXPREPS_TEAMS_GENERATED_AT = \"[^"]*\";/, `export const MAXPREPS_TEAMS_GENERATED_AT = \"${now}\";`);

  fs.writeFileSync(inPath, replaced2, 'utf8');
  console.log('Updated', inPath, 'and saved logos to', outDir);
})();
