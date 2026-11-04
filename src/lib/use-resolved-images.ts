"use client";

import { useEffect, useState } from "react";
import { resolveSupabaseImageUrl } from "./supabase";

function quickNormalize(url: string): string {
  if (!url) return "";
  if (url.includes("/storage/v1/object/sign/") && !url.includes("token=")) {
    return url.replace("/storage/v1/object/sign/", "/storage/v1/object/public/");
  }
  return url;
}

/**
 * Resolves a list of stored image URLs for display immediately without flickering.
 * Public URLs and data URLs are rendered immediately.
 */
export function useResolvedImageUrls(images: string[] = []): string[] {
  const [resolved, setResolved] = useState<string[]>(() =>
    (images || []).map(quickNormalize)
  );

  useEffect(() => {
    let cancelled = false;

    // Immediately sync normalized URLs so UI does not wait on async tick
    const normalized = (images || []).map(quickNormalize);
    setResolved(normalized);

    (async () => {
      const next = await Promise.all(normalized.map(resolveSupabaseImageUrl));
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
