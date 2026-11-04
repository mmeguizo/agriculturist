"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export const supabaseBucket =
  process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "incidents";

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}

/**
 * Upload an image (base64 data-URL or File/Blob) to Supabase Storage and return its public URL.
 * Firebase Firestore is only used to store the returned URL as text.
 * Includes a 25-second timeout so stalled network requests fail fast and cleanly.
 */
export async function uploadImageToSupabase(
  bucket: string,
  path: string,
  imageData: string | Blob,
  timeoutMs = 25000
): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  let file: File | Blob;
  let contentType = "image/jpeg";

  if (typeof imageData === "string") {
    // Fast data URL extraction without fetch overhead
    if (imageData.startsWith("data:")) {
      const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        contentType = match[1] || "image/jpeg";
        const binaryString = atob(match[2]);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        file = new Blob([bytes], { type: contentType });
      } else {
        const response = await fetch(imageData);
        file = await response.blob();
        contentType = file.type || "image/jpeg";
      }
    } else {
      const response = await fetch(imageData);
      file = await response.blob();
      contentType = file.type || "image/jpeg";
    }
  } else {
    file = imageData;
    contentType = file.type || "image/jpeg";
  }

  // Upload with timeout protection
  const uploadPromise = supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    contentType,
    upsert: true,
  });

  const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
    setTimeout(() => reject(new Error(`Upload timed out after ${timeoutMs / 1000}s`)), timeoutMs)
  );

  const { error } = (await Promise.race([uploadPromise, timeoutPromise])) as {
    data: unknown;
    error: Error | null;
  };

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Normalizes and resolves image URLs for display.
 * - Public bucket Supabase URLs (`/storage/v1/object/public/`) are kept as-is (HTTP 200).
 * - Broken `/storage/v1/object/sign/` URLs without active tokens are normalized back to public URLs.
 * - Inline `data:` fallbacks are returned unchanged.
 */
export async function resolveSupabaseImageUrl(url: string): Promise<string> {
  if (!url) return "";

  // If the URL is already a public Supabase URL, use it directly (no signing needed)
  if (url.includes("/storage/v1/object/public/")) {
    return url;
  }

  // If it's a signed URL without a valid token parameter, recover it to public
  if (url.includes("/storage/v1/object/sign/") && !url.includes("token=")) {
    return url.replace("/storage/v1/object/sign/", "/storage/v1/object/public/");
  }

  // Non-Supabase URLs (e.g. data: URLs) are returned as-is
  return url;
}
