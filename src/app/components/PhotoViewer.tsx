import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import { Photo } from '../services/googleDrive';

interface PhotoViewerProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function PhotoViewer({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrev,
}: PhotoViewerProps) {
  const currentPhoto = photos[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrev]);

  return (
    <AnimatePresence>
      {isOpen && currentPhoto && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        >
          {/* Modal Content */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl h-full max-h-screen md:max-h-[90vh] flex flex-col bg-card rounded-lg overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-card border-b border-border">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">{currentPhoto.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentPhoto.folder.toUpperCase()} • {currentPhoto.addedDate.toLocaleDateString()}
                </p>
                {currentPhoto.team && (
                  <p className="text-sm text-blue-400 mt-1">{currentPhoto.team}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Close viewer"
              >
                <X className="w-6 h-6 text-foreground" />
              </button>
            </div>

            {/* Image Container */}
            <div className="flex-1 overflow-hidden bg-black/50 relative">
              <motion.img
                key={currentPhoto.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={currentPhoto.url}
                alt={currentPhoto.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-size="16" font-family="system-ui"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                }}
              />

              {/* Navigation Buttons */}
              {photos.length > 1 && (
                <>
                  {/* Previous Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onPrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </motion.button>

                  {/* Next Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </motion.button>

                  {/* Photo Counter */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 right-4 px-4 py-2 bg-black/70 rounded-full text-white font-semibold"
                  >
                    {currentIndex + 1} of {photos.length}
                  </motion.div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-card border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                {photos.length > 1 && (
                  <>
                    <span>Use arrow keys to navigate • </span>
                    <span>Press ESC to close</span>
                  </>
                )}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
