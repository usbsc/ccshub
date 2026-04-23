#!/usr/bin/env node

/**
 * Simple CLI to fetch MaxPreps data for a given team slug and write a preview to session-state
 * Usage: node ./scripts/maxpreps_sync_cli.js <team-slug>
 */
import { fetchAllForSlug } from '../src/app/services/maxpreps';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: maxpreps_sync_cli <team-slug>');
    process.exit(1);
  }
  const slug = args[0];
  console.log(`Fetching MaxPreps data for: ${slug}`);
  try {
    const data = await fetchAllForSlug(slug);
    const outDir = path.resolve(process.cwd(), '.session', 'maxpreps_preview');
    await fs.mkdir(outDir, { recursive: true });
    const outFile = path.join(outDir, `${slug}.json`);
    await fs.writeFile(outFile, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Preview written to ${outFile}`);
  } catch (e) {
    console.error('Error fetching data:', e);
  }
}

main();
