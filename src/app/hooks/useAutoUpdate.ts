import { useEffect, useState } from "react";

/**
 * Hook to simulate auto-updating data
 * In production, this would fetch from MaxPreps, Hudl, etc.
 */
export function useAutoUpdate(intervalMs: number = 60000) {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdate(new Date());
      // In production, this would trigger data fetching
      console.log("Auto-update triggered at:", new Date().toLocaleTimeString());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return lastUpdate;
}
