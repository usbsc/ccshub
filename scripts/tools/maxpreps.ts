import cheerio from 'cheerio';

export interface MPPlayer {
  name: string;
  number?: string;
  position?: string;
  grade?: string;
}

export interface MPGame {
  date: string; // ISO
  opponent: string;
  location?: string;
  homeAway?: 'home'|'away'|'neutral';
  result?: string;
  score?: string;
}

export interface MPTeam {
  id?: string;
  name: string;
  slug?: string;
  coaches?: Record<string,string>;
  record?: string;
}

// Simple MaxPreps fetcher & parser utilities
export async function fetchPage(url: string): Promise<string> {
  const resp = await fetch(url, { headers: { 'User-Agent': 'ccshub-bot/1.0 (+https://usbsc.github.io/ccshub/)' } });
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
  return await resp.text();
}

export async function fetchRosterBySlug(slug: string): Promise<MPPlayer[]> {
  // Example slug: "santa-clara-high-school"
  const url = `https://www.maxpreps.com/high-schools/${slug}/football/roster/`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const players: MPPlayer[] = [];
  // MaxPreps roster table selectors may vary; attempt common patterns
  $('table.roster-table tbody tr').each((_, el) => {
    const cols = $(el).find('td');
    const number = $(cols[0]).text().trim();
    const name = $(cols[1]).text().trim();
    const pos = $(cols[2]).text().trim();
    const grade = $(cols[3]).text().trim();
    if (name) players.push({ name, number: number || undefined, position: pos || undefined, grade: grade || undefined });
  });

  // Fallback: list items
  if (players.length === 0) {
    $('ul.roster li').each((_, el) => {
      const text = $(el).text().trim();
      // simple parse: "#12 John Doe - RB"
      const m = text.match(/#?(\d+)?\s*(.+?)\s*-\s*(.+)/);
      if (m) {
        players.push({ name: m[2].trim(), number: m[1] || undefined, position: m[3].trim() });
      } else if (text) {
        players.push({ name: text });
      }
    });
  }

  return players;
}

export async function fetchScheduleBySlug(slug: string): Promise<MPGame[]> {
  const url = `https://www.maxpreps.com/high-schools/${slug}/football/schedule/`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const games: MPGame[] = [];
  $('table.schedule-table tbody tr').each((_, el) => {
    const cols = $(el).find('td');
    const date = $(cols[0]).text().trim();
    const opponent = $(cols[1]).text().trim();
    const location = $(cols[2]).text().trim();
    const result = $(cols[3]).text().trim();
    if (opponent) games.push({ date, opponent, location: location || undefined, result: result || undefined });
  });

  // Fallback parsing
  if (games.length === 0) {
    $('div.schedule-list .game').each((_, el) => {
      const date = $(el).find('.date').text().trim();
      const opponent = $(el).find('.opponent').text().trim();
      const location = $(el).find('.location').text().trim();
      const result = $(el).find('.result').text().trim();
      if (opponent) games.push({ date, opponent, location: location || undefined, result: result || undefined });
    });
  }

  return games;
}

export async function fetchTeamMetaBySlug(slug: string): Promise<MPTeam> {
  const url = `https://www.maxpreps.com/high-schools/${slug}/football/`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const name = $('h1').first().text().trim() || slug.replace(/-/g,' ');
  const coaches: Record<string,string> = {};
  $('section.coaching-staff li').each((_, el) => {
    const label = $(el).find('.label').text().trim();
    const value = $(el).find('.value').text().trim();
    if (label && value) coaches[label] = value;
  });

  const record = $('div.record').text().trim() || undefined;

  return { name, slug, coaches: Object.keys(coaches).length ? coaches : undefined, record } as MPTeam;
}

export async function fetchPhotosBySlug(slug: string): Promise<string[]> {
  const url = `https://www.maxpreps.com/high-schools/${slug}/photos/`; // may not exist
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const photos: string[] = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      if (src && src.includes('maxpreps')) photos.push(src);
    });
    return photos;
  } catch (e) {
    return [];
  }
}

// Export a convenience method that returns all data
export async function fetchAllForSlug(slug: string) {
  const [meta, roster, schedule, photos] = await Promise.all([
    fetchTeamMetaBySlug(slug).catch(() => ({})),
    fetchRosterBySlug(slug).catch(() => []),
    fetchScheduleBySlug(slug).catch(() => []),
    fetchPhotosBySlug(slug).catch(() => []),
  ]);

  return { meta, roster, schedule, photos };
}
