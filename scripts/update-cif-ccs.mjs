#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const TEAMS_PATH = path.join(process.cwd(), 'src/app/data/teams.ts');

async function readTeams() {
  const txt = await fs.readFile(TEAMS_PATH, 'utf8');
  // crude parse to array of team blocks
  const teams = [];
  let current = null;
  for (const line of txt.split(/\r?\n/)) {
    if (line.match(/\s*id:\s*"([^"]+)"/)) {
      current = { id: line.match(/\s*id:\s*"([^"]+)"/)[1] };
      teams.push(current);
      continue;
    }
    if (!current) continue;
    const nm = line.match(/\s*name:\s*"([^"]+)"/);
    if (nm) current.name = nm[1];
    const league = line.match(/\s*league:\s*"([^"]+)"/);
    if (league) current.league = league[1];
  }
  return teams;
}

async function fetchCifInfo(teamName) {
  // CIF CCS site doesn't provide a simple API; use search page heuristics.
  const q = encodeURIComponent(teamName + ' CIF CCS');
  const url = `https://www.cifccs.org/?s=${q}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'ccshub-cif-scraper/1.0' } });
    if (!res.ok) return null;
    const txt = await res.text();
    // Try to extract league text or other clues
    const m = txt.match(/>([^<]{3,60}League[^<]{0,40})</i);
    if (m) return m[1].trim();
    return null;
  } catch (e) {
    return null;
  }
}

function renderUpdate(teamId, leagueName) {
  return `  // Updated by scripts/update-cif-ccs.mjs\n  { id: "${teamId}", league: "${leagueName}", },\n`;
}

async function main() {
  const teams = await readTeams();
  const target = ['soquel','carlmont','santa-cruz','piedmont'];
  const out = {};
  for (const t of teams) {
    if (!target.includes(t.id)) continue;
    console.log('Checking CIF for', t.id, t.name);
    const info = await fetchCifInfo(t.name);
    out[t.id] = info || 'CIF CCS';
    console.log(' ->', out[t.id]);
    await new Promise(r => setTimeout(r, 300));
  }

  // Write summary to generated file
  const outPath = path.join(process.cwd(), 'src/app/data/teams.cif.generated.ts');
  const lines = ['// Auto-generated CIF CCS data', `export const CIF_CCSDATA_GENERATED_AT = "${new Date().toISOString()}";`, 'export const cifCcsData = {'];
  for (const k of Object.keys(out)) {
    lines.push(`  "${k}": { leagueName: ${JSON.stringify(out[k])} },`);
  }
  lines.push('};');
  await fs.writeFile(outPath, lines.join('\n'), 'utf8');
  console.log('Wrote', outPath);
}

main().catch(e=>{console.error(e); process.exit(1)});
