import { Image, Search, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { teams } from "../data/teams";

export function Photos() {
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white dark:text-foreground">
          Photo <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600">Gallery</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Browse photos from CCS football games, practices, and events.
        </p>
      </motion.div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-purple-500 transition-colors" />
          <input
            type="text"
            placeholder="Search photos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-xl"
            aria-label="Search photos"
          />
        </div>

        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="bg-card text-foreground border border-border rounded-2xl py-4 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-xl cursor-pointer appearance-none"
        >
          <option value="all">All Teams</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      {/* Coming Soon Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-2xl p-12 border border-purple-800/50 text-center"
      >
        <Image className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-foreground mb-2">Photo Gallery Coming Soon</h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          We're building a comprehensive photo gallery featuring game action, team portraits, and events from CCS football.
          Check back soon for stunning photography from the 2025-26 season.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <div className="bg-card/50 rounded-lg px-4 py-3 border border-border">
            <p className="text-sm font-bold text-muted-foreground">
              📸 Game Action Photos
            </p>
          </div>
          <div className="bg-card/50 rounded-lg px-4 py-3 border border-border">
            <p className="text-sm font-bold text-muted-foreground">
              👥 Team Portraits
            </p>
          </div>
          <div className="bg-card/50 rounded-lg px-4 py-3 border border-border">
            <p className="text-sm font-bold text-muted-foreground">
              🏆 Event Coverage
            </p>
          </div>
        </div>
      </motion.div>

      {/* Sample Structure (Disabled) */}
      <div className="text-center py-8 text-muted-foreground">
        <Zap className="w-5 h-5 inline mr-2 text-purple-400" />
        <p className="text-sm font-medium">
          Photo uploads and gallery management will be available in a future update
        </p>
      </div>
    </div>
  );
}
