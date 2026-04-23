import { Outlet, Link, NavLink } from "react-router";
import { Bell, Award, Calendar, Users, BarChart3, Settings, Sun, Moon, Home, Image } from "lucide-react";
import { useState } from "react";
import { ImageWithFallback } from "./common/ImageWithFallback";
import { homeTeamStorage } from "../services/storage";
import { useTheme } from "../context/ThemeContext";

export function Root() {
  const [homeTeam, setHomeTeam] = useState<string | null>(homeTeamStorage.get());
  const [showSettings, setShowSettings] = useState(false);
  const { theme, setTheme } = useTheme();

  if (homeTeam) {
    homeTeamStorage.set(homeTeam);
  } else {
    homeTeamStorage.remove();
  }

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/schedule", label: "Schedule", icon: Calendar },
    { path: "/teams", label: "Teams", icon: Users },
    { path: "/players", label: "Players", icon: Users },
    { path: "/rankings", label: "Rankings", icon: BarChart3 },
    { path: "/broadcasts", label: "Broadcasts", icon: Award },
    { path: "/plays", label: "Plays", icon: Award },
    { path: "/photos", label: "Photos", icon: Image },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <a
              href="https://x.com/CCSHUBOFFICIAL"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 hover:opacity-80 transition-all active:scale-95 group"
            >
              <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-3 transition-transform overflow-hidden p-0">
                <img
                  src="/ccshub/logos/ccshub-banner.jpg"
                  alt="CCSHUB"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-foreground leading-tight uppercase">
                  CCS HUB
                </h1>
                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                  Central Coast Section
                </p>
              </div>
            </a>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="p-2.5 rounded-xl transition-all border bg-secondary border-border text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2.5 rounded-xl transition-all relative border ${
                  showSettings
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-secondary border-border text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                }`}
              >
                <Settings className="w-5 h-5" />
                {homeTeam && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                )}
              </button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="mt-4 hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Mobile Navigation Bar (Scrollable) */}
        <div className="md:hidden border-t border-border px-2 py-2 flex gap-1 overflow-x-auto no-scrollbar">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
                  isActive ? "bg-primary text-primary-foreground shadow-lg" : "bg-secondary text-muted-foreground"
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-card border-t border-border animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
              {/* Home Team Section */}
              <div>
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2 text-foreground">
                  <Bell className="w-5 h-5 text-primary" />
                  Home Team
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Select your home team to prioritize their games and news.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={homeTeam || ""}
                    onChange={(e) => setHomeTeam(e.target.value || null)}
                    className="flex-1 bg-secondary text-foreground border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer appearance-none"
                  >
                    <option value="">No team selected</option>
                    <optgroup label="WCAL">
                      <option value="riordan">Archbishop Riordan</option>
                      <option value="st-francis">St. Francis High School</option>
                      <option value="valley-christian">Valley Christian</option>
                      <option value="mitty">Archbishop Mitty</option>
                      <option value="serra">Serra High School</option>
                      <option value="sacred-heart">Sacred Heart Cathedral</option>
                    </optgroup>
                    <optgroup label="Other Leagues">
                      <option value="los-gatos">Los Gatos High School</option>
                      <option value="wilcox">Adrian C. Wilcox</option>
                    </optgroup>
                  </select>

                  {homeTeam && (
                    <button
                      onClick={() => setHomeTeam(null)}
                      className="px-4 py-2 text-sm text-destructive hover:text-destructive/80 transition-colors"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>

              {/* Theme Section */}
              <div className="border-t border-border pt-6">
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2 text-foreground">
                  <Settings className="w-5 h-5 text-primary" />
                  Theme
                </h3>
                <p className="text-muted-foreground text-sm mb-4">Choose your preferred color theme.</p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {(["light", "dark", "summer", "fall", "spring"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`py-3 px-3 rounded-lg font-semibold text-xs uppercase tracking-wide transition-all border-2 ${
                        theme === t
                          ? "border-foreground bg-primary/10 text-foreground shadow-lg shadow-primary/20"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`w-6 h-6 rounded-full border-2 ${
                            t === "light"
                              ? "bg-white border-black"
                              : t === "dark"
                                ? "bg-black border-white"
                                : t === "summer"
                                  ? "bg-gradient-to-br from-blue-400 to-orange-400"
                                  : t === "fall"
                                    ? "bg-gradient-to-br from-orange-600 to-red-800"
                                    : "bg-gradient-to-br from-green-400 to-pink-400"
                          }`}
                        />
                        {t}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Alert Banner for Home Team */}
      {homeTeam && (
        <div className="bg-primary/10 border-b border-primary/20 py-2">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-center text-[11px] font-bold text-primary tracking-wide flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
              Priority alerts enabled for your home team
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center p-1">
                  <ImageWithFallback
                    src="https://www.cifccs.org/images/logo.png"
                    alt="CIF CCS"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-black text-2xl text-foreground uppercase tracking-tighter">
                  CCSHUB
                </h3>
              </div>
              <p className="text-muted-foreground text-sm max-w-sm leading-relaxed font-medium">
                The premier digital destination for Central Coast Section athletics. Real-time
                scores, in-depth rankings, and elite player spotlights.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">
                Navigation
              </h4>
              <ul className="text-muted-foreground text-sm space-y-3 font-medium">
                <li>
                  <Link to="/rankings" className="hover:text-foreground transition-colors">
                    Rankings
                  </Link>
                </li>
                <li>
                  <Link to="/schedule" className="hover:text-foreground transition-colors">
                    Schedule
                  </Link>
                </li>
                <li>
                  <Link to="/scores" className="hover:text-foreground transition-colors">
                    Scores
                  </Link>
                </li>
                <li>
                  <Link to="/players" className="hover:text-foreground transition-colors">
                    Players
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <div>© 2026 CCSHUB • Central Coast Section</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
