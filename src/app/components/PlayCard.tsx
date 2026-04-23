import { motion } from "motion/react";
import { Play, Calendar } from "lucide-react";
import type { Play as PlayType } from "../services/nfhs";

interface PlayCardProps {
  play: PlayType;
  onClick?: () => void;
  variant?: "compact" | "full";
}

const playTypeColors: Record<PlayType["playType"], string> = {
  touchdown: "bg-green-500/20 text-green-400 border-green-500/30",
  sack: "bg-red-500/20 text-red-400 border-red-500/30",
  interception: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  fumble: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  other: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const playTypeIcons: Record<PlayType["playType"], string> = {
  touchdown: "🏈",
  sack: "💥",
  interception: "🎯",
  fumble: "💫",
  other: "⚡",
};

const playTypeLabels: Record<PlayType["playType"], string> = {
  touchdown: "Touchdown",
  sack: "Sack",
  interception: "Interception",
  fumble: "Fumble",
  other: "Highlight Play",
};

export function PlayCard({
  play,
  onClick,
  variant = "compact",
}: PlayCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (variant === "compact") {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`group cursor-pointer rounded-xl overflow-hidden border border-border transition-all ${onClick ? "hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10" : ""}`}
      >
        <div className="relative aspect-video bg-secondary overflow-hidden">
          {/* Thumbnail */}
          {play.thumbnailUrl ? (
            <img
              src={play.thumbnailUrl}
              alt={play.description}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <Play className="w-12 h-12 text-blue-400/50" />
            </div>
          )}

          {/* Play Type Badge */}
          <div
            className={`absolute top-3 right-3 px-3 py-1 rounded-lg text-xs font-bold border ${playTypeColors[play.playType]} backdrop-blur-sm`}
          >
            <span className="mr-1">{playTypeIcons[play.playType]}</span>
            {playTypeLabels[play.playType]}
          </div>

          {/* Week Badge */}
          <div className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white">
            Week {play.week}
          </div>

          {/* Video Time Badge */}
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg text-xs font-bold bg-black/70 text-white">
            {formatTime(play.timestamp)}
          </div>
        </div>

        {/* Play Info */}
        <div className="p-4">
          <div className="text-sm font-bold text-blue-400 mb-2">
            {play.team}
          </div>
          <h3 className="font-bold text-lg line-clamp-2 mb-2 group-hover:text-blue-300 transition-colors">
            {play.player}
            {play.playerNumber && (
              <span className="text-base text-muted-foreground">
                {" "}
                #{play.playerNumber}
              </span>
            )}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {play.description}
          </p>

          <div className="text-xs text-muted-foreground">
            {formatDate(play.gameDate)}
          </div>
        </div>
      </motion.div>
    );
  }

  // Full variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      {/* Video */}
      <div className="relative aspect-video bg-secondary">
        {play.thumbnailUrl ? (
          <img
            src={play.thumbnailUrl}
            alt={play.description}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Play className="w-16 h-16 text-blue-400/50" />
          </div>
        )}

        {/* Overlay with video link */}
        {play.videoUrl && (
          <a
            href={play.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors group cursor-pointer"
          >
            <button className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors">
              <Play className="w-8 h-8 text-white ml-1" />
            </button>
          </a>
        )}
      </div>

      {/* Info */}
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-lg font-bold text-blue-400 mb-2">
              {play.team}
            </div>
            <h2 className="text-3xl font-black mb-1">
              {play.player}
              {play.playerNumber && (
                <span className="text-2xl text-muted-foreground ml-2">
                  #{play.playerNumber}
                </span>
              )}
            </h2>
          </div>
          <div
            className={`px-4 py-2 rounded-lg text-sm font-bold border ${playTypeColors[play.playType]}`}
          >
            <span className="mr-2">{playTypeIcons[play.playType]}</span>
            {playTypeLabels[play.playType]}
          </div>
        </div>

        {/* Description */}
        <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
          {play.description}
        </p>

        {/* Meta Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-border">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-xs text-muted-foreground">Game Date</div>
              <div className="font-semibold">
                {new Date(play.gameDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Week</div>
            <div className="font-semibold text-lg">Week {play.week}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Video Time</div>
            <div className="font-semibold">{formatTime(play.timestamp)}</div>
          </div>
        </div>

        {/* Watch Button */}
        {play.videoUrl && (
          <a
            href={play.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Watch on NFHS
          </a>
        )}
      </div>
    </motion.div>
  );
}
