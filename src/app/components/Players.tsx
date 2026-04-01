import { Link } from "react-router";
import { Award, TrendingUp, User, Trophy } from "lucide-react";
import { players } from "../data/players";
import { teams } from "../data/teams";
import { motion } from "motion/react";
import { useState } from "react";

export function Players() {
  const [selectedPosition, setSelectedPosition] = useState<string>("all");

  const positions = [
    "all",
    "QB",
    "RB",
    "WR",
    "TE",
    "OL",
    "DL",
    "LB",
    "CB",
    "S",
  ];

  const filteredPlayers =
    selectedPosition === "all"
      ? players
      : players.filter((p) => p.position === selectedPosition);

  const getTeam = (id: string) => teams.find((t) => t.id === id);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
      >
        <div className="relative h-48 bg-gradient-to-br from-orange-900 to-orange-700 p-8 flex flex-col justify-end">
          <div className="absolute inset-0 opacity-20">
            <img
              src="https://images.unsplash.com/photo-1568540825978-73021c06dad6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbWVyaWNhbiUyMGZvb3RiYWxsJTIwcGxheWVyJTIwYWN0aW9ufGVufDF8fHx8MTc3Mzk0MzYzMHww&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Player"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <User className="w-10 h-10" />
              Player Profiles
            </h1>
            <p className="text-orange-100">Top CCS football players and statistics</p>
          </div>
        </div>
      </motion.div>

      {/* Position Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3 overflow-x-auto pb-2"
      >
        {positions.map((position) => (
          <button
            key={position}
            onClick={() => setSelectedPosition(position)}
            className={`px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedPosition === position
                ? "bg-orange-600 text-white shadow-lg shadow-orange-500/30"
                : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            {position === "all" ? "All Positions" : position}
          </button>
        ))}
      </motion.div>

      {/* Featured Players */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredPlayers.map((player, idx) => {
          const team = getTeam(player.team);
          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.05 }}
              className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-orange-500 transition-all hover:shadow-2xl hover:shadow-orange-500/10"
            >
              {/* Player Image */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={player.image}
                  alt={player.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold">#{player.number}</span>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-bold mb-1">{player.name}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="bg-orange-600 px-2 py-1 rounded font-medium">
                      {player.position}
                      {player.subPosition && ` - ${player.subPosition}`}
                    </span>
                    <span className="text-zinc-300">Grade {player.grade}</span>
                  </div>
                </div>
              </div>

              {/* Player Info */}
              <div className="p-5">
                {/* Team */}
                <Link
                  to={`/team/${team?.id}`}
                  className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={team?.image}
                    alt={team?.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div>
                    <div className="font-semibold text-sm">{team?.name}</div>
                    <div className="text-xs text-zinc-400">{team?.mascot}</div>
                  </div>
                </Link>

                {/* Physical Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-zinc-800 rounded-lg p-3">
                    <div className="text-xs text-zinc-400 mb-1">Height</div>
                    <div className="font-bold">{player.height}</div>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-3">
                    <div className="text-xs text-zinc-400 mb-1">Weight</div>
                    <div className="font-bold">{player.weight} lbs</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-zinc-800 rounded-lg p-4 mb-4">
                  <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-400" />
                    Season Stats
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(player.stats)
                      .filter(([key]) => key !== "games")
                      .slice(0, 4)
                      .map(([key, value]) => (
                        <div key={key}>
                          <div className="text-xs text-zinc-400 capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </div>
                          <div className="font-bold text-orange-400">{value}</div>
                        </div>
                      ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-zinc-700 text-xs text-zinc-400">
                    {player.stats.games} games played
                  </div>
                </div>

                {/* Highlights */}
                {player.highlights && player.highlights.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      Highlights
                    </div>
                    <ul className="space-y-1">
                      {player.highlights.map((highlight, idx) => (
                        <li key={idx} className="text-xs text-zinc-400">
                          • {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Player Stats Leaders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800"
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Statistical Leaders
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Passing Yards */}
          <div>
            <h3 className="font-semibold mb-3 text-blue-400">Passing Yards</h3>
            <div className="space-y-2">
              {players
                .filter((p) => p.position === "QB")
                .sort((a, b) => (b.stats.yards as number) - (a.stats.yards as number))
                .slice(0, 3)
                .map((player, idx) => {
                  const team = getTeam(player.team);
                  return (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 bg-zinc-800 rounded-lg p-3"
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{player.name}</div>
                        <div className="text-xs text-zinc-400">{team?.name}</div>
                      </div>
                      <div className="font-bold text-blue-400">
                        {player.stats.yards}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Rushing Yards */}
          <div>
            <h3 className="font-semibold mb-3 text-green-400">Rushing Yards</h3>
            <div className="space-y-2">
              {players
                .filter((p) => p.position === "RB")
                .sort((a, b) => (b.stats.yards as number) - (a.stats.yards as number))
                .slice(0, 3)
                .map((player, idx) => {
                  const team = getTeam(player.team);
                  return (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 bg-zinc-800 rounded-lg p-3"
                    >
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{player.name}</div>
                        <div className="text-xs text-zinc-400">{team?.name}</div>
                      </div>
                      <div className="font-bold text-green-400">
                        {player.stats.yards}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Receiving Yards */}
          <div>
            <h3 className="font-semibold mb-3 text-purple-400">Receiving Yards</h3>
            <div className="space-y-2">
              {players
                .filter((p) => p.position === "WR")
                .sort((a, b) => (b.stats.yards as number) - (a.stats.yards as number))
                .slice(0, 3)
                .map((player, idx) => {
                  const team = getTeam(player.team);
                  return (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 bg-zinc-800 rounded-lg p-3"
                    >
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{player.name}</div>
                        <div className="text-xs text-zinc-400">{team?.name}</div>
                      </div>
                      <div className="font-bold text-purple-400">
                        {player.stats.yards}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}