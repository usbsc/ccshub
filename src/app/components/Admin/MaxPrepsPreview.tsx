import { useEffect, useState } from 'react';


export function MaxPrepsPreview() {
  const [slug, setSlug] = useState('santa-clara-high-school');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // no-op
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to load preview file produced by CLI at /.session/maxpreps_preview/<slug>.json
      const previewUrl = `/session/maxpreps_preview/${slug}.json`;
      const resp = await fetch(previewUrl);
      if (!resp.ok) {
        setError(`Preview file not found. Run scripts/maxpreps_sync_cli.ts locally to generate a preview.`);
        setData(null);
      } else {
        const res = await resp.json();
        setData(res);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch preview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">MaxPreps Preview</h2>
      <div className="flex gap-2">
        <input value={slug} onChange={(e) => setSlug(e.target.value)} className="bg-card p-2 rounded" />
        <button onClick={load} className="px-4 py-2 bg-purple-600 rounded text-white">Load</button>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-400">{error}</div>}

      {data && (
        <div className="bg-card p-4 rounded">
          <h3 className="font-bold">Meta</h3>
          <pre className="text-xs max-h-48 overflow-auto">{JSON.stringify(data.meta, null, 2)}</pre>

          <h3 className="font-bold mt-2">Roster</h3>
          <pre className="text-xs max-h-48 overflow-auto">{JSON.stringify(data.roster, null, 2)}</pre>

          <h3 className="font-bold mt-2">Schedule</h3>
          <pre className="text-xs max-h-48 overflow-auto">{JSON.stringify(data.schedule, null, 2)}</pre>

          <h3 className="font-bold mt-2">Photos</h3>
          <pre className="text-xs max-h-48 overflow-auto">{JSON.stringify(data.photos, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
