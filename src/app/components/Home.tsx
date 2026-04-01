import { Link } from "react-router";
import { Calendar, MapPin, Users, TrendingUp, Clock } from "lucide-react";
import { games } from "../data/games";
import { teams } from "../data/teams";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { useAutoUpdate } from "../hooks/useAutoUpdate";

export function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const homeTeam = localStorage.getItem("homeTeam");
  const lastUpdate = useAutoUpdate(60000); // Auto-update every 60 seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const liveGames = games.filter((g) => g.status === "live");
  const upcomingGames = games.filter((g) => g.status === "upcoming").slice(0, 4);
  const recentGames = games.filter((g) => g.status === "final").slice(0, 3);

  const homeTeamGames = homeTeam
    ? games.filter(
        (g) => g.homeTeam === homeTeam || g.awayTeam === homeTeam
      )
    : [];

  const getTeam = (id: string) => teams.find((t) => t.id === id);

  const topRankedTeams = [...teams].sort((a, b) => a.ranking - b.ranking).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative h-80 rounded-2xl overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1663563624897-de8972d7ce93?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaWdoJTIwc2Nob29sJTIwZm9vdGJhbGwlMjBnYW1lJTIwbmlnaHR8ZW58MXx8fHwxNzc0MDU1MjU3fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Football game"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-2"
          >
            CCS Football
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-300"
          >
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            • {currentTime.toLocaleTimeString()}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-zinc-400 mt-2"
          >
            Off-Season • Next season starts August 2026
          </motion.p>
        </div>
      </div>

      {/* Priority Home Team Games */}
      {homeTeam && homeTeamGames.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-900/40 to-green-800/40 border border-green-700 rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            Your Team's Games
          </h2>
          <div className="grid gap-4">
            {homeTeamGames.slice(0, 3).map((game) => {
              const home = getTeam(game.homeTeam);
              const away = getTeam(game.awayTeam);
              return (
                <Link
                  key={game.id}
                  to={`/game/${game.id}`}
                  className="bg-zinc-900/80 rounded-xl p-4 hover:bg-zinc-800/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-sm font-medium text-green-400">
                          {game.status === "live" ? "LIVE NOW" : game.status.toUpperCase()}
                        </span>
                        <span className="text-sm text-zinc-400">{game.level}</span>
                        <span className="text-sm text-zinc-400">
                          {new Date(game.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{away?.name}</span>
                          <span className="text-2xl font-bold">{game.awayScore}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{home?.name}</span>
                          <span className="text-2xl font-bold">{game.homeScore}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Live Games */}
      {liveGames.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <h2 className="text-3xl font-bold">Live Games</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {liveGames.map((game, idx) => {
              const home = getTeam(game.homeTeam);
              const away = getTeam(game.awayTeam);
              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Link
                    to={`/game/${game.id}`}
                    className="block bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl overflow-hidden border border-zinc-700 hover:border-blue-500 transition-all hover:shadow-2xl hover:shadow-blue-500/20"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1581588535512-4dbe198fbbee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb290YmFsbCUyMHN0YWRpdW0lMjBsaWdodHN8ZW58MXx8fHwxNzc0MDExODExfDA&ixlib=rb-4.1.0&q=80&w=1080"
                        alt="Stadium"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent"></div>
                      <div className="absolute top-4 left-4">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                          LIVE
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-sm text-zinc-300 mb-1">{game.quarter}</p>
                        <p className="text-lg font-semibold">
                          {game.timeRemaining} remaining
                        </p>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-sm text-zinc-400">AWAY</div>
                            <div className="font-semibold text-lg">{away?.name}</div>
                          </div>
                          <div className="text-3xl font-bold">{game.awayScore}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-sm text-zinc-400">HOME</div>
                            <div className="font-semibold text-lg">{home?.name}</div>
                          </div>
                          <div className="text-3xl font-bold">{game.homeScore}</div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-zinc-700 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <MapPin className="w-4 h-4" />
                          {game.stadium}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Users className="w-4 h-4" />
                          {game.attendance?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Upcoming Games */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-8 h-8 text-blue-400" />
          <h2 className="text-3xl font-bold">Upcoming Games</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {upcomingGames.map((game, idx) => {
            const home = getTeam(game.homeTeam);
            const away = getTeam(game.awayTeam);
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  to={`/game/${game.id}`}
                  className="block bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-zinc-600 transition-all hover:bg-zinc-800"
                >
                  <div className="flex items-center gap-2 text-sm text-blue-400 mb-3">
                    <Clock className="w-4 h-4" />
                    {new Date(game.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    • {game.time}
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="font-semibold truncate">{away?.name}</div>
                    <div className="text-zinc-400 text-sm">at</div>
                    <div className="font-semibold truncate">{home?.name}</div>
                  </div>
                  <div className="text-xs text-zinc-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {game.stadium}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Recent Scores & Top Rankings Side by Side */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Scores */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Recent Scores</h2>
          <div className="space-y-3">
            {recentGames.map((game) => {
              const home = getTeam(game.homeTeam);
              const away = getTeam(game.awayTeam);
              const homeWon = game.homeScore > game.awayScore;
              return (
                <Link
                  key={game.id}
                  to={`/game/${game.id}`}
                  className="block bg-zinc-900 rounded-xl p-4 border border-zinc-800 hover:border-zinc-600 transition-colors"
                >
                  <div className="text-xs text-zinc-500 mb-2">
                    {new Date(game.date).toLocaleDateString()} • Final
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={homeWon ? "opacity-60" : "font-semibold"}>
                      {away?.name}
                    </span>
                    <span className={homeWon ? "opacity-60" : "text-xl font-bold"}>
                      {game.awayScore}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={!homeWon ? "opacity-60" : "font-semibold"}>
                      {home?.name}
                    </span>
                    <span className={!homeWon ? "opacity-60" : "text-xl font-bold"}>
                      {game.homeScore}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Top Rankings */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Top Rankings</h2>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            {topRankedTeams.map((team, idx) => (
              <Link
                key={team.id}
                to={`/team/${team.id}`}
                className="flex items-center gap-4 p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                  {team.ranking}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{team.name}</div>
                  <div className="text-sm text-zinc-400">
                    {team.record.wins}-{team.record.losses} • {team.division}
                  </div>
                </div>
              </Link>
            ))}
            <Link
              to="/rankings"
              className="block p-4 text-center text-blue-400 hover:bg-zinc-800 transition-colors font-medium"
            >
              View Full Rankings →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}