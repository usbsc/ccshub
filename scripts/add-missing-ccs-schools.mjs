import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const teamsPath = path.join(__dirname, "../src/app/data/teams.ts");
let content = fs.readFileSync(teamsPath, "utf8");

// New CCS schools to add (with basic info)
const newSchools = [
  {
    id: "gilroy",
    name: "Gilroy",
    mascot: "Mustangs",
    colors: { primary: "#FF0000", secondary: "#FFFFFF" },
    league: "PCAL - Cypress",
    division: "PCAL - Cypress",
    stadium: "Gavilan College",
    headCoach: "TBD",
  },
  {
    id: "morgan-hill",
    name: "Morgan Hill",
    mascot: "Nobles",
    colors: { primary: "#003366", secondary: "#FFFFFF" },
    league: "PCAL - Cypress",
    division: "PCAL - Cypress",
    stadium: "Morgan Hill High",
    headCoach: "TBD",
  },
  {
    id: "san-martin",
    name: "San Martin",
    mascot: "Eagles",
    colors: { primary: "#2E7D32", secondary: "#FFFFFF" },
    league: "PCAL - Cypress",
    division: "PCAL - Cypress",
    stadium: "San Martin High",
    headCoach: "TBD",
  },
  {
    id: "tennessee-williams",
    name: "Tennessee Williams",
    mascot: "Wildcats",
    colors: { primary: "#FFD700", secondary: "#000000" },
    league: "PCAL - Cypress",
    division: "PCAL - Cypress",
    stadium: "Tennessee Williams High",
    headCoach: "TBD",
  },
  {
    id: "east-palo-alto",
    name: "East Palo Alto",
    mascot: "Jaguars",
    colors: { primary: "#8B0000", secondary: "#FFD700" },
    league: "PAL",
    division: "PAL",
    stadium: "Ravenswood High",
    headCoach: "TBD",
  },
];

// Template for a new team entry
const createTeamEntry = (school) => {
  const uniforms = {
    home: {
      primary: school.colors.primary,
      secondary: school.colors.secondary,
      description: `${school.name} home uniform`,
    },
    away: {
      primary: "#FFFFFF",
      secondary: school.colors.primary,
      description: `${school.name} away uniform`,
    },
    alternate: {
      primary: school.colors.secondary,
      secondary: school.colors.primary,
      description: `${school.name} alternate uniform`,
    },
  };

  return `  {
    id: "${school.id}",
    name: "${school.name}",
    mascot: "${school.mascot}",
    colors: {
      primary: "${school.colors.primary}",
      secondary: "${school.colors.secondary}",
    },
    uniforms: {
      home: { primary: "${uniforms.home.primary}", secondary: "${uniforms.home.secondary}", description: "${uniforms.home.description}" },
      away: { primary: "${uniforms.away.primary}", secondary: "${uniforms.away.secondary}", description: "${uniforms.away.description}" },
      alternate: { primary: "${uniforms.alternate.primary}", secondary: "${uniforms.alternate.secondary}", description: "${uniforms.alternate.description}" },
    },
    league: "${school.league}",
    division: "${school.division}",
    record: {
      wins: 0,
      losses: 0,
    },
    ranking: 999,
    image: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&w=200&h=200&q=80",
    stadium: "${school.stadium}",
    headCoach: "${school.headCoach}",
    offensiveCoordinator: "TBD",
    defensiveCoordinator: "TBD",
    offensiveSystem: "TBD",
    defensiveSystem: "TBD",
    commonPlays: [],
    strengths: [],
    keyPlayers: [],
    levels: {
      varsity: {
        wins: 0,
        losses: 0,
      },
      jv: {
        wins: 0,
        losses: 0,
      },
      freshman: {
        wins: 0,
        losses: 0,
      },
    },
  },`;
};

// Find the end of baseTeams array
const baseTeamsMatch = content.match(/export const baseTeams: Team\[\] = \[([\s\S]*?)\];/);
if (!baseTeamsMatch) {
  console.error("Could not find baseTeams array");
  process.exit(1);
}

const baseTeamsContent = baseTeamsMatch[1];

// Check which schools don't exist yet
const existingIds = new Set();
const idPattern = /id: "([^"]+)"/g;
let match;
while ((match = idPattern.exec(baseTeamsContent)) !== null) {
  existingIds.add(match[1]);
}

const toAdd = newSchools.filter((s) => !existingIds.has(s.id));

if (toAdd.length === 0) {
  console.log("All new schools already exist in the system");
  process.exit(0);
}

// Add new schools before the closing ];
const newEntries = toAdd.map(createTeamEntry).join("\n");
const newContent = content.replace(
  /export const baseTeams: Team\[\] = \[([\s\S]*?)\];/,
  `export const baseTeams: Team[] = [$1${newEntries}
];`
);

fs.writeFileSync(teamsPath, newContent, "utf8");
console.log(`✓ Added ${toAdd.length} new CCS schools:`);
toAdd.forEach((s) => console.log(`  - ${s.name} (${s.mascot})`));
