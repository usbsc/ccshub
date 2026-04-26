import fs from "node:fs/promises";
import path from "node:path";

const TEAMS_PATH = path.join(process.cwd(), "src/app/data/teams.ts");
const OUT_PATH = path.join(process.cwd(), "src/app/data/teams.maxpreps.generated.ts");

function extractNextData(html) {
  const m = html.match(/<script[^>]+id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

function normalizeText(s) {
  return (s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(s) {
  const t = normalizeText(s);
  return t ? t.split(/\s+/).filter(Boolean) : [];
}

function tokenOverlapScore(a, b) {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const x of ta) if (tb.has(x)) inter += 1;
  return inter / Math.max(ta.size, tb.size);
}

function scoreSchoolMatch(team, school) {
  const nameScore = tokenOverlapScore(team.name, school.name);
  const mascotScore = tokenOverlapScore(team.mascot, school.mascot);

  // Heuristics: name is primary, mascot disambiguates for generic names like "Lincoln".
  const base = nameScore * 10 + mascotScore * 7;

  // Penalize *only* when the team mascot is known and name is very short.
  // Many MaxPreps mascots include the school name (e.g. "Overfelt Royals"), so a 0.5 overlap is normal.
  const nameTokens = tokens(team.name);
  const mascotProvided = team.mascot && team.mascot !== "N/A";
  if (nameTokens.length <= 1 && mascotProvided && mascotScore < 0.34) return base - 100;

  return base;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "ccshub-maxpreps-import/1.0",
      accept: "text/html,*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const next = extractNextData(html);
  if (next) return next;

  // Fallbacks when the __NEXT_DATA__ script isn't available or parseable.
  // 1) Try to find a window.__NEXT_DATA__ assignment
  const alt = html.match(/window\.__NEXT_DATA__\s*=\s*(\{.*?\})\s*;/s);
  if (alt) {
    try {
      return JSON.parse(alt[1]);
    } catch (e) {
      // fall through to other fallback
    }
  }

  // 2) As a last resort, try to find a canonical school football link in the HTML
  const a = html.match(/href="(\/schools\/[^"]+\/football\/?)/i);
  if (a) {
    const canonical = a[1].startsWith('http') ? a[1] : `https://www.maxpreps.com${a[1]}`;
    // Return a minimal shape that discoverMaxprepsFootballUrl can consume
    return {
      props: {
        pageProps: {
          initialSchoolResults: [
            {
              canonicalUrl: canonical,
              name: '',
              mascot: '',
              state: 'CA',
            },
          ],
        },
      },
    };
  }

  throw new Error("Missing __NEXT_DATA__ and no fallback link found");
}

async function fetchJsonWithRetry(url, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await fetchJson(url);
    } catch (e) {
      lastErr = e;
      const isRateLimit = e.message.includes("429") || e.message.includes("403");
      const waitTime = isRateLimit ? 5000 * (i + 1) : 1000 * (i + 1);
      
      if (i < tries - 1) {
        console.warn(`  Retrying in ${waitTime}ms... (${e.message})`);
        // eslint-disable-next-line no-await-in-loop
        await sleep(waitTime);
      }
    }
  }
  throw lastErr;
}

