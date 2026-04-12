#!/usr/bin/env node
/**
 * Fetch game schedules from MaxPreps for a given season
 * 
 * Since MaxPreps loads schedules dynamically via JavaScript, this script
 * uses their schedule endpoint directly. Requires Node 18+.
 * 
 * Usage: node scripts/fetch-maxpreps-schedules.mjs [season] [outputFile]
 * Example: node scripts/fetch-maxpreps-schedules.mjs 2026 src/app/data/games/2026.ts
 */

import fs from "node:fs/promises";
import path from "node:path";

const TEAMS_MAXPREPS_PATH = path.join(
  process.cwd(),
  "src/app/data/teams.maxpreps.generated.ts"
);

// Load MaxPreps teams from the generated file
async function loadMaxprepsTeams() {
  try {
    const module = await import(path.join(process.cwd(), "src/app/data/teams.maxpreps.generated.ts"));
    return module.maxprepsTeamData || {};
  } catch (err) {
    console.error("Failed to load MaxPreps teams:", err.message);
    return {};
  }
}

// Fetch schedule from MaxPreps endpoint
async function fetchScheduleFromMaxpreps(maxprepsUrl) {
  if (!maxprepsUrl) return [];
  
  try {
    // Extract school path from MaxPreps URL
    // https://www.maxpreps.com/ca/san-jose/bellarmine-bells/football/ 
    // → /ca/san-jose/bellarmine-bells/football/
    const urlPattern = /maxpreps\.com(\/ca\/.*\/football\/)/;
    const match = maxprepsUrl.match(urlPattern);
    
    if (!match) return [];
    
    const schoolPath = match[1];
    const scheduleUrl = `https://www.maxpreps.com${schoolPath}schedule`;
    
    const res = await fetch(scheduleUrl, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; ccshub/1.0)",
      },
    });
    
    if (!res.ok) return [];
    
    const html = await res.text();
    
    // Extract __NEXT_DATA__ which contains schedule
    const dataMatch = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s
    );
    
    if (!dataMatch) return [];
    
    const nextData = JSON.parse(dataMatch[1]);
    const pageProps = nextData.props?.pageProps || {};
    
    // MaxPreps stores schedule in various places depending on page structure
    const schedule = pageProps.schedule || pageProps.scheduleGames || [];
    
    return schedule;
  } catch (err) {
    console.error(`Failed to fetch schedule: ${err.message}`);
    return [];
  }
}

// Convert MaxPreps game to our format
function convertGame(game, teamId, allTeams) {
  if (!game || typeof game !== "object") return null;
  
  const homeTeamId = game.homeTeam?.schoolId?.toLowerCase()?.replace(/\s+/g, "-") || null;
  const awayTeamId = game.awayTeam?.schoolId?.toLowerCase()?.replace(/\s+/g, "-") || null;
  
  if (!homeTeamId || !awayTeamId) return null;
  
  const gameDate = game.gameDate || game.date;
  if (!gameDate) return null;
  
  // Only include 2025 season (Aug-Dec 2025)
  const date = new Date(gameDate);
  if (date.getFullYear() !== 2025 || date.getMonth() < 7 || date.getMonth() > 11) {
    return null;
  }
  
  return {
    id: `2026-${teamId}-${homeTeamId}-${awayTeamId}-${gameDate}`.replace(/[^a-z0-9-]/gi, "-"),
    homeTeam: homeTeamId,
    awayTeam: awayTeamId,
    homeTeamName: game.homeTeam?.schoolName || "TBD",
    awayTeamName: game.awayTeam?.schoolName || "TBD",
    homeScore: game.homeTeamScore || 0,
    awayScore: game.awayTeamScore || 0,
    date: gameDate,
    time: game.gameTime || game.time || "TBD",
    stadium: game.location || game.stadium || "TBD",
    status: (game.gameStatus || "").toLowerCase().includes("final") ? "final" : "upcoming",
    level: game.level || "Varsity",
    dataSource: "maxpreps",
    sourceUrl: game.gameUrl || "",
  };
}

async function main() {
  const season = process.argv[2] || "2026";
  const outputFile = process.argv[3] || `src/app/data/games/${season}.ts`;
  
  console.log(`Fetching ${season} season games from MaxPreps...`);
  
  const maxprepsTeams = await loadMaxprepsTeams();
  const teamIds = Object.keys(maxprepsTeams).sort();
  
  console.log(`Found ${teamIds.length} teams with MaxPreps URLs`);
  
  const allGames = [];
  const seen = new Set();
  
  for (let i = 0; i < teamIds.length; i++) {
    const teamId = teamIds[i];
    const teamData = maxprepsTeams[teamId];
    
    if (!teamData.maxprepsUrl) continue;
    
    process.stdout.write(
      `[${i + 1}/${teamIds.length}] Fetching ${teamId}... `
    );
    
    const schedule = await fetchScheduleFromMaxpreps(teamData.maxprepsUrl);
    
    if (!schedule || schedule.length === 0) {
      console.log("no games found");
      continue;
    }
    
    let addedCount = 0;
    for (const gameData of schedule) {
      const game = convertGame(gameData, teamId, maxprepsTeams);
      if (!game) continue;
      
      // Avoid duplicates
      const key = [game.homeTeam, game.awayTeam, game.date].sort().join("|");
      if (!seen.has(key)) {
        seen.add(key);
        allGames.push(game);
        addedCount++;
      }
    }
    
    console.log(`added ${addedCount} games`);
    
    // Rate limiting
    await new Promise((r) => setTimeout(r, 200));
  }
  
  // Sort by date
  allGames.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Generate TypeScript file
  const tsContent = `import type { Game } from "../games";

export const games${season}: Game[] = ${JSON.stringify(allGames, null, 2)};
`;
  
  await fs.writeFile(outputFile, tsContent, "utf8");
  console.log(`\nWrote ${allGames.length} games to ${outputFile}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});
