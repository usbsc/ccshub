import { Search, ExternalLink, Filter, PlayCircle } from "lucide-react";
import { games } from "../data/games";
import { teams } from "../data/teams";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { useNfhsCifccsBroadcasts } from "../hooks/useNfhsCifccsBroadcasts";
import { Link } from "react-router";
import { ImageWithFallback } from "./common/ImageWithFallback";

export function Broadcasts() {
  const [teamQuery, setTeamQuery] = useState("");
  const [divisionLeagueQuery, setDivisionLeagueQuery] = useState("");

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), []);
  const getTeam = (id: string) => teamById.get(id);

  const {
    broadcasts: nfhsBroadcasts,
    loading: nfhsLoading,
    error: nfhsError,
    lastUpdated: nfhsLastUpdated,
  } = useNfhsCifccsBroadcasts();

  const filteredNfhsBroadcasts = useMemo(() => {
    const tq = teamQuery.trim().toLowerCase();
    const dlq = divisionLeagueQuery.trim().toLowerCase();

    return nfhsBroadcasts
      .filter((b) => {
        const haystack =
          `${b.title} ${b.publisherName ?? ""} ${b.publisherSlug ?? ""}`.toLowerCase();
        const matchesTeam = tq.length === 0 || haystack.includes(tq);
        const matchesDivisionLeague = dlq.length === 0 || haystack.includes(dlq);
        return matchesTeam && matchesDivisionLeague;
      })
      .slice(0, 20);
  }, [divisionLeagueQuery, nfhsBroadcasts, teamQuery]);

  const liveGames = games.filter((g) => g.status === "live");
  const upcomingGames = games
    .filter((g) => g.status === "upcoming")
    .slice(0, 10);

  const baseBroadcastGames = liveGames.length > 0 ? liveGames : upcomingGames;

  const broadcastGames = useMemo(() => {
    const tq = teamQuery.trim().toLowerCase();
    const dlq = divisionLeagueQuery.trim().toLowerCase();

    return baseBroadcastGames.filter((game) => {
      const home = teamById.get(game.homeTeam);
      const away = teamById.get(game.awayTeam);

      const teamHaystack = `${home?.name ?? ""} ${home?.mascot ?? ""} ${away?.name ?? ""} ${
        away?.mascot ?? ""
      }`.toLowerCase();
      const matchesTeam = tq.length === 0 || teamHaystack.includes(tq);

      const divisionLeagueHaystack = `${home?.division ?? ""} ${home?.league ?? ""} ${
        away?.division ?? ""
      } ${away?.league ?? ""}`.toLowerCase();
      const matchesDivisionLeague = dlq.length === 0 || divisionLeagueHaystack.includes(dlq);

      return matchesTeam && matchesDivisionLeague;
    });
  }, [baseBroadcastGames, divisionLeagueQuery, teamById, teamQuery]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white dark:text-foreground">
          Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-600">Broadcasts</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Watch live football broadcasts and replays from CCS teams. Powered by NFHS Network and more.
        </p>
      </motion.div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-red-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by team..."
            value={teamQuery}
            onChange={(e) => setTeamQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all shadow-xl"
            aria-label="Search broadcasts by team"
          />
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-red-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by division or league..."
            value={divisionLeagueQuery}
            onChange={(e) => setDivisionLeagueQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all shadow-xl"
            aria-label="Search broadcasts by division or league"
          />
        </div>
      </div>

      {/* NFHS Network Broadcasts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <div className="w-2 h-8 bg-red-600 rounded-full"></div>
            NFHS Network & CIFCCS Broadcasts
          </h2>
          {nfhsLastUpdated ? (
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Updated{" "}
              {nfhsLastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          ) : null}
        </div>

        {nfhsLoading ? (
          <div className="text-sm text-muted-foreground">Loading NFHS broadcasts…</div>
        ) : nfhsError ? (
          <div className="text-sm text-muted-foreground">
            NFHS broadcasts unavailable: {nfhsError}
          </div>
        ) : filteredNfhsBroadcasts.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No NFHS broadcasts found for your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNfhsBroadcasts.map((b) => (
              <a
                key={b.id}
                href={b.pageUrl}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-border bg-card hover:bg-secondary p-4 transition-all hover:shadow-xl hover:shadow-red-500/10"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="font-black text-white dark:text-foreground uppercase tracking-tight line-clamp-2">
                      {b.title}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                      {new Date(b.startTime).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                    {b.publisherName ? (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {b.publisherName}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {b.paymentRequired ? (
                      <span className="bg-secondary text-foreground px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                        SUB
                      </span>
                    ) : null}
                    {b.status === "live" ? (
                      <span className="bg-red-600 text-white px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                        LIVE
                      </span>
                    ) : null}
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Game Broadcasts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <div className="w-2 h-8 bg-red-600 rounded-full"></div>
            {liveGames.length > 0 ? "Live Game Broadcasts" : "Upcoming Games"}
          </h2>
          <Link
            to="/schedule"
            className="text-sm font-bold text-red-500 hover:text-red-400 flex items-center gap-1 group"
          >
            Full Schedule →
          </Link>
        </div>

        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6">
          <Filter className="w-3 h-3 inline mr-1" /> Showing {broadcastGames.length} of {baseBroadcastGames.length}
        </div>

        {broadcastGames.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {broadcastGames.map((game) => {
              const home = getTeam(game.homeTeam);
              const away = getTeam(game.awayTeam);
              return (
                <Link
                  key={game.id}
                  to={`/game/${game.id}`}
                  className="group relative bg-card hover:bg-secondary rounded-3xl overflow-hidden border border-border transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10 active:scale-[0.98]"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <span className="bg-secondary text-muted-foreground px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase">
                        {game.level} • {game.time}
                      </span>
                      {game.status === "live" && (
                        <span className="flex items-center gap-1.5 text-red-500 text-[10px] font-black uppercase">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                          LIVE
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-secondary p-1">
                            <ImageWithFallback
                              src={away?.image}
                              className="w-full h-full object-contain"
                              alt=""
                            />
                          </div>
                          <span className="font-bold text-lg truncate pr-4 text-foreground uppercase tracking-tight">
                            {away?.name || "Away Team"}
                          </span>
                        </div>
                        <span className="text-2xl font-black text-white dark:text-foreground">
                          {game.awayScore}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-secondary p-1">
                            <ImageWithFallback
                              src={home?.image}
                              className="w-full h-full object-contain"
                              alt=""
                            />
                          </div>
                          <span className="font-bold text-lg truncate pr-4 text-foreground uppercase tracking-tight">
                            {home?.name || "Home Team"}
                          </span>
                        </div>
                        <span className="text-2xl font-black text-white dark:text-foreground">
                          {game.homeScore}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                        {game.stadium}
                      </span>
                      <PlayCircle className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <PlayCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground font-medium">No broadcasts available at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
