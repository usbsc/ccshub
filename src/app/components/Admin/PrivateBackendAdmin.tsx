import { useCallback, useEffect, useMemo, useState } from 'react';

type VideoItem = { id: string; filename: string; title: string; createdAt: string };
type ClipItem = { id: string; title: string; start: string; duration: number; output: string };

const backendUrl = import.meta.env.VITE_PRIVATE_BACKEND_URL || 'http://localhost:3030';
const backendToken = import.meta.env.VITE_PRIVATE_BACKEND_TOKEN || 'ccshub-private-dev';

export function PrivateBackendAdmin() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [clips, setClips] = useState<ClipItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [clipVideoId, setClipVideoId] = useState('');
  const [clipStart, setClipStart] = useState('0');
  const [clipDuration, setClipDuration] = useState('10');
  const [clipTitle, setClipTitle] = useState('');

  const headers = useMemo(() => ({ Authorization: `Bearer ${backendToken}` }), []);

  const load = useCallback(async () => {
    const [v, c] = await Promise.all([
      fetch(`${backendUrl}/api/videos`, { headers }).then((r) => r.json()),
      fetch(`${backendUrl}/api/clips`, { headers }).then((r) => r.json()),
    ]);
    setVideos(v);
    setClips(c);
  }, [headers]);

  useEffect(() => {
    const init = async () => {
      try {
        await load();
      } catch (e) {
        setMessage(String(e));
      }
    };

    void init();
  }, [load]);

  const upload = async () => {
    const fd = new FormData();
    fd.append('title', title);
    files.forEach((f) => fd.append('file', f));
    const r = await fetch(`${backendUrl}/api/videos/upload`, { method: 'POST', headers, body: fd });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Upload failed');
    setMessage('Uploaded videos.');
    setFiles([]);
    await load();
  };

  const createClip = async () => {
    const r = await fetch(`${backendUrl}/api/clips`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: clipVideoId, start: clipStart, duration: Number(clipDuration), title: clipTitle }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Clip failed');
    setMessage('Clip created.');
    await load();
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Private Video Backend</h2>
      <div className="grid gap-2 md:grid-cols-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Upload title" className="p-2 rounded border border-border bg-background" />
        <input type="file" multiple accept="video/*" onChange={(e) => setFiles(Array.from(e.target.files || []))} className="p-2 rounded border border-border bg-background" />
      </div>
      <button onClick={() => upload().catch((e) => setMessage(String(e)))} className="px-4 py-2 bg-blue-600 text-white rounded">Upload Videos</button>

      <div className="grid gap-2 md:grid-cols-4">
        <select value={clipVideoId} onChange={(e) => setClipVideoId(e.target.value)} className="p-2 rounded border border-border bg-background md:col-span-2">
          <option value="">Select video</option>
          {videos.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
        </select>
        <input value={clipStart} onChange={(e) => setClipStart(e.target.value)} placeholder="Start seconds" className="p-2 rounded border border-border bg-background" />
        <input value={clipDuration} onChange={(e) => setClipDuration(e.target.value)} placeholder="Duration" className="p-2 rounded border border-border bg-background" />
      </div>
      <input value={clipTitle} onChange={(e) => setClipTitle(e.target.value)} placeholder="Clip title" className="p-2 rounded border border-border bg-background w-full" />
      <button onClick={() => createClip().catch((e) => setMessage(String(e)))} className="px-4 py-2 bg-green-600 text-white rounded">Create Clip</button>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="font-semibold mb-2">Videos</h3>
          <pre className="p-3 rounded border border-border bg-card text-xs overflow-auto">{JSON.stringify(videos, null, 2)}</pre>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Clips</h3>
          <pre className="p-3 rounded border border-border bg-card text-xs overflow-auto">{JSON.stringify(clips, null, 2)}</pre>
        </div>
      </div>

      {message && <div className="p-2 bg-card rounded">{message}</div>}
    </div>
  );
}
