"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  alt?: string;
}

export default function ImageGallery({
  images,
  alt = "Incident photo",
}: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="p-6 text-center bg-gray-50 border border-dashed rounded-lg text-gray-400 text-sm">
        No photos attached to this incident.
      </div>
    );
  }

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const navigate = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    } else {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  return (
    <>
      {/* Thumbnail grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((url, index) => (
          <button
            key={index}
            type="button"
            onClick={() => openLightbox(index)}
            className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-green-500 transition-all group bg-gray-100"
          >
            <img
              src={url}
              alt={`${alt} ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
            </div>
            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
              Photo #{index + 1}
            </span>
          </button>
        ))}
      </div>

      {/* Lightbox modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
            title="Close viewer"
          >
            <X className="h-6 w-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => navigate("prev")}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-50 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"
                title="Previous photo"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>

              <button
                type="button"
                onClick={() => navigate("next")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-50 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"
                title="Next photo"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          <div className="max-h-[85vh] max-w-[90vw] flex items-center justify-center">
            <img
              src={images[currentIndex]}
              alt={`${alt} ${currentIndex + 1}`}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-md shadow-2xl"
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full font-medium tracking-wide">
            Photo {currentIndex + 1} of {images.length}
          </div>
        </div>
      )}
    </>
  );
}
