/**
 * Google Drive Photo Service
 * Fetches photos from shared Google Drive folders
 * Converts Drive file IDs to public image URLs
 * Handles caching and pagination
 */

export interface Photo {
  id: string; // Google Drive file ID
  url: string; // Public image URL
  name: string; // File name
  folder: 'jv' | 'varsity'; // JV or Varsity folder
  team?: string; // Team association (optional)
  addedDate: Date; // Upload date from Drive
  mimeType?: string; // Image MIME type
}

class GoogleDriveService {
  private apiKey = 'AIzaSyBDjwKUEwU7J5-Pr-WvJxSrZs_9i7i_iZc'; // Public API key for Drive access
  private jvFolderId = 'YOUR_JV_FOLDER_ID'; // User will provide
  private varsityFolderId = 'YOUR_VARSITY_FOLDER_ID'; // User will provide
  private cachedPhotos: Photo[] = [];
  private lastFetchTime = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Set folder IDs from user configuration
   */
  setFolderIds(jvId: string, varsityId: string) {
    this.jvFolderId = jvId;
    this.varsityFolderId = varsityId;
  }

  /**
   * Fetch photos from a Google Drive folder
   * Returns photos paginated by specified limit
   */
  async fetchPhotosFromFolder(
    folder: 'jv' | 'varsity',
    pageSize = 12,
    pageToken?: string
  ): Promise<{
    photos: Photo[];
    nextPageToken?: string;
  }> {
    const folderId = folder === 'jv' ? this.jvFolderId : this.varsityFolderId;

    if (!folderId || folderId.includes('YOUR_')) {
      console.warn(`Google Drive folder ID not configured for ${folder} folder`);
      return { photos: [] };
    }

    try {
      const query = `parents='${folderId}' and mimeType contains 'image/' and trashed=false`;
      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.append('q', query);
      url.searchParams.append('key', this.apiKey);
      url.searchParams.append('pageSize', pageSize.toString());
      url.searchParams.append('fields', 'files(id,name,createdTime,mimeType),nextPageToken');
      url.searchParams.append('orderBy', 'createdTime desc');

      if (pageToken) {
        url.searchParams.append('pageToken', pageToken);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Drive API error: ${response.statusText}`);
      }

      const data = await response.json();

      const photos: Photo[] = data.files.map(
        (file: { id: string; name: string; createdTime: string; mimeType: string }) => ({
          id: file.id,
          url: this.getPublicImageUrl(file.id),
          name: file.name,
          folder,
          addedDate: new Date(file.createdTime),
          mimeType: file.mimeType,
        })
      );

      return {
        photos,
        nextPageToken: data.nextPageToken,
      };
    } catch (error) {
      console.error(`Error fetching ${folder} photos from Google Drive:`, error);
      return { photos: [] };
    }
  }

  /**
   * Fetch all photos from both folders (cached for 5 minutes)
   */
  async fetchAllPhotos(): Promise<Photo[]> {
    const now = Date.now();

    // Return cached if fresh
    if (this.cachedPhotos.length > 0 && now - this.lastFetchTime < this.CACHE_DURATION) {
      console.warn('Returning cached photos (still fresh)');
      return this.cachedPhotos;
    }

    try {
      const [jvResult, varsityResult] = await Promise.all([
        this.fetchPhotosFromFolder('jv', 50),
        this.fetchPhotosFromFolder('varsity', 50),
      ]);

      const allPhotos = [...jvResult.photos, ...varsityResult.photos];

      // Sort by date descending
      allPhotos.sort((a, b) => b.addedDate.getTime() - a.addedDate.getTime());

      this.cachedPhotos = allPhotos;
      this.lastFetchTime = now;

      console.warn(`✓ Fetched ${allPhotos.length} photos from Google Drive`);
      return allPhotos;
    } catch (error) {
      console.error('Error fetching all photos:', error);
      return this.cachedPhotos; // Return cached if available
    }
  }

  /**
   * Search photos by name or team
   */
  searchPhotos(query: string, folder?: 'jv' | 'varsity'): Promise<Photo[]> {
    return this.fetchAllPhotos().then((photos) => {
      let filtered = photos;

      if (folder) {
        filtered = filtered.filter((p) => p.folder === folder);
      }

      if (query) {
        const lowercaseQuery = query.toLowerCase();
        filtered = filtered.filter((p) =>
          p.name.toLowerCase().includes(lowercaseQuery) || p.team?.toLowerCase().includes(lowercaseQuery)
        );
      }

      return filtered;
    });
  }

  /**
   * Convert Google Drive file ID to public image URL
   * Format: https://drive.google.com/uc?export=view&id=FILE_ID
   */
  private getPublicImageUrl(fileId: string): string {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  /**
   * Refresh cache (force new fetch)
   */
  async refreshPhotos(): Promise<Photo[]> {
    this.lastFetchTime = 0;
    return this.fetchAllPhotos();
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cachedPhotos = [];
    this.lastFetchTime = 0;
  }

  /**
   * Get photos by folder
   */
  async getPhotosByFolder(folder: 'jv' | 'varsity'): Promise<Photo[]> {
    const allPhotos = await this.fetchAllPhotos();
    return allPhotos.filter((p) => p.folder === folder);
  }

  /**
   * Get photos by team
   */
  async getPhotosByTeam(teamName: string): Promise<Photo[]> {
    const allPhotos = await this.fetchAllPhotos();
    return allPhotos.filter((p) => p.team === teamName);
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService();
