export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  subPosition?: string;
  number: number;
  grade: number;
  height: string;
  weight: number;
  stats: {
    games: number;
    [key: string]: number | string;
  };
  image: string;
  highlights?: string[];
}

// Using a stable, high-quality generic football player image for all profiles
const GENERIC_PLAYER = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&h=400&q=80";

export const players: Player[] = [
  {
    id: "player-riordan-1",
    name: "Michael Mitchell Jr.",
    team: "riordan",
    position: "QB",
    subPosition: "Dual-Threat",
    number: 10,
    grade: 11,
    height: "5'11\"",
    weight: 180,
    stats: {
      games: 0,
      yards: 0,
      touchdowns: 0,
      interceptions: 0,
    },
    image: GENERIC_PLAYER,
    highlights: ["4-star recruit", "Elite speed and arm strength"],
  },
  {
    id: "player-riordan-2",
    name: "Wesley Winn",
    team: "riordan",
    position: "WR",
    subPosition: "Speedster",
    number: 1,
    grade: 10,
    height: "5'10\"",
    weight: 165,
    stats: {
      games: 0,
      yards: 0,
      touchdowns: 0,
    },
    image: GENERIC_PLAYER,
    highlights: ["Top ranked 2027 prospect", "Game-breaking speed"],
  },
  {
    id: "player-serra-1",
    name: "Jeovanni Henley",
    team: "serra",
    position: "RB",
    subPosition: "Powerback",
    number: 4,
    grade: 11,
    height: "5'11\"",
    weight: 195,
    stats: {
      games: 0,
      yards: 0,
      touchdowns: 0,
    },
    image: GENERIC_PLAYER,
    highlights: ["Dynamic playmaker", "WCAL breakout candidate"],
  },
  {
    id: "player-sf-1",
    name: "Kingston Keanaaina",
    team: "st-francis",
    position: "RB",
    subPosition: "Workhorse",
    number: 22,
    grade: 12,
    height: "5'11\"",
    weight: 205,
    stats: {
      games: 0,
      yards: 0,
      touchdowns: 0,
    },
    image: GENERIC_PLAYER,
    highlights: ["BYU Commit", "Physical downhill runner"],
  },
  {
    id: "player-lg-1",
    name: "Henry Masters",
    team: "los-gatos",
    position: "QB",
    subPosition: "Leader",
    number: 12,
    grade: 12,
    height: "6'2\"",
    weight: 190,
    stats: {
      games: 0,
      yards: 0,
      touchdowns: 0,
    },
    image: GENERIC_PLAYER,
    highlights: ["Proven winner", "Exceptional decision making"],
  },
];
