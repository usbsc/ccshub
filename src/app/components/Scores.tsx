import { Link } from "react-router";
import { Trophy, TrendingUp, MapPin, Users } from "lucide-react";
import { games } from "../data/games";
import { teams } from "../data/teams";
import { motion } from "motion/react";
import { useState } from "react";

export function Scores() {
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  const levels = ["all", "Varsity", "JV", "Freshman"];

  const filteredGames =
    selectedLevel === "all"
      ? games
      : games.filter((g) => g.level === selectedLevel);

  const finalGames = filteredGames
    .filter((g) => g.status === "final")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getTeam = (id: string) => teams.find((t) => t.id === id);

  // Group games by date
  const gamesByDate = finalGames.reduce((acc, game) => {
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
  }, {} as Record<string, typeof finalGames>);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
      >
        <div className="relative h-48 bg-gradient-to-br from-purple-900 to-purple-700 p-8 flex flex-col justify-end">
          <div className="absolute inset-0 opacity-20">
            <img
              src="https://images.unsplash.com/photo-1663563624897-de8972d7ce93?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaWdoJTIwc2Nob29sJTIwZm9vdGJhbGwlMjBnYW1lJTIwbmlnaHR8ZW58MXx8fHwxNzc0MDU1MjU3fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Football"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Trophy className="w-10 h-10" />
              Game Scores
            </h1>
            <p className="text-purple-100">Complete historical scores and results</p>
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
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            {level === "all" ? "All Levels" : level}
          </button>
        ))}
      </motion.div>

      {/* Scores by Date */}
      <section className="space-y-6">
        {Object.entries(gamesByDate).map(([date, dateGames], dateIdx) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + dateIdx * 0.1 }}
          >
            <div className="bg-zinc-800 px-4 py-2 rounded-t-xl font-bold flex items-center justify-between">
              <span>{date}</span>
              <span className="text-sm text-zinc-400">
                {dateGames.length} {dateGames.length === 1 ? "game" : "games"}
              </span>
            </div>
            <div className="bg-zinc-900 rounded-b-xl border border-zinc-800 border-t-0 divide-y divide-zinc-800">
              {dateGames.map((game, idx) => {
                const home = getTeam(game.homeTeam);
                const away = getTeam(game.awayTeam);
                const homeWon = game.homeScore > game.awayScore;
                const scoreDiff = Math.abs(game.homeScore - game.awayScore);
                return (
                  <Link
                    key={game.id}
                    to={`/game/${game.id}`}
                    className="block hover:bg-zinc-800 transition-colors"
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <span className="bg-zinc-800 px-2 py-1 rounded text-xs">
                            {game.level}
                          </span>
                          {game.stadium && (
                            <>
                              <MapPin className="w-3 h-3" />
                              <span className="text-xs">{game.stadium}</span>
                            </>
                          )}
                        </div>
                        {game.attendance && (
                          <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <Users className="w-4 h-4" />
                            <span>{game.attendance.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        {/* Away Team */}
                        <div
                          className={`flex items-center gap-4 ${
                            !homeWon ? "" : "opacity-60"
                          }`}
                        >
                          <img
                            src={away?.image}
                            alt={away?.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-lg flex items-center gap-2">
                              {away?.name}
                              {!homeWon && (
                                <Trophy className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <div className="text-sm text-zinc-400">
                              {away?.record.wins}-{away?.record.losses}
                            </div>
                          </div>
                          <div
                            className={`text-4xl font-bold ${
                              !homeWon ? "text-green-400" : ""
                            }`}
                          >
                            {game.awayScore}
                          </div>
                        </div>

                        {/* Home Team */}
                        <div
                          className={`flex items-center gap-4 ${
                            homeWon ? "" : "opacity-60"
                          }`}
                        >
                          <img
                            src={home?.image}
                            alt={home?.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-lg flex items-center gap-2">
                              {home?.name}
                              {homeWon && (
                                <Trophy className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <div className="text-sm text-zinc-400">
                              {home?.record.wins}-{home?.record.losses}
                            </div>
                          </div>
                          <div
                            className={`text-4xl font-bold ${
                              homeWon ? "text-green-400" : ""
                            }`}
                          >
                            {game.homeScore}
                          </div>
                        </div>
                      </div>

                      {/* Game Highlights */}
                      {game.highlights && game.highlights.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-zinc-800">
                          <div className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Key Moments
                          </div>
                          <div className="space-y-1">
                            {game.highlights.map((highlight, idx) => (
                              <div
                                key={idx}
                                className="text-sm text-zinc-300 pl-6"
                              >
                                • {highlight}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Score Difference Badge */}
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-xs text-zinc-500">
                          Final Score Margin: {scoreDiff}
                          {scoreDiff <= 7 && " • Close Game"}
                          {scoreDiff > 21 && " • Blowout"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        ))}
      </section>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid md:grid-cols-3 gap-4"
      >
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div className="text-sm text-zinc-400 mb-2">Total Games Played</div>
          <div className="text-3xl font-bold">{finalGames.length}</div>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div className="text-sm text-zinc-400 mb-2">Average Score</div>
          <div className="text-3xl font-bold">
            {(
              finalGames.reduce((sum, g) => sum + g.homeScore + g.awayScore, 0) /
              finalGames.length /
              2
            ).toFixed(1)}
          </div>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div className="text-sm text-zinc-400 mb-2">Total Attendance</div>
          <div className="text-3xl font-bold">
            {finalGames
              .reduce((sum, g) => sum + (g.attendance || 0), 0)
              .toLocaleString()}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
