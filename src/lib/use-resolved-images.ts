"use client";

import { useMemo } from "react";

function normalizeUrl(url: string): string {
  if (!url) return "";
  // Heal any broken /sign/ URLs without active tokens back to public URLs
  if (url.includes("/storage/v1/object/sign/") && !url.includes("token=")) {
    return url.replace("/storage/v1/object/sign/", "/storage/v1/object/public/");
  }
  return url;
}

/**
 * Resolves a list of stored image URLs for display immediately without flickering or infinite loops.
 * Normalizes Supabase public and healed URLs cleanly with memoization.
 */
export function useResolvedImageUrls(images: string[] = []): string[] {
  const key = Array.isArray(images) ? images.join("||") : "";

  return useMemo(() => {
    if (!Array.isArray(images) || images.length === 0) return [];
    return images.map(normalizeUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
