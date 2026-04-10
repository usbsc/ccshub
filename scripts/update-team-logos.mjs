import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const teamsFilePath = path.join(__dirname, '../src/app/data/teams.ts');

// Read the teams file
let teamsContent = fs.readFileSync(teamsFilePath, 'utf-8');

// Local logos available
const localLogos = [
  'bellarmine',
  'los-gatos',
  'mitty',
  'palo-alto',
  'riordan',
  'sacred-heart',
  'serra',
  'st-francis',
  'valley-christian',
  'wilcox'
];

// Update image paths for teams with local logos
for (const logo of localLogos) {
  const camelCase = logo.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  // Replace MaxPreps CDN URLs with local logos
  const pattern = new RegExp(
    `(id: ['"]${logo}['"],[\\s\\S]*?image:\\s*['"])https:\\/\\/[^'"]+(['"])`,
    'g'
  );
  
  const replacement = `$1/logos/${logo}.png$2`;
  teamsContent = teamsContent.replace(pattern, replacement);
}

fs.writeFileSync(teamsFilePath, teamsContent);
console.log('✅ Updated teams.ts with local logo paths');
console.log(`Updated ${localLogos.length} teams to use local logos`);
