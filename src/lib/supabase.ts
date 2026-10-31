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
 * Upload a base64 data-URL image to Supabase Storage and return its public URL.
 * Firebase Firestore is only used to store the returned URL as text.
 */
export async function uploadImageToSupabase(
  bucket: string,
  path: string,
  dataUrl: string
): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error("Failed to decode the selected image.");
  }

  const blob = await response.blob();
  const contentType = blob.type || "image/jpeg";
  const file = new File([blob], path.split("/").pop() || "image.jpg", {
    type: contentType,
  });

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    contentType,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Supabase signed URLs for private buckets stay valid for this many seconds.
 * 315360000 seconds = 10 years, effectively permanent for this app's needs.
 */
const SIGNED_URL_EXPIRY_SECONDS = 315360000;

/**
 * Convert a stored Supabase public object URL into a signed URL so the image
 * remains viewable even when the storage bucket is not public. Non-Supabase
 * URLs (for example inline `data:` fallbacks) are returned unchanged.
 */
export async function resolveSupabaseImageUrl(url: string): Promise<string> {
  const marker = "/storage/v1/object/public/";
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) return url;

  const rest = url.slice(markerIndex + marker.length).split("?")[0];
  const slashIndex = rest.indexOf("/");
  if (slashIndex === -1) return url;

  const bucket = rest.slice(0, slashIndex);
  const path = rest.slice(slashIndex + 1);

  const supabase = getSupabaseClient();
  if (!supabase) return url;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

  if (error || !data) return url;
  return data.signedUrl;
}
