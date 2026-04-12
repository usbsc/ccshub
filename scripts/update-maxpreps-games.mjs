#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const TEAMS_MAXPREPS_PATH = path.join(
  process.cwd(),
  "src/app/data/teams.maxpreps.generated.ts"
);
const TEAMS_PATH = path.join(process.cwd(), "src/app/data/teams.ts");
const OUT_PATH = path.join(process.cwd(), "src/app/data/games/2026.ts");

function extractNextData(html) {
  const m = html.match(/<script[^>]+id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();
    const next = extractNextData(html);
    return next;
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err.message);
    return null;
  }
}

function extractGamesFromNextData(nextData, teamId, maxprepsUrl) {
  const games = [];

  if (!nextData) return games;

  // Navigate through Next.js data structure to find games
  const props = nextData.props?.pageProps;
  if (!props) return games;

  // The schedule data is typically in the props
  const schedule = props.schedule || [];

  for (const game of schedule) {
    if (!game || typeof game !== "object") continue;

    // Parse game data from MaxPreps structure
    const gameDate = game.gameDate || game.date;
    const gameTime = game.gameTime || game.time || "TBD";
    const homeTeam = game.homeTeam || {};
    const awayTeam = game.awayTeam || {};
    const homeScore = game.homeTeamScore;
    const awayScore = game.awayTeamScore;
    const location = game.location || game.stadium || "TBD";
    const status = game.gameStatus?.toLowerCase() || "upcoming";

    // Only include games from 2025-26 season (Aug 2025 - Dec 2025)
    if (!gameDate) continue;

    const date = new Date(gameDate);
    const year = date.getFullYear();
    const month = date.getMonth();

    // Football season is Aug-Dec
    if (year !== 2025 || month < 7 || month > 11) continue;

    // Create game object with available data
    const gameObj = {
      id: `2026-${teamId}-${gameDate}-${homeTeam.schoolId || "home"}`.replace(
        /[^a-z0-9-]/gi,
        "-"
      ),
      homeTeam: homeTeam.schoolId?.toLowerCase()?.replace(/\s+/g, "-") || "tbd",
      awayTeam: awayTeam.schoolId?.toLowerCase()?.replace(/\s+/g, "-") || "tbd",
      homeTeamName: homeTeam.schoolName || "TBD",
      awayTeamName: awayTeam.schoolName || "TBD",
      homeScore: homeScore !== undefined ? homeScore : 0,
      awayScore: awayScore !== undefined ? awayScore : 0,
      date: gameDate,
      time: gameTime,
      stadium: location,
      status: status === "final" ? "final" : "upcoming",
      level: "Varsity",
      dataSource: "maxpreps",
      sourceUrl: maxprepsUrl,
    };

    games.push(gameObj);
  }

  return games;
}

async function loadTeamsMaxpreps() {
  try {
    const content = await fs.readFile(TEAMS_MAXPREPS_PATH, "utf8");
    // Extract the object from the TS export
    const match = content.match(/maxprepsTeamData:\s*Record<string,\s*[^>]+>\s*=\s*({[\s\S]*?});/);
    if (!match) {
      console.error("Could not parse MaxPreps teams data");
      return {};
    }
    return eval(`(${match[1]})`);
  } catch (err) {
    console.error("Failed to load MaxPreps teams:", err.message);
    return {};
  }
}

async function loadBaseTeams() {
  try {
    const content = await fs.readFile(TEAMS_PATH, "utf8");
    // Extract just the team IDs
    const teamMatches = content.matchAll(/id:\s*"([^"]+)"/g);
    const teams = {};
    for (const match of teamMatches) {
      teams[match[1]] = {};
    }
    return teams;
  } catch (err) {
    console.error("Failed to load base teams:", err.message);
    return {};
  }
}

async function main() {
  console.log("Loading team data...");
  const baseTeams = await loadBaseTeams();
  const maxprepsTeams = await loadTeamsMaxpreps();

  const teamIds = Object.keys(baseTeams);
  const allGames = [];

  console.log(`Found ${teamIds.length} teams to fetch games for`);

  for (let i = 0; i < teamIds.length; i++) {
    const teamId = teamIds[i];
    const maxprepsData = maxprepsTeams[teamId];

    if (!maxprepsData || !maxprepsData.maxprepsUrl) {
      console.log(`Skipping ${teamId}: no MaxPreps URL`);
      continue;
    }

    const url = maxprepsData.maxprepsUrl;

    process.stdout.write(
      `[${i + 1}/${teamIds.length}] Fetching schedule for ${teamId}... `
    );

    const nextData = await fetchJson(url);
    if (!nextData) {
      console.log("FAILED");
      continue;
    }

    const games = extractGamesFromNextData(nextData, teamId, url);
    allGames.push(...games);
    console.log(`OK (${games.length} games)`);

    // Rate limiting
    await new Promise((r) => setTimeout(r, 250));
  }

  // Remove duplicates (same game may be listed for both teams)
  const uniqueGames = [];
  const seen = new Set();

  for (const game of allGames) {
    const key = [game.homeTeam, game.awayTeam, game.date].sort().join("|");
    if (!seen.has(key)) {
      seen.add(key);
      uniqueGames.push(game);
    }
  }

  console.log(`\nTotal unique games: ${uniqueGames.length}`);

  // Sort by date
  uniqueGames.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Generate TypeScript file
  const tsContent = `import type { Game } from "../games";

export const games2026: Game[] = ${JSON.stringify(uniqueGames, null, 2)};
`;

  await fs.writeFile(OUT_PATH, tsContent, "utf8");
  console.log(`Wrote ${uniqueGames.length} games to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});
