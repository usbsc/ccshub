import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { nfhsService, type Play } from "../services/nfhs";

interface NFHSContextType {
  isAuthenticated: boolean;
  plays: Play[];
  isLoading: boolean;
  error: string | null;
  authenticate: (email: string, password: string) => Promise<void>;
  fetchPlays: () => Promise<void>;
  logout: () => void;
  pollingActive: boolean;
}

const NFHSContext = createContext<NFHSContextType | undefined>(undefined);

export function NFHSProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [plays, setPlays] = useState<Play[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingActive, setPollingActive] = useState(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPlays = useCallback(async () => {
    if (!nfhsService.isAuthenticated()) {
      return;
    }

    try {
      const playsData = await nfhsService.fetchPlaysOfTheWeek();
      setPlays(playsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch plays");
      console.error("Error fetching plays:", err);
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setPollingActive(false);
      console.warn("Stopped NFHS polling");
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return; // Already polling

    setPollingActive(true);
    console.warn("Started 5-minute polling for NFHS plays");

    // Fetch immediately
    fetchPlays();

    // Then poll every 5 minutes
    pollingIntervalRef.current = setInterval(() => {
      console.warn("Polling NFHS for new plays...");
      fetchPlays();
    }, 5 * 60 * 1000); // 5 minutes
  }, [fetchPlays]);

  const authenticate = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);

      try {
        await nfhsService.authenticate(email, password);
        setIsAuthenticated(true);

        // Fetch initial plays
        await fetchPlays();

        // Start polling every 5 minutes
        startPolling();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPlays, startPolling]
  );

  const logout = useCallback(() => {
    stopPolling();
    nfhsService.logout();
    setIsAuthenticated(false);
    setPlays([]);
    setError(null);
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const value: NFHSContextType = {
    isAuthenticated,
    plays,
    isLoading,
    error,
    authenticate,
    fetchPlays,
    logout,
    pollingActive,
  };

  return (
    <NFHSContext.Provider value={value}>{children}</NFHSContext.Provider>
  );
}

export function useNFHS() {
  const context = useContext(NFHSContext);
  if (context === undefined) {
    throw new Error("useNFHS must be used within NFHSProvider");
  }
  return context;
}
