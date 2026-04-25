import { useState } from 'react';

export function NFHSAdmin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isGithub = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
  if (isGithub) return <div className="p-4">Admin functions are hidden on public site.</div>;

  const connect = async () => {
    setLoading(true);
    setMessage(null);
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';

    // Only attempt direct host:3001 fallbacks when running on localhost (avoids mixed-content on HTTPS pages)
    const isLocalhost = ['localhost', '127.0.0.1', '::1', ''].includes(hostname);

    const candidates = ['/api/temp-nfhs-token'];
    if (isLocalhost) {
      candidates.push(`${protocol}//${hostname}:3001/api/temp-nfhs-token`);
      candidates.push(`http://localhost:3001/api/temp-nfhs-token`);
    }

    let lastErr: any = null;
    for (const url of candidates) {
      try {
        const r = await fetch(url, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
        setMessage('Authenticated for 5 minutes');
        setLoading(false);
        return;
      } catch (err: any) {
        lastErr = err;
        // If fetch failed due to mixed-content (HTTPS page -> HTTP resource), give a clear message and stop trying fallbacks.
        if (err instanceof TypeError && typeof window !== 'undefined' && window.location.protocol === 'https:') {
          setMessage('Network error: browser blocked the request (mixed-content). Run the helper on HTTPS or use the development server proxy.');
          setLoading(false);
          return;
        }
        // otherwise try next candidate
      }
    }

    setMessage(lastErr?.message || 'All endpoints failed');
    setLoading(false);
  };

  const generate = async () => {
    setLoading(true);
    setMessage(null);
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    const candidates = [
      '/api/generate-highlights',
      `${protocol}//${hostname}:3001/api/generate-highlights`,
      `http://localhost:3001/api/generate-highlights`,
    ];

    let lastErr: any = null;
    for (const url of candidates) {
      try {
        const r = await fetch(url, { method: 'POST' });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
        setMessage(`Highlights generated: ${j.metaPath}`);
        setLoading(false);
        return;
      } catch (err: any) {
        lastErr = err;
      }
    }

    setMessage(lastErr?.message || 'All endpoints failed');
    setLoading(false);
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">NFHS Admin</h2>
      <div className="flex gap-2">
        <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="username" className="p-2" />
        <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="password" type="password" className="p-2" />
        <button onClick={connect} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">Connect</button>
        <button onClick={generate} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">Generate Highlights</button>
      </div>
      {message && <div className="p-2 bg-card rounded">{message}</div>}
    </div>
  );
}