async function discoverMaxprepsFootballUrl(team) {
  const query = [team.name, team.mascot && team.mascot !== "N/A" ? team.mascot : ""]
    .filter(Boolean)
    .join(" ");

  const url = `https://www.maxpreps.com/search/?q=${encodeURIComponent(query)}`;
  const next = await fetchJsonWithRetry(url);

  /** @type {Array<any>} */
  const schools = next?.props?.pageProps?.initialSchoolResults || [];
  const ca = schools.filter((s) => (s?.state || "").toUpperCase() === "CA");

  if (ca.length === 0) return { url: null, confidence: 0 };

  let best = null;
  let bestScore = -Infinity;
  let secondScore = -Infinity;

  for (const s of ca) {
    const score = scoreSchoolMatch(team, s);
    if (score > bestScore) {
      secondScore = bestScore;
      bestScore = score;
      best = s;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  // Ambiguity guard: if top two scores are close, skip to avoid bad links.
  // If we can't confidently pick, avoid generating incorrect links.
  if (!best || bestScore < 5 || bestScore - secondScore < 0.75) {
    return { url: null, confidence: bestScore };
  }

  const canonical = best.canonicalUrl;
  if (typeof canonical !== "string" || !canonical.startsWith("https://www.maxpreps.com/")) {
    return { url: null, confidence: bestScore };
  }

  const footballUrl = canonical.endsWith("/") ? `${canonical}football/` : `${canonical}/football/`;
  return { url: footballUrl, confidence: bestScore };
}

function extractSchoolMascotUrl(nextData) {
  const url = nextData?.props?.pageProps?.teamContext?.data?.schoolMascotUrl;
  return typeof url === "string" && url.startsWith("http") ? url : undefined;
}

function extractLeagueName(nextData) {
  const leagueName = nextData?.props?.pageProps?.teamContext?.data?.leagueName;
  return typeof leagueName === "string" && leagueName.trim() ? leagueName.trim() : undefined;
}

function extractCaliforniaStateRank(nextData) {
  const rankings = nextData?.props?.pageProps?.teamContext?.rankingsData?.data;
  if (!Array.isArray(rankings)) return undefined;
  const state = rankings.find((r) => r?.rankingType === 1 && r?.contextId === "CA");
  const rank = state?.rank;
  return typeof rank === "number" ? rank : undefined;
}

function extractOverallRecord(nextData) {
  const recordText =
    nextData?.props?.pageProps?.teamContext?.standingsData?.overallStanding?.overallWinLossTies;
  if (typeof recordText !== "string") return undefined;

  const m = recordText.trim().match(/^(\d+)-(\d+)(?:-(\d+))?$/);
  if (!m) return undefined;

  const wins = Number(m[1]);
  const losses = Number(m[2]);
  if (!Number.isFinite(wins) || !Number.isFinite(losses)) return undefined;

  return { wins, losses };
}

function extractPointsForAgainst(nextData) {
  const overall = nextData?.props?.pageProps?.teamContext?.standingsData?.overallStanding;
  const pointsFor = overall?.points;
  const pointsAgainst = overall?.pointsAgainst;

  return {
    pointsFor: typeof pointsFor === "number" ? pointsFor : undefined,
    pointsAgainst: typeof pointsAgainst === "number" ? pointsAgainst : undefined,
  };
}

function extractStreak(nextData) {
  const overall = nextData?.props?.pageProps?.teamContext?.standingsData?.overallStanding;
  const streak = overall?.streak;
  const streakResult = overall?.streakResult;
  if (typeof streak !== "number" || !Number.isFinite(streak) || streak <= 0) return undefined;
  if (typeof streakResult !== "string" || !streakResult.trim()) return undefined;
  return `${streakResult.trim().toUpperCase()}${streak}`;
}

function parseBaseTeams(tsText) {
  // We only need stable fields for discovery.
  const teams = [];
  let current = null;
  let inBase = false;

  for (const line of tsText.split(/\r?\n/)) {
    if (
      !inBase &&
      (line.includes("export const baseTeams") || line.includes("export const teams"))
    ) {
      inBase = true;
    }
    if (!inBase) continue;

    const idMatch = line.match(/^\s*id:\s*"([^"]+)"/);
    if (idMatch) {
      current = { id: idMatch[1] };
      teams.push(current);
      continue;
    }
    if (!current) continue;

    const nameMatch = line.match(/^\s*name:\s*"([^"]+)"/);
    if (nameMatch) current.name = nameMatch[1];

    const mascotMatch = line.match(/^\s*mascot:\s*"([^"]+)"/);
    if (mascotMatch) current.mascot = mascotMatch[1];

    const mpMatch = line.match(/maxpreps:\s*"([^"]+)"/);
    if (mpMatch) current.maxprepsUrl = mpMatch[1];

    // stop when array ends
    if (line.trim() === "];") break;
  }

  return teams.filter((t) => t.id && t.name);
}

