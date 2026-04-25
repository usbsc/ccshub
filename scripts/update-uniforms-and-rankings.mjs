import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load MaxPreps data
const maxprepsPath = path.join(__dirname, "../src/app/data/teams.maxpreps.generated.ts");
const maxprepsContent = fs.readFileSync(maxprepsPath, "utf8");

const dataMatch = maxprepsContent.match(/export const maxprepsTeamData: Record<string, MaxprepsTeamData> = ({[\s\S]*?});/);
if (!dataMatch) {
  console.error("Failed to find maxprepsTeamData in teams.maxpreps.generated.ts");
  process.exit(1);
}

let maxprepsTeamData = {};
try {
  // Use a safer way to parse the object literal
  // Since it's generated with JSON.stringify, it should be valid JSON except for the trailing semicolon
  maxprepsTeamData = JSON.parse(dataMatch[1]);
} catch (err) {
  console.error("Failed to parse maxprepsTeamData:", err.message);
  // Fallback to a simpler regex if JSON.parse fails (it might have unquoted keys if manually edited)
  try {
     // If it's not perfect JSON, we can try to evaluate it in a controlled way
     const evalFn = new Function(`return ${dataMatch[1]}`);
     maxprepsTeamData = evalFn();
  } catch (err2) {
     console.error("Fallback parsing also failed:", err2.message);
     process.exit(1);
  }
}

// Load teams.ts
const teamsPath = path.join(__dirname, "../src/app/data/teams.ts");
const teamsContent = fs.readFileSync(teamsPath, "utf8");

// Add uniforms interface if not present
let updatedContent = teamsContent;
if (!updatedContent.includes("uniforms?:")) {
  updatedContent = updatedContent.replace(
    "export interface Team {",
    `export interface Team {
  uniforms?: {
    home?: { primary: string; secondary: string; description?: string };
    away?: { primary: string; secondary: string; description?: string };
    alternate?: { primary: string; secondary: string; description?: string };
  };`
  );
}

// Sort teams by stateRank from MaxPreps (lower = better rank)
const teamIds = Object.keys(maxprepsTeamData).sort((a, b) => {
  const aRank = maxprepsTeamData[a].stateRank || 999;
  const bRank = maxprepsTeamData[b].stateRank || 999;
  return aRank - bRank;
});

// Create ranking map
const rankingMap = {};
teamIds.forEach((id, index) => {
  rankingMap[id] = index + 1;
});

console.log("Top 10 Rankings:");
teamIds.slice(0, 10).forEach((id, i) => {
  console.log(`${i + 1}. ${id} (MaxPreps rank: ${maxprepsTeamData[id].stateRank})`);
});

// Update team entries with new rankings and add uniform stubs
const lines = updatedContent.split("\n");
let inBaseTeams = false;
let currentTeamId = null;
let currentTeamStartIdx = -1;
let braceDepth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.includes("export const baseTeams:")) {
    inBaseTeams = true;
    continue;
  }

  // Stop when we reach the end of baseTeams
  if (inBaseTeams && line.trim() === "];") {
    inBaseTeams = false;
    break;
  }

  if (!inBaseTeams) continue;

  // Track brace depth within baseTeams
  const openers = (line.match(/{/g) || []).length;
  const closers = (line.match(/}/g) || []).length;
  
  const oldDepth = braceDepth;
  braceDepth += openers - closers;

  // Detect start of a team object (at depth 0 -> 1)
  if (oldDepth === 0 && braceDepth > 0 && line.includes("{")) {
     currentTeamStartIdx = i;
     // Look ahead for id:
     for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
       const idMatch = lines[j].match(/id:\s*"([^"]+)"/);
       if (idMatch) {
         currentTeamId = idMatch[1];
         break;
       }
     }
  }

  // If we are inside a team object, look for ranking and stateRank
  if (currentTeamId) {
    const newRanking = rankingMap[currentTeamId];
    const newStateRank = maxprepsTeamData[currentTeamId]?.stateRank;

    if (line.includes("ranking:") && !line.includes("stateRank:")) {
      if (newRanking !== undefined) {
        lines[i] = line.replace(/ranking:\s*\d+/, `ranking: ${newRanking}`);
      }
    }

    if (line.includes("stateRank:")) {
      lines[i] = `    stateRank: ${newStateRank || "undefined"},`;
    }

    // Detect end of a team object (at depth 1 -> 0)
    if (oldDepth >= 1 && braceDepth === 0) {
      // If we didn't find stateRank, insert it before image: or ranking: or colors:
      const teamBlock = lines.slice(currentTeamStartIdx, i + 1);
      const hasStateRank = teamBlock.some(l => l.includes("stateRank:"));
      
      if (!hasStateRank && newStateRank !== undefined) {
         // Find ranking line to insert after
         for (let j = currentTeamStartIdx; j <= i; j++) {
           if (lines[j].includes("ranking:") && !lines[j].includes("stateRank:")) {
             lines.splice(j + 1, 0, `    stateRank: ${newStateRank},`);
             i++; // Adjust outer loop index
             break;
           }
         }
      }
      currentTeamId = null;
      currentTeamStartIdx = -1;
    }
  }
}

updatedContent = lines.join("\n");

// Save updated teams.ts
fs.writeFileSync(teamsPath, updatedContent, "utf8");
console.log("\n✓ Updated teams.ts with new rankings and uniform interface");

// Log uniform guidance
console.log("\nUniform color scheme guidance:");
console.log("- Home: team primary colors (jersey + pants)");
console.log("- Away: typically white/light colors for jersey");
console.log("- Alternate: second color combination or special design");
