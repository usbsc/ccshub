import { Link } from "react-router";
import { Trophy, TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import { teams } from "../data/teams";
import { motion } from "motion/react";
import { useState } from "react";

export function Rankings() {
  const [selectedDivision, setSelectedDivision] = useState<string>("all");

  const divisions = ["all", "Division I", "Division II", "Division III"];

  const filteredTeams =
    selectedDivision === "all"
      ? teams
      : teams.filter((t) => t.division === selectedDivision);

  const sortedTeams = [...filteredTeams].sort((a, b) => a.ranking - b.ranking);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
      >
        <div className="relative h-48 bg-gradient-to-br from-blue-900 to-blue-700 p-8 flex flex-col justify-end">
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
              CCS Football Rankings
            </h1>
            <p className="text-blue-100">
              Updated live based on MaxPreps, Hudl, and CalPreps data
            </p>
          </div>
        </div>
      </motion.div>

      {/* Division Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3 overflow-x-auto pb-2"
      >
        {divisions.map((division) => (
          <button
            key={division}
            onClick={() => setSelectedDivision(division)}
            className={`px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedDivision === division
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            {division === "all" ? "All Divisions" : division}
          </button>
        ))}
      </motion.div>

      {/* Rankings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800"
      >
        {/* Table Header */}
        <div className="bg-zinc-800 px-6 py-4 grid grid-cols-12 gap-4 font-semibold text-sm text-zinc-400">
          <div className="col-span-1">RANK</div>
          <div className="col-span-5">TEAM</div>
          <div className="col-span-2">RECORD</div>
          <div className="col-span-2">DIVISION</div>
          <div className="col-span-2">TREND</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-zinc-800">
          {sortedTeams.map((team, idx) => {
            const trend = idx % 3 === 0 ? "up" : idx % 3 === 1 ? "down" : "same";
            return (
              <Link
                key={team.id}
                to={`/team/${team.id}`}
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-zinc-800 transition-colors items-center"
              >
                {/* Rank */}
                <div className="col-span-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      team.ranking <= 3
                        ? "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white"
                        : team.ranking <= 8
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-700 text-zinc-300"
                    }`}
                  >
                    {team.ranking}
                  </div>
                </div>

                {/* Team */}
                <div className="col-span-5 flex items-center gap-4">
                  <img
                    src={team.image}
                    alt={team.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <div className="font-bold text-lg">{team.name}</div>
                    <div className="text-sm text-zinc-400">
                      {team.mascot} • {team.league}
                    </div>
                  </div>
                </div>

                {/* Record */}
                <div className="col-span-2">
                  <div className="font-bold text-lg">
                    {team.record.wins}-{team.record.losses}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {(
                      (team.record.wins /
                        (team.record.wins + team.record.losses)) *
                      100
                    ).toFixed(0)}
                    % Win Rate
                  </div>
                </div>

                {/* Division */}
                <div className="col-span-2">
                  <span className="bg-zinc-800 px-3 py-1 rounded-full text-sm font-medium">
                    {team.division}
                  </span>
                </div>

                {/* Trend */}
                <div className="col-span-2">
                  {trend === "up" && (
                    <div className="flex items-center gap-2 text-green-400">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-sm font-medium">Rising</span>
                    </div>
                  )}
                  {trend === "down" && (
                    <div className="flex items-center gap-2 text-red-400">
                      <TrendingDown className="w-5 h-5" />
                      <span className="text-sm font-medium">Falling</span>
                    </div>
                  )}
                  {trend === "same" && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Minus className="w-5 h-5" />
                      <span className="text-sm font-medium">Steady</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Stats Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Teams",
            value: sortedTeams.length,
            color: "blue",
          },
          {
            label: "Division I",
            value: teams.filter((t) => t.division === "Division I").length,
            color: "purple",
          },
          {
            label: "Division II",
            value: teams.filter((t) => t.division === "Division II").length,
            color: "green",
          },
          {
            label: "Division III",
            value: teams.filter((t) => t.division === "Division III").length,
            color: "yellow",
          },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + idx * 0.05 }}
            className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
          >
            <div className="text-sm text-zinc-400 mb-2">{stat.label}</div>
            <div className="text-3xl font-bold">{stat.value}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}