function renderTs(teamData, generatedAt) {
  const header = `// This file is auto-generated by scripts/update-maxpreps-teams.mjs\n// Source: MaxPreps team pages\n// Generated at: ${generatedAt}\n\n`;

  const body =
    `export const MAXPREPS_TEAMS_GENERATED_AT = ${JSON.stringify(generatedAt)};\n\n` +
    `export type MaxprepsTeamData = {\n  maxprepsUrl?: string;\n  leagueName?: string;\n  schoolMascotUrl?: string;\n  stateRank?: number;\n  record?: { wins: number; losses: number };\n  pointsFor?: number;\n  pointsAgainst?: number;\n  streak?: string;\n  lastUpdated?: string;\n};\n\n` +
    `export const maxprepsTeamData: Record<string, MaxprepsTeamData> = ${JSON.stringify(teamData, null, 2)};\n`;

  return header + body;
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const tsText = await fs.readFile(TEAMS_PATH, "utf8");
  let teams = parseBaseTeams(tsText);

  // Support optional CLI arg to limit to specific team ids:
  //   node scripts/update-maxpreps-teams.mjs --teams=soquel,carlmont
  const args = process.argv.slice(2);
  const teamsArg = args.find((a) => a.startsWith("--teams=") || a.startsWith("--ids="));
  let filteredIds = null;
  if (teamsArg) {
    filteredIds = new Set(
      teamsArg.split("=")[1]
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    );
    teams = teams.filter((t) => filteredIds.has(t.id.toLowerCase()));
    console.log(`Filtering to ${teams.length} team(s): ${Array.from(filteredIds).join(", ")}`);
  }

  console.log(`Found ${teams.length} teams`);

  /** @type {Record<string, {maxprepsUrl?:string,leagueName?:string,schoolMascotUrl?:string,stateRank?:number,record?:{wins:number,losses:number},pointsFor?:number,pointsAgainst?:number,streak?:string,lastUpdated?:string}>} */
  const out = {};

  const generatedAt = new Date().toISOString();

  for (const team of teams) {
    const baseUrl = team.maxprepsUrl;
    let maxprepsUrl = baseUrl;

    if (!maxprepsUrl) {
      process.stdout.write(`Discovering MaxPreps: ${team.id} ... `);
      try {
        const found = await discoverMaxprepsFootballUrl(team);
        maxprepsUrl = found.url;

        if (!maxprepsUrl) {
          const foundFallback = await discoverMaxprepsFootballUrl({ ...team, mascot: "" });
          maxprepsUrl = foundFallback.url;
        }

        console.log(maxprepsUrl ? "ok" : "not found");
      } catch {
        console.log("error");
      }
      await sleep(1000); // Wait between discovery calls
    }

    if (!maxprepsUrl) continue;

    process.stdout.write(`Fetching rank/record: ${team.id} ... `);
    try {
      const next = await fetchJsonWithRetry(maxprepsUrl);
      const schoolMascotUrl = extractSchoolMascotUrl(next);
      const leagueName = extractLeagueName(next);
      const stateRank = extractCaliforniaStateRank(next);
      const record = extractOverallRecord(next);
      const { pointsFor, pointsAgainst } = extractPointsForAgainst(next);
      const streak = extractStreak(next);

      out[team.id] = {
        maxprepsUrl,
        leagueName,
        schoolMascotUrl,
        stateRank,
        record,
        pointsFor,
        pointsAgainst,
        streak,
        lastUpdated: generatedAt,
      };

      const rankText = stateRank ? `CA #${stateRank}` : "no rank";
      const recordText = record ? `${record.wins}-${record.losses}` : "no record";
      const pfpaText =
        typeof pointsFor === "number" && typeof pointsAgainst === "number"
          ? `PF ${pointsFor} / PA ${pointsAgainst}`
          : "no PF/PA";
      const streakText = streak ? `streak ${streak}` : "no streak";
      console.log(`${rankText} • ${recordText} • ${pfpaText} • ${streakText}`);
    } catch {
      // Keep the discovered URL even if rank fetch/parsing fails (helps roster imports and avoids losing links).
      out[team.id] = { maxprepsUrl, lastUpdated: generatedAt };
      console.log("error (kept URL)");
    }

    await sleep(1000); // Increased base sleep between teams to 1s
  }

  const outText = renderTs(out, generatedAt);
  await fs.writeFile(OUT_PATH, outText, "utf8");

  console.log(`Wrote MaxPreps team data for ${Object.keys(out).length} teams -> ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
