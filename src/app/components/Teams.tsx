import { Link } from "react-router";
import { Search, MapPin, Trophy, Users, Zap } from "lucide-react";
import { teams } from "../data/teams";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { ImageWithFallback } from "./common/ImageWithFallback";

export function Teams() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeague, setSelectedLeague] = useState<string>("all");

  // Get unique leagues
  const leagues = useMemo(() => {
    const set = new Set<string>();
    for (const t of teams) set.add(t.league);
    return ["all", ...Array.from(set).sort()];
  }, []);

  const filteredTeams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return teams.filter((t) => {
      const matchesLeague = selectedLeague === "all" || t.league === selectedLeague;
      const matchesSearch =
        q.length === 0 ||
        t.name.toLowerCase().includes(q) ||
        t.mascot.toLowerCase().includes(q) ||
        t.league.toLowerCase().includes(q) ||
        t.division.toLowerCase().includes(q);
      return matchesLeague && matchesSearch;
    });
  }, [selectedLeague, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white dark:text-foreground">
          CCS <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-600">Teams</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Explore all teams competing in the Central Coast Section football leagues.
        </p>
      </motion.div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-xl"
            aria-label="Search teams"
          />
        </div>

        <select
          value={selectedLeague}
          onChange={(e) => setSelectedLeague(e.target.value)}
          className="bg-card text-foreground border border-border rounded-2xl py-4 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-xl cursor-pointer appearance-none"
        >
          {leagues.map((league) => (
            <option key={league} value={league}>
              {league === "all" ? "All Leagues" : league}
            </option>
          ))}
        </select>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.length > 0 ? (
          filteredTeams.map((team) => (
            <Link
              key={team.id}
              to={`/team/${team.id}`}
              className="group relative bg-card hover:bg-secondary rounded-3xl overflow-hidden border border-border transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 active:scale-[0.98]"
            >
              <div className="aspect-video overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 relative">
                <ImageWithFallback
                  src={team.image}
                  alt={team.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                <div className="absolute bottom-4 left-4 w-12 h-12 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center p-2 overflow-hidden border-2 border-white dark:border-slate-700">
                  <ImageWithFallback
                    src={team.image}
                    alt={team.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="p-6">
                <div className="mb-3">
                  <h2 className="text-xl font-black text-white dark:text-foreground mb-1 uppercase tracking-tight">
                    {team.name}
                  </h2>
                  <p className="text-blue-400 font-bold text-sm uppercase tracking-wide">
                    {team.mascot}
                  </p>
                </div>

                <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {team.league}
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    {team.division}
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    {team.record.wins}-{team.record.losses} Record
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide">
                    <span className="text-muted-foreground">CCS Rank: #{team.ranking}</span>
                    <span className="text-blue-400">View Team →</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground font-medium">No teams found matching your search.</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-card rounded-2xl p-6 border border-border text-center">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          Showing {filteredTeams.length} of {teams.length} teams
        </p>
      </div>
    </div>
  );
}
