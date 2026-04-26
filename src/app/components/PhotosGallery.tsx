import { useEffect, useState } from "react";

type Photo = {
  url: string;
  caption?: string;
  level?: string; // e.g. "JV", "VAR", or "FROSH"
};

export default function PhotosGallery({ teamId }: { teamId: string | undefined }) {
  const apiUrl = ((import.meta as unknown) as { env?: { VITE_LIGHTROOM_API_URL?: string } }).env?.VITE_LIGHTROOM_API_URL;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);

  useEffect(() => {
    if (!apiUrl) return;
    let cancelled = false;
    // setting loading here is intentional to indicate fetch start
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    fetch(`${apiUrl.replace(/\/?$/, "")}?teamId=${encodeURIComponent(teamId ?? "")}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Status ${r.status}`);
        return r.json();
      })
      .then((data: unknown) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setPhotos(data as Photo[]);
        } else if (data && typeof data === 'object') {
          const photosCandidate = (data as { photos?: unknown }).photos;
          if (Array.isArray(photosCandidate)) {
            setPhotos(photosCandidate as Photo[]);
          } else {
            setPhotos([]);
          }
        } else {
          setPhotos([]);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiUrl, teamId]);

  const visiblePhotos = showAll
    ? filterLevel
      ? photos.filter((p) => (p.level || "").toLowerCase() === filterLevel.toLowerCase())
      : photos
    : photos.slice(0, 10);

  return (
    <div>
      {loading && <div className="text-sm text-muted-foreground">Loading photos…</div>}
      {error && <div className="text-sm text-red-400">Error loading photos: {error}</div>}

      {!loading && photos.length === 0 && (
        <div className="text-sm text-muted-foreground">No photos available.</div>
      )}

      {photos.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {visiblePhotos.map((p, idx) => (
              <div key={idx} className="rounded overflow-hidden bg-black/5">
                <img src={p.url} alt={p.caption ?? `Photo ${idx + 1}`} className="w-full h-28 object-cover" />
                {p.caption && <div className="text-xs p-1 text-muted-foreground">{p.caption}</div>}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            {!showAll && (
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                onClick={() => setPromptOpen(true)}
              >
                More Photos
              </button>
            )}

            {showAll && (
              <button
                className="px-4 py-2 bg-secondary rounded"
                onClick={() => {
                  setShowAll(false);
                  setFilterLevel(null);
                }}
              >
                Show Less
              </button>
            )}

            {promptOpen && (
              <div className="p-4 bg-card rounded shadow">
                <div className="mb-2 text-sm">Select level to view all photos:</div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                    onClick={() => {
                      setFilterLevel("JV");
                      setShowAll(true);
                      setPromptOpen(false);
                    }}
                  >
                    JV
                  </button>
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                    onClick={() => {
                      setFilterLevel("VAR");
                      setShowAll(true);
                      setPromptOpen(false);
                    }}
                  >
                    VAR
                  </button>
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                    onClick={() => {
                      setFilterLevel("FROSH");
                      setShowAll(true);
                      setPromptOpen(false);
                    }}
                  >
                    FROSH
                  </button>
                  <button
                    className="px-3 py-1 bg-secondary rounded"
                    onClick={() => {
                      setFilterLevel(null);
                      setShowAll(true);
                      setPromptOpen(false);
                    }}
                  >
                    All
                  </button>
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded"
                    onClick={() => setPromptOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
