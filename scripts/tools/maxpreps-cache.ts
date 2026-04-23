import fs from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.resolve(process.cwd(), '.cache', 'maxpreps');

export async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

export async function writeCache(key: string, payload: any) {
  await ensureCacheDir();
  const file = path.join(CACHE_DIR, `${key}.json`);
  await fs.writeFile(file, JSON.stringify(payload, null, 2), 'utf-8');
}

export async function readCache(key: string): Promise<any | null> {
  const file = path.join(CACHE_DIR, `${key}.json`);
  try {
    const content = await fs.readFile(file, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

export async function clearCache(key?: string) {
  if (!key) {
    // remove entire cache dir
    await fs.rm(CACHE_DIR, { recursive: true, force: true });
    return;
  }
  const file = path.join(CACHE_DIR, `${key}.json`);
  await fs.rm(file, { force: true } as any);
}
