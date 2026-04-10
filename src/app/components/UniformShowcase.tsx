import React from "react";
import { motion } from "framer-motion";
import { Shirt } from "lucide-react";
import type { Team } from "../data/teams";

interface UniformShowcaseProps {
  team: Team;
}

export function UniformShowcase({ team }: UniformShowcaseProps) {
  if (!team.uniforms) {
    return null;
  }

  const uniformTypes = [
    { key: "home", label: "Home", description: "Primary home game uniform" },
    { key: "away", label: "Away", description: "Away game uniform" },
    { key: "alternate", label: "Alternate", description: "Special occasion uniform" },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800"
    >
      <div className="flex items-center gap-3 mb-6">
        <Shirt className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold">Uniforms</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {uniformTypes.map(({ key, label, description }) => {
          const uniform = team.uniforms?.[key];
          if (!uniform) return null;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-zinc-800 rounded-xl p-4 border border-zinc-700 hover:border-blue-500 transition-colors"
            >
              {/* Jersey Preview */}
              <div className="mb-4 flex items-center justify-center">
                <div className="relative w-20 h-32 flex items-center justify-center">
                  {/* Jersey shape */}
                  <svg
                    viewBox="0 0 40 60"
                    className="w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Main jersey body */}
                    <path
                      d="M 10 10 L 15 10 L 15 20 L 25 20 L 25 10 L 30 10 L 30 40 Q 30 50 20 50 Q 10 50 10 40 Z"
                      fill={uniform.primary}
                      stroke="#000"
                      strokeWidth="0.5"
                    />
                    {/* Secondary accent stripe */}
                    {uniform.secondary !== uniform.primary && (
                      <rect
                        x="18"
                        y="15"
                        width="4"
                        height="35"
                        fill={uniform.secondary}
                        stroke="#000"
                        strokeWidth="0.5"
                      />
                    )}
                  </svg>
                </div>
              </div>

              {/* Color Info */}
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-white">{label}</h3>
                <p className="text-xs text-zinc-400">{description}</p>

                <div className="space-y-2">
                  {/* Primary Color */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded border border-zinc-600 shadow-lg"
                      style={{ backgroundColor: uniform.primary }}
                      title="Primary color"
                    />
                    <div>
                      <div className="text-xs text-zinc-500">Primary</div>
                      <div className="text-sm font-mono text-white">
                        {uniform.primary}
                      </div>
                    </div>
                  </div>

                  {/* Secondary Color */}
                  {uniform.secondary && uniform.secondary !== uniform.primary && (
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded border border-zinc-600 shadow-lg"
                        style={{ backgroundColor: uniform.secondary }}
                        title="Secondary color"
                      />
                      <div>
                        <div className="text-xs text-zinc-500">Secondary</div>
                        <div className="text-sm font-mono text-white">
                          {uniform.secondary}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {uniform.description && (
                  <p className="text-xs text-zinc-400 italic mt-3 pt-3 border-t border-zinc-700">
                    {uniform.description}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
