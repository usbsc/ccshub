import { Outlet, Link, useLocation } from "react-router";
import { Bell, Trophy, Calendar, Users, BarChart3, Settings } from "lucide-react";
import { useState, useEffect } from "react";

export function Root() {
  const location = useLocation();
  const [homeTeam, setHomeTeam] = useState<string | null>(
    localStorage.getItem("homeTeam")
  );
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Add dark class to html element
    document.documentElement.classList.add('dark');
    
    if (homeTeam) {
      localStorage.setItem("homeTeam", homeTeam);
    }
  }, [homeTeam]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-700 border-b border-blue-600 sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-blue-900" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">CIF CCS Football</h1>
                <p className="text-xs text-blue-200">Central Coast Section</p>
              </div>
            </Link>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-blue-800 rounded-lg transition-colors relative"
            >
              <Settings className="w-6 h-6" />
              {homeTeam && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {[
              { path: "/", label: "Live Games", icon: Trophy },
              { path: "/rankings", label: "Rankings", icon: BarChart3 },
              { path: "/schedule", label: "Schedule", icon: Calendar },
              { path: "/scores", label: "Scores", icon: Trophy },
              { path: "/players", label: "Players", icon: Users },
            ].map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  isActive(path)
                    ? "bg-white text-blue-900 shadow-lg"
                    : "bg-blue-800/50 hover:bg-blue-800 text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-blue-800 border-t border-blue-600">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Select Your Home Team for Priority Alerts
              </h3>
              <select
                value={homeTeam || ""}
                onChange={(e) => setHomeTeam(e.target.value)}
                className="w-full max-w-md bg-blue-900 text-white border border-blue-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">No team selected</option>
                <option value="bellarmine">Bellarmine College Preparatory</option>
                <option value="st-francis">St. Francis High School</option>
                <option value="valley-christian">Valley Christian High School</option>
                <option value="mitty">Archbishop Mitty High School</option>
                <option value="serra">Serra High School</option>
                <option value="sacred-heart">Sacred Heart Cathedral Prep</option>
                <option value="los-gatos">Los Gatos High School</option>
                <option value="wilcox">Adrian C. Wilcox High School</option>
              </select>
              {homeTeam && (
                <p className="text-sm text-blue-200 mt-2">
                  ✓ You'll receive priority notifications for this team's games
                </p>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Alert Banner for Home Team */}
      {homeTeam && (
        <div className="bg-gradient-to-r from-green-600 to-green-500 py-2">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-center text-sm font-medium flex items-center justify-center gap-2">
              <Bell className="w-4 h-4" />
              Priority alerts enabled for your home team
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 border-t border-zinc-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-3">CIF Central Coast Section</h3>
              <p className="text-sm text-zinc-400">
                Your complete source for CCS high school football rankings, scores, and live games.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-3">Data Sources</h3>
              <ul className="text-sm text-zinc-400 space-y-1">
                <li>MaxPreps</li>
                <li>Hudl</li>
                <li>CalPreps</li>
                <li>CIF Official Stats</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-3">Quick Links</h3>
              <ul className="text-sm text-zinc-400 space-y-1">
                <li><Link to="/rankings" className="hover:text-white">Rankings</Link></li>
                <li><Link to="/schedule" className="hover:text-white">Schedule</Link></li>
                <li><Link to="/scores" className="hover:text-white">Scores</Link></li>
                <li><Link to="/players" className="hover:text-white">Players</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-zinc-800 text-center text-sm text-zinc-500">
            © 2026 CIF Central Coast Section Football
          </div>
        </div>
      </footer>
    </div>
  );
}