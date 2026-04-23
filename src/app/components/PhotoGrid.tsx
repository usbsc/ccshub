import { motion } from 'motion/react';
import { ChevronDown, Image as ImageIcon } from 'lucide-react';
import { Photo } from '../services/googleDrive';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo, index: number) => void;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function PhotoGrid({
  photos,
  onPhotoClick,
  isLoading = false,
  onLoadMore,
  hasMore = false,
}: PhotoGridProps) {
  if (photos.length === 0 && !isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground text-lg">No photos found</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Photo Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {photos.map((photo, index) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className="group cursor-pointer rounded-lg overflow-hidden bg-card border border-border shadow-lg hover:shadow-xl transition-shadow"
            onClick={() => onPhotoClick(photo, index)}
          >
            {/* Image Container */}
            <div className="relative aspect-square bg-muted overflow-hidden">
              <img
                src={photo.url}
                alt={photo.name}
                className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300"
                loading="lazy"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-size="16" font-family="system-ui"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                }}
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
            </div>

            {/* Photo Info */}
            <div className="p-3 bg-card">
              <p className="text-sm font-medium text-foreground truncate">{photo.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {photo.addedDate.toLocaleDateString()}
              </p>
              {photo.team && <p className="text-xs text-blue-400 mt-1">{photo.team}</p>}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Load More Button */}
      {hasMore && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-300"
          >
            <span>{isLoading ? 'Loading...' : 'Load More'}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center py-8"
        >
          <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
        </motion.div>
      )}
    </div>
  );
}
