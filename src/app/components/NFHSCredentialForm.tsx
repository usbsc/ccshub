import { useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff, Lock } from "lucide-react";

interface NFHSCredentialFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export function NFHSCredentialForm({
  onSubmit,
  isLoading = false,
  error,
}: NFHSCredentialFormProps) {
  // Email input state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Hide this form on the public GitHub Pages site to avoid exposing credential UI to end users
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isGithubPages = hostname.includes('github.io');
  if (isGithubPages) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password.trim()) {
      setLocalError("Please enter both email and password");
      return;
    }

    try {
      await onSubmit(email, password);
      // Clear on success
      setEmail("");
      setPassword("");
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Authentication failed"
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-card rounded-2xl p-8 border border-border shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Lock className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">NFHS Access</h2>
            <p className="text-sm text-muted-foreground">
              Enter your NFHS credentials to fetch video broadcasts
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input field. Changed from Username to Email for clarity. */}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Error Messages */}
          {(localError || error) && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {localError || error}
            </div>
          )}

          {/* Security Note */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-xs">
            🔒 Credentials are stored in memory only during this session and
            never logged or persisted.
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !email.trim() || !password.trim()}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-blue-300 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              "Connect to NFHS"
            )}
          </button>
        </form>

        {/* Info */}
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Your credentials are only used to fetch video broadcasts and are not
          shared or stored.
        </p>
      </div>
    </motion.div>
  );
}
