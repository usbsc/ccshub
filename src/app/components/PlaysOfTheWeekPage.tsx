import { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  Play,
  Filter,
  X,
  AlertCircle,
} from "lucide-react";
import { useNFHS } from "../context/NFHSContext";
import { NFHSCredentialForm } from "./NFHSCredentialForm";
import { PlayCard } from "./PlayCard";
import type { Play as PlayType } from "../services/nfhs";

export function PlaysOfTheWeekPage() {
  const { isAuthenticated, plays, isLoading, error, authenticate } = useNFHS();
  const [submitting, setSubmitting] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedPlayType, setSelectedPlayType] = useState<PlayType["playType"] | null>(null);

  const handleAuth = async (username: string, password: string) => {
    setSubmitting(true);
    try {
      await authenticate(username, password);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter plays
  const filteredPlays = useMemo(() => {
    return plays.filter((play) => {
      if (selectedTeam && play.team !== selectedTeam) return false;
      if (selectedPlayType && play.playType !== selectedPlayType) return false;
      return true;
    });
  }, [plays, selectedTeam, selectedPlayType]);

  // Get unique teams and play types
  const teams = useMemo(
    () => [...new Set(plays.map((p) => p.team))].sort(),
    [plays]
  );

  const playTypes: PlayType["playType"][] = [
    "touchdown",
    "sack",
    "interception",
    "fumble",
    "other",
  ];

  const playTypeLabels: Record<PlayType["playType"], string> = {
    touchdown: "Touchdowns",
    sack: "Sacks",
    interception: "Interceptions",
    fumble: "Fumbles",
    other: "Other Highlights",
  };

  const playTypeEmojis: Record<PlayType["playType"], string> = {
    touchdown: "🏈",
    sack: "💥",
    interception: "🎯",
    fumble: "💫",
    other: "⚡",
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
            <Play className="w-10 h-10 text-blue-400" />
            Plays of the Week
          </h1>
          <p className="text-lg text-muted-foreground">
            Comprehensive collection of highlight plays from CCS football
          </p>
        </div>

        <div className="max-w-md">
          <NFHSCredentialForm
            onSubmit={handleAuth}
            isLoading={submitting}
            error={error || undefined}
          />
        </div>
      </div>
    );
  }

  // Show error
  if (error && !plays.length) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-red-400 mb-1">Error Loading Plays</h3>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
          <Play className="w-10 h-10 text-blue-400" />
          Plays of the Week
        </h1>
        <p className="text-lg text-muted-foreground">
          {filteredPlays.length} highlight{filteredPlays.length !== 1 ? "s" : ""}{" "}
          available
        </p>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-blue-400" />
          <h2 className="font-bold text-lg">Filter Plays</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team Filter */}
          <div>
            <label className="block text-sm font-semibold mb-3">Teams</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTeam(null)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedTeam === null
                    ? "bg-blue-600 text-white"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                All Teams
              </button>
              {teams.map((team) => (
                <button
                  key={team}
                  onClick={() => setSelectedTeam(team)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedTeam === team
                      ? "bg-blue-600 text-white"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  {team}
                </button>
              ))}
            </div>
          </div>

          {/* Play Type Filter */}
          <div>
            <label className="block text-sm font-semibold mb-3">Play Type</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedPlayType(null)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedPlayType === null
                    ? "bg-blue-600 text-white"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                All Types
              </button>
              {playTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedPlayType(type)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedPlayType === type
                      ? "bg-blue-600 text-white"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  <span className="mr-1">{playTypeEmojis[type]}</span>
                  {playTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedTeam || selectedPlayType) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedTeam && (
              <button
                onClick={() => setSelectedTeam(null)}
                className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-500/30"
              >
                {selectedTeam}
                <X className="w-3 h-3" />
              </button>
            )}
            {selectedPlayType && (
              <button
                onClick={() => setSelectedPlayType(null)}
                className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-500/30"
              >
                {playTypeLabels[selectedPlayType]}
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Loading State */}
      {isLoading && filteredPlays.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-secondary rounded-xl aspect-video animate-pulse"
            />
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && filteredPlays.length === 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-8 text-center">
          <Play className="w-12 h-12 text-blue-400 mx-auto mb-4 opacity-50" />
          <h3 className="font-bold text-lg mb-2">No Plays Found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or check back later
          </p>
        </div>
      )}

      {/* Plays Grid */}
      {filteredPlays.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlays.map((play) => (
            <PlayCard key={play.id} play={play} variant="compact" />
          ))}
        </div>
      )}
    </div>
  );
}
