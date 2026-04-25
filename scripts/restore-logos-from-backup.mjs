#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const BACKUP_PATH = path.join(process.cwd(), '.maxpreps-backups', 'backup-2026-04-22T05-06-47', 'teams.ts');
const TEAMS_PATH = path.join(process.cwd(), 'src/app/data/teams.ts');

async function parseImagesFromTeamsFile(filePath) {
  const txt = await fs.readFile(filePath, 'utf8');
  const images = new Map();
  // crude parse: find blocks with id: "x" and image: "..."
  const blockRegex = /id:\s*"([^"]+)"([\s\S]*?)image:\s*(?:GENERIC_LOGO|"([^"]+)")/g;
  let m;
  while ((m = blockRegex.exec(txt)) !== null) {
    const id = m[1];
    const img = m[3] || null;
    images.set(id, img);
  }
  return images;
}

async function main() {
  try {
    const backupExists = await fs.access(BACKUP_PATH).then(() => true).catch(() => false);
    if (!backupExists) {
      console.error('Backup teams.ts not found at', BACKUP_PATH);
      process.exit(1);
    }

    const backupImages = await parseImagesFromTeamsFile(BACKUP_PATH);
    const currentTxt = await fs.readFile(TEAMS_PATH, 'utf8');

    // Find teams with image: GENERIC_LOGO and try to replace with backup image if present
    const pattern = /(id:\s*"([^"]+)"[\s\S]*?image:\s*)GENERIC_LOGO/g;
    let replaced = 0;
    let newTxt = currentTxt.replace(pattern, (full, prefix, id) => {
      const backupImg = backupImages.get(id);
      if (backupImg && backupImg !== 'GENERIC_LOGO') {
        replaced += 1;
        return `${prefix}"${backupImg}"`;
      }
      return full; // leave unchanged
    });

    if (replaced > 0) {
      await fs.writeFile(TEAMS_PATH, newTxt, 'utf8');
      console.log(`Replaced ${replaced} GENERIC_LOGO entries using backup images.`);
    } else {
      console.log('No GENERIC_LOGO entries matched with backup images.');
    }
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

main();
