/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, HardDrive } from 'lucide-react';
import { googleDriveService, type Photo } from '../services/googleDrive';
import { PhotoGrid } from './PhotoGrid';
import { PhotoViewer } from './PhotoViewer';

export function GoogleDriveGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<'all' | 'jv' | 'varsity'>('all');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadPhotos = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allPhotos = await googleDriveService.fetchAllPhotos();

      if (allPhotos.length === 0) {
        setError(
          'No photos found. Make sure your Google Drive folders are shared publicly and folder IDs are configured.'
        );
      }

      setPhotos(allPhotos);
    } catch (err) {
      console.error('Error loading photos:', err);
      setError('Failed to load photos. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load photos on mount
  useEffect(() => {
    loadPhotos();
  }, []);

  // Filter photos when search or folder selection changes
  useEffect(() => {
    let filtered = [...photos];

    // Filter by folder
    if (selectedFolder !== 'all') {
      filtered = filtered.filter((p) => p.folder === selectedFolder);
    }

    // Filter by search query
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(lowercaseQuery) ||
          p.team?.toLowerCase().includes(lowercaseQuery)
      );
    }

    setFilteredPhotos(filtered);
  }, [photos, searchQuery, selectedFolder]);

  const handlePhotoClick = (photo: Photo, index: number) => {
    // Find the actual index in filtered photos
    const actualIndex = filteredPhotos.findIndex((p) => p.id === photo.id);
    setSelectedPhotoIndex(actualIndex >= 0 ? actualIndex : index);
    setViewerOpen(true);
  };

  const handleNext = () => {
    setSelectedPhotoIndex((prev) => (prev + 1) % filteredPhotos.length);
  };

  const handlePrev = () => {
    setSelectedPhotoIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white dark:text-foreground">
          Photo <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600">Gallery</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Browse photos from CCS football games, practices, and events. Use the Lightroom-style viewer to explore
          images in detail.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Search Input */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-purple-500 transition-colors" />
          <input
            type="text"
            placeholder="Search photos by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-xl"
            aria-label="Search photos"
          />
        </div>

        {/* Folder Filter */}
        <div className="flex gap-2">
          {(['all', 'jv', 'varsity'] as const).map((folder) => (
            <button
              key={folder}
              onClick={() => setSelectedFolder(folder)}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm transition-all ${
                selectedFolder === folder
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-card border border-border text-foreground hover:border-purple-500'
              }`}
            >
              {folder === 'all' ? 'All Folders' : folder.toUpperCase()}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/20 border border-red-800 rounded-2xl p-4 text-red-400"
        >
          <p className="text-sm">{error}</p>
          <button
            onClick={loadPhotos}
            className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm font-semibold transition-colors"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="w-12 h-12 rounded-full border-4 border-purple-600 border-t-transparent animate-spin mb-4" />
          <p className="text-muted-foreground">Loading photos from Google Drive...</p>
        </motion.div>
      ) : filteredPhotos.length > 0 ? (
        <>
          {/* Photo Count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground"
          >
            Showing {filteredPhotos.length} of {photos.length} photos
          </motion.div>

          {/* Photo Grid */}
          <PhotoGrid
            photos={filteredPhotos}
            onPhotoClick={handlePhotoClick}
            isLoading={false}
          />

          {/* Photo Viewer Modal */}
          <PhotoViewer
            photos={filteredPhotos}
            currentIndex={selectedPhotoIndex}
            isOpen={viewerOpen}
            onClose={() => setViewerOpen(false)}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-2xl p-12 border border-purple-800/50 text-center"
        >
          <HardDrive className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-foreground mb-2">No Photos Found</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'No photos in this folder yet. Check back soon!'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
            >
              Clear Search
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
