import { Link } from "react-router";
import { motion } from "motion/react";
import { Play, ArrowRight, AlertCircle } from "lucide-react";
import { useNFHS } from "../context/NFHSContext";
import { PlayCard } from "./PlayCard";

export function PlaysOfTheWeek() {
  const { isAuthenticated, plays, isLoading, error } = useNFHS();

  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="mb-8">
          <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
            <Play className="w-8 h-8 text-blue-400" />
            Plays of the Week
          </h2>
          <p className="text-muted-foreground">
            Connect your NFHS account to see this week's best highlights
          </p>
        </div>

        <div className="p-6 bg-card rounded-2xl border border-border max-w-md">
          <h3 className="font-bold mb-2">NFHS Access (Admin only)</h3>
          <p className="text-sm text-muted-foreground mb-4">
            NFHS login is restricted to site administrators. Use the admin panel to connect.
          </p>
          <Link to="/admin/nfhs" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg">
            Go to NFHS Admin
          </Link>
        </div>
      </motion.div>
    );
  }

  // Show error if auth failed
  if (error && !plays.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-red-400 mb-1">
              Error Loading Plays
            </h3>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Show loading state
  if (isLoading && !plays.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
          <Play className="w-8 h-8 text-blue-400" />
          Plays of the Week
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-secondary rounded-xl aspect-video animate-pulse"
            />
          ))}
        </div>
      </motion.div>
    );
  }

  // Show plays
  if (plays.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-8 text-center">
          <Play className="w-12 h-12 text-blue-400 mx-auto mb-4 opacity-50" />
          <h3 className="font-bold text-lg mb-2">No Plays Available</h3>
          <p className="text-muted-foreground">
            Check back soon for this week's highlights from NFHS broadcasts
          </p>
        </div>
      </motion.div>
    );
  }

  // Featured play (first one)
  const featuredPlay = plays.length > 0 ? plays[0] : null;
  const otherPlays = plays.slice(1, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black flex items-center gap-3">
          <Play className="w-8 h-8 text-blue-400" />
          Plays of the Week
        </h2>
        <Link
          to="/plays"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
        >
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Featured Play */}
      {featuredPlay && (
        <div className="mb-8">
          <PlayCard play={featuredPlay} variant="full" />
        </div>
      )}

      {/* Other Plays */}
      {otherPlays.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4">More Highlights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherPlays.map((play) => (
              <PlayCard key={play.id} play={play} variant="compact" />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
