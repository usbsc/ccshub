import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Home } from "./components/Home";
import { Rankings } from "./components/Rankings";
import { TeamDetail } from "./components/TeamDetail";
import { Schedule } from "./components/Schedule";
import { Scores } from "./components/Scores";
import { Players } from "./components/Players";
import { GameDetail } from "./components/GameDetail";
import { NotFound } from "./components/NotFound";
import { Teams } from "./components/Teams";
import { Broadcasts } from "./components/Broadcasts";
import { Photos } from "./components/Photos";
import { PlaysOfTheWeekPage } from "./components/PlaysOfTheWeekPage";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      Component: Root,
      children: [
        { index: true, Component: Home },
        { path: "schedule", Component: Schedule },
        { path: "teams", Component: Teams },
        { path: "players", Component: Players },
        { path: "rankings", Component: Rankings },
        { path: "broadcasts", Component: Broadcasts },
        { path: "photos", Component: Photos },
        { path: "plays", Component: PlaysOfTheWeekPage },
        { path: "scores", Component: Scores },
        { path: "team/:teamId", Component: TeamDetail },
        { path: "game/:gameId", Component: GameDetail },
        { path: "*", Component: NotFound },
      ],
    },
  ],
  {
    basename: "/ccshub/",
  }
);
