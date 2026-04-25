#!/usr/bin/env node

/**
 * Self-contained CLI to fetch MaxPreps data for a given team slug and write a preview to public/session
 * Usage: npx ts-node ./scripts/maxpreps_sync_cli.ts <team-slug>
 */
import fs from 'fs/promises';
import path from 'path';

async function fetchPage(url: string) {
  const resp = await fetch(url, { headers: { 'User-Agent': 'ccshub-bot/1.0 (+https://usbsc.github.io/ccshub/)' } });
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
  return await resp.text();
}

async function fetchRosterBySlug(slug: string) {
  const url = `https://www.maxpreps.com/high-schools/${slug}/football/roster/`;
  try {
    const html = await fetchPage(url);
    const cheerio = (await import('cheerio')).default || (await import('cheerio'));
    const $ = cheerio.load(html);
    const players = [];
    $('table.roster-table tbody tr').each((_, el) => {
      const cols = $(el).find('td');
      const number = $(cols[0]).text().trim();
      const name = $(cols[1]).text().trim();
      const pos = $(cols[2]).text().trim();
      const grade = $(cols[3]).text().trim();
      if (name) players.push({ name, number: number || undefined, position: pos || undefined, grade: grade || undefined });
    });
    if (players.length === 0) {
      $('ul.roster li').each((_, el) => {
        const text = $(el).text().trim();
        const m = text.match(/#?(\d+)?\s*(.+?)\s*-\s*(.+)/);
        if (m) players.push({ name: m[2].trim(), number: m[1] || undefined, position: m[3].trim() });
        else if (text) players.push({ name: text });
      });
    }
    return players;
  } catch (e) {
    return [];
  }
}

async function fetchScheduleBySlug(slug: string) {
  const url = `https://www.maxpreps.com/high-schools/${slug}/football/schedule/`;
  try {
    const html = await fetchPage(url);
    const cheerio = (await import('cheerio')).default || (await import('cheerio'));
    const $ = cheerio.load(html);
    const games = [];
    $('table.schedule-table tbody tr').each((_, el) => {
      const cols = $(el).find('td');
      const date = $(cols[0]).text().trim();
      const opponent = $(cols[1]).text().trim();
      const location = $(cols[2]).text().trim();
      const result = $(cols[3]).text().trim();
      if (opponent) games.push({ date, opponent, location: location || undefined, result: result || undefined });
    });
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
  } catch (e) {
    return [];
  }
}

async function fetchTeamMetaBySlug(slug: string) {
  const url = `https://www.maxpreps.com/high-schools/${slug}/football/`;
  try {
    const html = await fetchPage(url);
    const cheerio = (await import('cheerio')).default || (await import('cheerio'));
    const $ = cheerio.load(html);
    const name = $('h1').first().text().trim() || slug.replace(/-/g, ' ');
    const coaches = {};
    $('section.coaching-staff li').each((_, el) => {
      const label = $(el).find('.label').text().trim();
      const value = $(el).find('.value').text().trim();
      if (label && value) coaches[label] = value;
    });
    const record = $('div.record').text().trim() || undefined;
    return { name, slug, coaches: Object.keys(coaches).length ? coaches : undefined, record };
  } catch (e) {
    return { name: slug.replace(/-/g, ' '), slug };
  }
}

async function fetchPhotosBySlug(slug: string) {
  const url = `https://www.maxpreps.com/high-schools/${slug}/photos/`;
  try {
    const html = await fetchPage(url);
    const cheerio = (await import('cheerio')).default || (await import('cheerio'));
    const $ = cheerio.load(html);
    const photos = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      if (src && src.includes('maxpreps')) photos.push(src);
    });
    return photos;
  } catch (e) {
    return [];
  }
}

async function fetchAllForSlug(slug: string) {
  const [meta, roster, schedule, photos] = await Promise.all([
    fetchTeamMetaBySlug(slug).catch(() => ({})),
    fetchRosterBySlug(slug).catch(() => []),
    fetchScheduleBySlug(slug).catch(() => []),
    fetchPhotosBySlug(slug).catch(() => []),
  ]);
  return { meta, roster, schedule, photos };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: maxpreps_sync_cli <team-slug>');
    process.exit(1);
  }
  const slug = args[0];
  console.log(`Fetching MaxPreps data for: ${slug}`);
  try {
    const data = await fetchAllForSlug(slug);
    const outDir = path.resolve(process.cwd(), 'public', 'session', 'maxpreps_preview');
    await fs.mkdir(outDir, { recursive: true });
    const outFile = path.join(outDir, `${slug}.json`);
    await fs.writeFile(outFile, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Preview written to ${outFile} and will be served at /session/maxpreps_preview/${slug}.json`);
  } catch (e) {
    console.error('Error fetching data:', e);
  }
}

main();
