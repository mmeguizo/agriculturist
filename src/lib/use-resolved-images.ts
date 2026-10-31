"use client";

import { useEffect, useState } from "react";
import { resolveSupabaseImageUrl } from "./supabase";

/**
 * Resolves a list of stored image URLs for display. Supabase public object
 * URLs are exchanged for signed URLs so images render even when the storage
 * bucket is private; all other URLs are returned unchanged.
 */
export function useResolvedImageUrls(images: string[]): string[] {
  const [resolved, setResolved] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const next = await Promise.all(images.map(resolveSupabaseImageUrl));
      if (!cancelled) {
        setResolved(next);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [images]);

  return resolved;
}
