import express from 'express';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { randomUUID } from 'crypto';
import Busboy from 'busboy';

const PORT = Number(process.env.PRIVATE_BACKEND_PORT || 3030);
const ADMIN_TOKEN = process.env.PRIVATE_BACKEND_ADMIN_TOKEN || 'ccshub-private-dev';
const STORAGE_DIR = path.resolve(process.cwd(), process.env.PRIVATE_BACKEND_STORAGE_DIR || 'private-backend');
const VIDEO_DIR = path.join(STORAGE_DIR, 'videos');
const CLIP_DIR = path.join(STORAGE_DIR, 'clips');
const DATA_FILE = path.join(STORAGE_DIR, 'library.json');

fs.mkdirSync(VIDEO_DIR, { recursive: true });
fs.mkdirSync(CLIP_DIR, { recursive: true });

const app = express();
app.use(express.json({ limit: '2mb' }));

const readData = () => {
  if (!fs.existsSync(DATA_FILE)) return { videos: [], clips: [] };
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
};

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

const requireAuth = (req, res, next) => {
  const header = req.header('authorization') || '';
  if (header !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
};

const ffmpegAvailable = () => {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

app.get('/health', (_, res) => res.json({ ok: true }));

app.get('/api/videos', requireAuth, (_, res) => res.json(readData().videos));

app.post('/api/videos/upload', requireAuth, (req, res) => {
  const busboy = Busboy({ headers: req.headers });
  const uploads = [];
  const fields = {};
  let hadFile = false;

  busboy.on('field', (name, value) => {
    fields[name] = value;
  });

  busboy.on('file', (name, file, info) => {
    hadFile = true;
    const id = randomUUID();
    const filename = `${id}-${path.basename(info.filename || 'video.bin')}`;
    const outPath = path.join(VIDEO_DIR, filename);
    const ws = fs.createWriteStream(outPath);
    file.pipe(ws);
    uploads.push(
      new Promise((resolve, reject) => {
        ws.on('finish', () => resolve({ id, filename, path: outPath, mimeType: info.mimeType || 'application/octet-stream' }));
        ws.on('error', reject);
        file.on('error', reject);
      })
    );
  });

  busboy.on('finish', async () => {
    if (!hadFile) return res.status(400).json({ error: 'No files uploaded' });
    const data = readData();
    const saved = await Promise.all(uploads);
    for (const item of saved) {
      data.videos.push({
        id: item.id,
        filename: item.filename,
        path: item.path,
        mimeType: item.mimeType,
        title: fields.title || item.filename,
        createdAt: new Date().toISOString(),
      });
    }
    writeData(data);
    res.json({ ok: true, videos: saved });
  });

  req.pipe(busboy);
});

app.post('/api/clips', requireAuth, (req, res) => {
  const { videoId, start, duration = 10, title = '' } = req.body || {};
  if (!videoId || start === undefined) return res.status(400).json({ error: 'videoId and start are required' });

  const data = readData();
  const video = data.videos.find((v) => v.id === videoId);
  if (!video) return res.status(404).json({ error: 'Video not found' });

  const output = path.join(CLIP_DIR, `${randomUUID()}.mp4`);
  if (!ffmpegAvailable()) return res.status(500).json({ error: 'ffmpeg is not installed' });

  execFileSync('ffmpeg', ['-y', '-ss', String(start), '-i', video.path, '-t', String(duration), '-c', 'copy', output], { stdio: 'ignore' });
  const clip = { id: randomUUID(), videoId, output, title, start, duration, createdAt: new Date().toISOString() };
  data.clips.push(clip);
  writeData(data);
  res.json({ ok: true, clip });
});

app.get('/api/clips', requireAuth, (_, res) => res.json(readData().clips));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Private backend listening on http://0.0.0.0:${PORT}`);
});
