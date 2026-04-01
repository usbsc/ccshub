import { Link } from "react-router";
import { Calendar, MapPin, Clock, Play } from "lucide-react";
import { games } from "../data/games";
import { teams } from "../data/teams";
import { motion } from "motion/react";
import { useState } from "react";

export function Schedule() {
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  const levels = ["all", "Varsity", "JV", "Freshman"];

  const filteredGames =
    selectedLevel === "all"
      ? games
      : games.filter((g) => g.level === selectedLevel);

  const upcomingGames = filteredGames
    .filter((g) => g.status === "upcoming")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const liveGames = filteredGames.filter((g) => g.status === "live");

  const getTeam = (id: string) => teams.find((t) => t.id === id);

  // Group games by date
  const gamesByDate = upcomingGames.reduce((acc, game) => {
    const date = new Date(game.date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(game);
    return acc;
  }, {} as Record<string, typeof upcomingGames>);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
      >
        <div className="relative h-48 bg-gradient-to-br from-green-900 to-green-700 p-8 flex flex-col justify-end">
          <div className="absolute inset-0 opacity-20">
            <img
              src="https://images.unsplash.com/photo-1581588535512-4dbe198fbbee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb290YmFsbCUyMHN0YWRpdW0lMjBsaWdodHN8ZW58MXx8fHwxNzc0MDExODExfDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Stadium"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Calendar className="w-10 h-10" />
              Game Schedule
            </h1>
            <p className="text-green-100">
              Complete schedule for all CCS football levels
            </p>
          </div>
        </div>
      </motion.div>

      {/* Level Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3 overflow-x-auto pb-2"
      >
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedLevel === level
                ? "bg-green-600 text-white shadow-lg shadow-green-500/30"
                : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            {level === "all" ? "All Levels" : level}
          </button>
        ))}
      </motion.div>

      {/* Live Games */}
      {liveGames.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            Live Now
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {liveGames.map((game, idx) => {
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
                    className="block bg-zinc-900 rounded-xl border border-red-500 p-5 hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        LIVE
                      </span>
                      <button className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                        <Play className="w-4 h-4" fill="white" />
                      </button>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{away?.name}</span>
                        <span className="text-2xl font-bold">{game.awayScore}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{home?.name}</span>
                        <span className="text-2xl font-bold">{game.homeScore}</span>
                      </div>
                    </div>
                    <div className="text-sm text-zinc-400">
                      {game.quarter} • {game.timeRemaining}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Upcoming Games by Date */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Upcoming Games</h2>
        <div className="space-y-6">
          {Object.entries(gamesByDate).map(([date, dateGames], dateIdx) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + dateIdx * 0.1 }}
            >
              <div className="bg-zinc-800 px-4 py-2 rounded-t-xl font-bold">
                {date}
              </div>
              <div className="bg-zinc-900 rounded-b-xl border border-zinc-800 border-t-0 divide-y divide-zinc-800">
                {dateGames.map((game) => {
                  const home = getTeam(game.homeTeam);
                  const away = getTeam(game.awayTeam);
                  return (
                    <Link
                      key={game.id}
                      to={`/game/${game.id}`}
                      className="flex items-center gap-6 p-5 hover:bg-zinc-800 transition-colors"
                    >
                      {/* Time */}
                      <div className="w-24 text-center">
                        <div className="flex items-center justify-center gap-2 text-blue-400">
                          <Clock className="w-4 h-4" />
                          <span className="font-semibold">{game.time}</span>
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {game.level}
                        </div>
                      </div>

                      {/* Teams */}
                      <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                        <div className="flex items-center gap-3">
                          <img
                            src={away?.image}
                            alt={away?.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <div className="font-semibold">{away?.name}</div>
                            <div className="text-sm text-zinc-400">
                              {away?.record.wins}-{away?.record.losses}
                            </div>
                          </div>
                        </div>

                        <div className="text-center text-zinc-500 font-medium">
                          at
                        </div>

                        <div className="flex items-center gap-3">
                          <img
                            src={home?.image}
                            alt={home?.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <div className="font-semibold">{home?.name}</div>
                            <div className="text-sm text-zinc-400">
                              {home?.record.wins}-{home?.record.losses}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stadium */}
                      <div className="w-48 text-right">
                        <div className="flex items-center justify-end gap-2 text-zinc-400 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{game.stadium}</span>
                        </div>
                      </div>

                      {/* Watch Button */}
                      {game.videoUrl && (
                        <button className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full transition-colors">
                          <Play className="w-4 h-4" fill="white" />
                        </button>
                      )}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
