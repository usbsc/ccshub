/**
 * NFHS (National Federation of State High School Associations) API Service
 * Handles authentication and video broadcast data fetching
 *
 * Security: Credentials stored in memory only, never persisted or logged
 */

export interface NFHSCredentials {
  email: string;
  password: string;
}

export interface NFHSVideo {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  date: string;
  teams?: string[];
  sport: string;
}

export interface Play {
  id: string;
  videoId: string;
  team: string;
  teamId?: string;
  player: string;
  playerNumber?: number;
  description: string;
  playType: "touchdown" | "sack" | "interception" | "fumble" | "other";
  timestamp: number; // in video, seconds from start
  gameDate: string;
  gameId?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  week: number;
}

class NFHSService {
  private credentials: NFHSCredentials | null = null;
  private authToken: string | null = null;
  private lastFetchTime: number = 0;
  private cachedPlays: Play[] = [];
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly NFHS_BASE_URL = "https://www.nfhsnetwork.com/api";

  /**
   * Authenticate with NFHS
   */
  async authenticate(email: string, password: string): Promise<boolean> {
    try {
      // Store credentials in memory (never logged or persisted)
      this.credentials = { email, password };

      // Attempt authentication with NFHS API — send email field
      const response = await fetch(`${this.NFHS_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `NFHS authentication failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      this.authToken = data.token || data.access_token;

      console.warn(
        "✓ Successfully authenticated with NFHS (credentials in memory only)"
      );
      return true;
    } catch (error) {
      this.credentials = null;
      this.authToken = null;
      throw error;
    }
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return !!this.authToken && !!this.credentials;
  }

  /**
   * Fetch video broadcasts (with caching)
   */
  async fetchVideosBroadcasts(): Promise<NFHSVideo[]> {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated with NFHS");
    }

    try {
      const response = await fetch(`${this.NFHS_BASE_URL}/broadcasts/videos`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch NFHS videos: ${response.status}`);
      }

      const data = await response.json();
      return data.videos || [];
    } catch (error) {
      console.error("Error fetching NFHS videos:", error);
      return [];
    }
  }

  /**
   * Parse plays from video metadata
   * This extracts highlight moments from video descriptions and metadata
   */
  async parseHighlightPlays(videos: NFHSVideo[]): Promise<Play[]> {
    const plays: Play[] = [];

    for (const video of videos) {
      // Parse video title and description for play information
      const playMatches = this.extractPlayData(
        video.title,
        video.description
      );

      for (const match of playMatches) {
        plays.push({
          id: `play-${video.id}-${match.timestamp}`,
          videoId: video.id,
          team: match.team,
          player: match.player,
          playerNumber: match.playerNumber,
          description: match.description,
          playType: match.playType,
          timestamp: match.timestamp,
          gameDate: video.date,
          videoUrl: video.url,
          thumbnailUrl: video.thumbnailUrl,
          week: this.getCurrentWeek(),
        });
      }
    }

    return plays;
  }

  /**
   * Extract play data from video text using pattern matching
   */
  private extractPlayData(
    title: string,
    description: string
  ): Array<{
    team: string;
    player: string;
    playerNumber?: number;
    description: string;
    playType: Play["playType"];
    timestamp: number;
  }> {
    const plays: Array<{
      team: string;
      player: string;
      playerNumber?: number;
      description: string;
      playType: Play["playType"];
      timestamp: number;
    }> = [];
    const fullText = `${title} ${description}`;

    // Pattern: "TEAM_NAME - Player Name #99 - PLAY_TYPE at TIME"
    const playPattern =
      /([A-Za-z\s]+?)\s*[-–]\s*([A-Za-z\s]+?)\s*#?(\d+)?\s*[-–]\s*(touchdown|sack|interception|fumble|pass|run|catch)\s*(?:at|@)?\s*(\d+:?\d*)?/gi;

    let match;
    while ((match = playPattern.exec(fullText)) !== null) {
      const team = match[1]?.trim() || '';
      const player = match[2]?.trim() || '';
      const number = match[3] ? parseInt(match[3]) : undefined;
      const playType = this.normalizePlayType(match[4] || '');
      const timestamp = this.parseTimestamp(match[5]);

      plays.push({
        team,
        player,
        playerNumber: number,
        description: `${player} ${playType === "other" ? "made a play" : playType}${number ? ` #${number}` : ""}`,
        playType,
        timestamp,
      });
    }

    return plays;
  }

  /**
   * Normalize play type strings
   */
  private normalizePlayType(
    type: string
  ): "touchdown" | "sack" | "interception" | "fumble" | "other" {
    const normalized = type.toLowerCase();
    if (normalized.includes("touchdown") || normalized.includes("td"))
      return "touchdown";
    if (normalized.includes("sack")) return "sack";
    if (normalized.includes("interception") || normalized.includes("int"))
      return "interception";
    if (normalized.includes("fumble")) return "fumble";
    return "other";
  }

  /**
   * Parse timestamp string (MM:SS or seconds)
   */
  private parseTimestamp(timeStr?: string): number {
    if (!timeStr) return 0;
    const [minutes, seconds] = timeStr.split(":").map((x) => parseInt(x));
    return (minutes || 0) * 60 + (seconds || 0);
  }

  /**
   * Get current week number
   */
  private getCurrentWeek(): number {
    const now = new Date();
    const year = now.getFullYear();
    const start = new Date(year, 8, 1); // September 1st
    const diff = now.getTime() - start.getTime();
    return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  }

  /**
   * Fetch plays of the week (main method)
   */
  async fetchPlaysOfTheWeek(): Promise<Play[]> {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated with NFHS");
    }

    // Check cache
    const now = Date.now();
    if (
      this.cachedPlays.length > 0 &&
      now - this.lastFetchTime < this.CACHE_DURATION
    ) {
      console.warn("Returning cached plays (still fresh)");
      return this.cachedPlays;
    }

    try {
      console.warn("Fetching new plays from NFHS...");
      const videos = await this.fetchVideosBroadcasts();
      const plays = await this.parseHighlightPlays(videos);

      // Sort by date and take top 10
      const sortedPlays = plays
        .sort((a, b) => new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime())
        .slice(0, 10);

      this.cachedPlays = sortedPlays;
      this.lastFetchTime = now;

      console.warn(`✓ Fetched ${sortedPlays.length} plays of the week`);
      return sortedPlays;
    } catch (error) {
      console.error("Error fetching plays:", error);
      return this.cachedPlays; // Return cached if available
    }
  }

  /**
   * Logout and clear credentials
   */
  logout(): void {
    this.credentials = null;
    this.authToken = null;
    this.cachedPlays = [];
    this.lastFetchTime = 0;
    console.warn("Logged out from NFHS");
  }
}

// Export singleton instance
export const nfhsService = new NFHSService();
