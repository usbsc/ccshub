#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const logosDir = path.join(process.cwd(), 'public', 'logos');
const teamsPath = path.join(process.cwd(), 'src/app/data/teams.ts');

async function main() {
  const files = await fs.readdir(logosDir);
  const logoBases = files.map((f) => f.replace(/\.[^.]+$/, '').toLowerCase());
  let txt = await fs.readFile(teamsPath, 'utf8');
  const replaced = [];

  for (const f of files) {
    const base = f.replace(/\.[^.]+$/, '').toLowerCase();
    // match id: "base",
    const idRegex = new RegExp(`id:\s*"${base}"`, 'i');
    if (!idRegex.test(txt)) continue;

    // find and replace image: GENERIC_LOGO within the nearby block
    const blockRegex = new RegExp(`(id:\s*"${base}"[\s\S]{0,1500}?image:\s*)(?:GENERIC_LOGO|"[^"]+"|\S+)`, 'i');
    const match = txt.match(blockRegex);
    if (match) {
      const replacement = `${match[1]}"/logos/${f}"`;
      txt = txt.replace(blockRegex, replacement);
      replaced.push(base);
    }
  }

  if (replaced.length > 0) {
    await fs.writeFile(teamsPath, txt, 'utf8');
    console.log(`Replaced image for ${replaced.length} team(s): ${replaced.join(', ')}`);
  } else {
    console.log('No matching teams found for local logos.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
