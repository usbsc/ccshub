#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
const GENERATED = path.join(process.cwd(), 'src/app/data/teams.maxpreps.generated.ts');
(async function(){
  const txt = await fs.readFile(GENERATED,'utf8');
  const m = txt.match(/export const maxprepsTeamData[\s\S]*?=\s*(\{[\s\S]*?\});/);
  if(!m){ console.error('generated not found'); process.exit(1); }
  const obj = JSON.parse(m[1]);
  const missing = [];
  for(const [id,data] of Object.entries(obj)){
    if(!data || !data.schoolMascotUrl) missing.push(id);
  }
  console.log(missing.join(','));
})();