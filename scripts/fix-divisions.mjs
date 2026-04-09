import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const teamsPath = path.join(__dirname, "../src/app/data/teams.ts");
let content = fs.readFileSync(teamsPath, "utf8");

// Map teams to their proper divisions based on league and ranking
// CCS has: Division I (larger/better), Division II (mid), Division III (smaller)
// For this region, we'll use: West Catholic = Div I, Peninsula League = Div I, PCAL = Div II, BVAL = Div II, SCVAL = Div II
// Plus some regional divisions

const divisionMap = {
  // West Catholic Athletic League - Division I (most competitive)
  riordan: "Bay Foothill League - Division I",
  serra: "Bay Foothill League - Division I",
  "st-francis": "Bay Foothill League - Division I",
  "st-ignatius": "Bay Foothill League - Division I",
  mitty: "Bay Foothill League - Division I",
  "valley-christian": "Bay Foothill League - Division I",
  bellarmine: "Bay Foothill League - Division I",
  "sacred-heart": "Bay Foothill League - Division I",

  // Peninsula Athletic League - Bay Division
  "los-gatos": "Peninsula Athletic League - Bay",
  wilcox: "Peninsula Athletic League - Bay",
  "palo-alto": "Peninsula Athletic League - Bay",
  "menlo-atherton": "Peninsula Athletic League - Bay",

  // PCAL (Pajaro Valley Athletic League)
  salinas: "PCAL - Gabilan",
  palma: "PCAL - Gabilan",
  "north-salinas": "PCAL - Gabilan",

  // BVAL (Bay Valley Athletic League) - West Valley Division
  "andrew-hill": "BVAL - West Valley",
  "del-mar": "BVAL - West Valley",
  gunderson: "BVAL - West Valley",
  independence: "BVAL - West Valley",
  "james-lick": "BVAL - West Valley",
  "mt-pleasant": "BVAL - West Valley",
  overfelt: "BVAL - West Valley",
  prospect: "BVAL - West Valley",
  "san-jose": "BVAL - West Valley",
  "yerba-buena": "BVAL - West Valley",

  // BVAL - Mt. Hamilton Division
  christopher: "BVAL - Mt. Hamilton",
  leigh: "BVAL - Mt. Hamilton",
  leland: "BVAL - Mt. Hamilton",
  "oak-grove": "BVAL - Mt. Hamilton",
  "live-oak": "BVAL - Mt. Hamilton",
  "piedmont-hills": "BVAL - Mt. Hamilton",
  "santa-teresa": "BVAL - Mt. Hamilton",
  "silver-creek": "BVAL - Mt. Hamilton",

  // BVAL - Santa Teresa Division
  branham: "BVAL - Santa Teresa",
  "evergreen-valley": "BVAL - Santa Teresa",
  lincoln: "BVAL - Santa Teresa",
  pioneer: "BVAL - Santa Teresa",
  sobrato: "BVAL - Santa Teresa",
  westmont: "BVAL - Santa Teresa",
  "willow-glen": "BVAL - Santa Teresa",

  // SCVAL (Santa Clara Valley Athletic League)
  cupertino: "SCVAL - El Camino",
  fremont: "SCVAL - El Camino",
  gunn: "SCVAL - El Camino",

  homestead: "SCVAL - De Anza",
  "los-altos": "SCVAL - De Anza",
  "monta-vista": "SCVAL - De Anza",

  // Other single-team leagues
  aptos: "SCCAL",
  "sacred-heart-prep": "PAL - Bay",
  "santa-clara-high": "SCVAL",
};

let updated = 0;
Object.entries(divisionMap).forEach(([teamId, divisionName]) => {
  const pattern = new RegExp(
    `(id: "${teamId}"[\\s\\S]*?)division: "[^"]*"`,
    "g"
  );

  const before = content;
  content = content.replace(pattern, `$1division: "${divisionName}"`);

  if (before !== content) {
    updated++;
    console.log(`  ✓ ${teamId}: ${divisionName}`);
  }
});

fs.writeFileSync(teamsPath, content, "utf8");
console.log(`\n✓ Fixed divisions for ${updated} teams`);
