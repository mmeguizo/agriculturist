"use client";

import { useRef, useState } from "react";
import { X, Camera, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ImageUploaderProps {
  images: string[]; // base64 data URLs
  onImagesChange: React.Dispatch<React.SetStateAction<string[]>>;
  minRequired?: number;
  maxAllowed?: number;
}

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.72;

/**
 * Downscale and re-encode an image file to a lightweight, compact JPEG data URL.
 * Produces crisp ~60-90KB photos that upload in milliseconds over cellular networks.
 */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to decode image"));
      img.onload = () => {
        const maxSide = Math.max(img.width, img.height);
        const scale = maxSide > MAX_DIMENSION ? MAX_DIMENSION / maxSide : 1;
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ImageUploader({
  images,
  onImagesChange,
  minRequired = 4,
  maxAllowed = 10,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (rawFiles.length === 0) return;

    if (images.length + rawFiles.length > maxAllowed) {
      toast.error(`Maximum ${maxAllowed} photos allowed.`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of rawFiles) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file.`);
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 20MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setCompressing(true);
    try {
      // Compress all selected images in parallel
      const compressedList = await Promise.all(
        validFiles.map(async (file) => {
          try {
            return await compressImage(file);
          } catch (err) {
            console.warn("Failed to compress file:", file.name, err);
            return null;
          }
        })
      );

      const successful = compressedList.filter((c): c is string => Boolean(c));
      if (successful.length > 0) {
        onImagesChange((prev) => [...prev, ...successful]);
      }
      if (successful.length < validFiles.length) {
        toast.error("Some photos could not be processed.");
      }
    } catch {
      toast.error("Error processing photos. Please try again.");
    } finally {
      setCompressing(false);
    }
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  };

  const isMinimumMet = images.length >= minRequired;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-800">
          Upload Evidence Photos
        </label>
        <span
          className={`inline-flex items-center gap-1 text-sm font-bold ${
            isMinimumMet ? "text-green-600" : "text-amber-600"
          }`}
        >
          {isMinimumMet ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600" />
          )}
          {images.length} of {minRequired} minimum {isMinimumMet ? "met" : "required"}
        </span>
      </div>

      {/* Image preview grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((img, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100 shadow-sm"
          >
            <img
              src={img}
              alt={`Upload ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-md transition-colors"
              title="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
              #{index + 1}
            </span>
          </div>
        ))}

        {/* Compressing placeholder */}
        {compressing && (
          <div className="aspect-square rounded-lg border-2 border-dashed border-green-400 bg-green-50/60 flex flex-col items-center justify-center gap-2 text-green-700 p-3 text-center animate-pulse">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            <span className="text-xs font-semibold">Optimizing...</span>
          </div>
        )}

        {/* Add photo button */}
        {!compressing && images.length < maxAllowed && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-green-600 hover:bg-green-50/50 flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:text-green-700 transition-all p-3 text-center"
          >
            <Camera className="h-7 w-7 text-gray-400" />
            <span className="text-xs font-semibold">Add Photo</span>
            <span className="text-[10px] text-gray-400">Camera / Gallery</span>
          </button>
        )}
      </div>

      {!isMinimumMet && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">At least {minRequired} clear photos are required</p>
            <p className="text-amber-700 mt-0.5">
              Take pictures from multiple angles: close-up of affected leaf/fruit/stem, overall plant view, and underside of foliage.
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
