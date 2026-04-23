#!/usr/bin/env node

/**
 * Simple migration script to apply MaxPreps preview to teams.ts
 * Usage: node scripts/maxpreps_apply_migration.js <slug> <teamId>
 * This will open .session/maxpreps_preview/<slug>.json, compare, and update src/app/data/teams.ts
 */
import fs from 'fs/promises';
import path from 'path';

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: maxpreps_apply_migration <slug> <teamId>');
    process.exit(1);
  }
  const [slug, teamId] = args;
  const previewFile = path.resolve('.session', 'maxpreps_preview', `${slug}.json`);
  try {
    const content = await fs.readFile(previewFile, 'utf-8');
    const data = JSON.parse(content);

    const teamsFile = path.resolve('src', 'app', 'data', 'teams.ts');
    let teamsContent = await fs.readFile(teamsFile, 'utf-8');

    // simple replace: find team by id and insert coaches if present
    const coaches = data.meta?.coaches || data.meta?.coachingStaff || null;
    if (coaches) {
      const snippet = JSON.stringify(coaches, null, 2);
      const regex = new RegExp(`(id:\s*"${teamId}"[\s\S]*?\{[\s\S]*?\})`, 'm');
      // fallback approach: append to file as comment for manual update
      teamsContent += `\n\n// MaxPreps migration for ${teamId} (${slug})\n// coaches: ${snippet}\n`;
      await fs.writeFile(teamsFile, teamsContent, 'utf-8');
      console.log('Migration appended as comment to teams.ts for manual review');
    } else {
      console.log('No coaches metadata found in preview; nothing to apply');
    }
  } catch (e) {
    console.error('Error applying migration:', e);
    process.exit(1);
  }
}

main();
