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
    { key: "home", label: "Home" },
    { key: "away", label: "Away" },
    { key: "alternate", label: "Alternate" },
  ] as const;

  // Uniform SVG component that renders a realistic football uniform
  const UniformRenderer = ({
    jerseyColor,
    pantsColor,
    helmetColor,
    accentColor,
  }: {
    jerseyColor: string;
    pantsColor: string;
    helmetColor: string;
    accentColor: string;
  }) => (
    <svg viewBox="0 0 120 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Head/Helmet */}
      <circle cx="60" cy="35" r="18" fill={helmetColor} stroke="#1a1a1a" strokeWidth="0.5" />

      {/* Helmet stripe */}
      <rect x="58" y="18" width="4" height="34" fill={accentColor} />

      {/* Facemask */}
      <path
        d="M 45 35 Q 45 50 60 52 Q 75 50 75 35"
        fill="none"
        stroke="#444"
        strokeWidth="1.5"
      />

      {/* Jersey - main body */}
      <path
        d="M 35 55 L 40 55 L 42 75 L 78 75 L 80 55 L 85 55 L 85 110 Q 85 125 60 125 Q 35 125 35 110 Z"
        fill={jerseyColor}
        stroke="#1a1a1a"
        strokeWidth="0.5"
      />

      {/* Jersey collar/neckline */}
      <ellipse cx="60" cy="55" rx="12" ry="5" fill={helmetColor} opacity="0.3" />

      {/* Jersey number - large and bold */}
      <g>
        <text
          x="60"
          y="95"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="32"
          fontWeight="900"
          fill={pantsColor}
          stroke="#1a1a1a"
          strokeWidth="0.5"
          fontFamily="Arial, sans-serif"
        >
          23
        </text>
      </g>

      {/* Sleeve stripe left */}
      <rect x="32" y="60" width="3" height="35" fill={accentColor} opacity="0.8" />

      {/* Sleeve stripe right */}
      <rect x="85" y="60" width="3" height="35" fill={accentColor} opacity="0.8" />

      {/* Arm bands */}
      <rect x="35" y="58" width="8" height="2" fill={accentColor} opacity="0.6" />
      <rect x="77" y="58" width="8" height="2" fill={accentColor} opacity="0.6" />

      {/* Pants - main */}
      <path
        d="M 42 110 L 58 110 L 56 170 L 44 170 Z"
        fill={pantsColor}
        stroke="#1a1a1a"
        strokeWidth="0.5"
      />
      <path
        d="M 62 110 L 78 110 L 80 170 L 64 170 Z"
        fill={pantsColor}
        stroke="#1a1a1a"
        strokeWidth="0.5"
      />

      {/* Pants stripes - center */}
      <line x1="60" y1="110" x2="60" y2="170" stroke={accentColor} strokeWidth="1.5" />

      {/* Pants side stripes */}
      <line x1="45" y1="110" x2="43" y2="170" stroke={accentColor} strokeWidth="1" opacity="0.6" />
      <line x1="75" y1="110" x2="77" y2="170" stroke={accentColor} strokeWidth="1" opacity="0.6" />

      {/* Shoes */}
      <ellipse cx="48" cy="172" rx="5" ry="3" fill="#222" />
      <ellipse cx="72" cy="172" rx="5" ry="3" fill="#222" />

      {/* Body outline for definition */}
      <line x1="60" y1="55" x2="60" y2="125" stroke="#1a1a1a" strokeWidth="0.3" opacity="0.3" />
    </svg>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800"
    >
      <div className="flex items-center gap-3 mb-8">
        <Shirt className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold">Uniforms</h2>
      </div>

      {/* Wikipedia-style uniform table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {uniformTypes.map(({ label }) => (
                <th
                  key={label}
                  className="border border-zinc-700 bg-zinc-800 p-4 text-center font-bold text-white"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Uniform graphics row */}
            <tr>
              {uniformTypes.map(({ key }) => {
                const uniform = team.uniforms?.[key];
                if (!uniform) return <td key={key} className="border border-zinc-700 bg-zinc-900" />;

                return (
                  <td key={key} className="border border-zinc-700 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6">
                    <div className="h-48 w-24 mx-auto">
                      <UniformRenderer
                        jerseyColor={uniform.primary}
                        pantsColor={uniform.secondary}
                        helmetColor={uniform.primary}
                        accentColor={uniform.secondary}
                      />
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Colors row */}
            <tr>
              {uniformTypes.map(({ key }) => {
                const uniform = team.uniforms?.[key];
                if (!uniform) return <td key={key} className="border border-zinc-700 bg-zinc-900" />;

                return (
                  <td key={key} className="border border-zinc-700 bg-zinc-900 p-4">
                    <div className="space-y-3 text-sm">
                      {/* Jersey Color */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded border border-zinc-600 shadow-md flex-shrink-0"
                          style={{ backgroundColor: uniform.primary }}
                          title="Jersey color"
                        />
                        <div>
                          <div className="text-xs text-zinc-400 uppercase tracking-wide">
                            Jersey
                          </div>
                          <div className="font-mono text-white font-bold">
                            {uniform.primary}
                          </div>
                        </div>
                      </div>

                      {/* Pants/Accent Color */}
                      {uniform.secondary && uniform.secondary !== uniform.primary && (
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded border border-zinc-600 shadow-md flex-shrink-0"
                            style={{ backgroundColor: uniform.secondary }}
                            title="Pants/accent color"
                          />
                          <div>
                            <div className="text-xs text-zinc-400 uppercase tracking-wide">
                              Pants
                            </div>
                            <div className="font-mono text-white font-bold">
                              {uniform.secondary}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {uniform.description && (
                        <p className="text-xs text-zinc-400 italic pt-2 border-t border-zinc-700">
                          {uniform.description}
                        </p>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-zinc-500 text-center">
        <p>Uniform designs shown with helmet, jersey number, and pants. Colors indicate primary and secondary uniform colors.</p>
      </div>
    </motion.div>
  );
}
