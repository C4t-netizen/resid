import { supabase } from "@/integrations/supabase/client";

/**
 * Parses a stored URL (public or signed) from Supabase Storage and returns
 * a freshly signed URL valid for the given number of seconds.
 *
 * Storage buckets are private, so previously-stored "public" URLs need to be
 * re-signed before they can be fetched.
 */
export async function getReadableStorageUrl(storedUrl: string, expiresIn = 3600): Promise<string> {
  if (!storedUrl) return storedUrl;
  try {
    const url = new URL(storedUrl);
    // matches /storage/v1/object/(public|sign)/<bucket>/<path...>
    const m = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
    if (!m) return storedUrl;
    const bucket = m[1];
    const path = decodeURIComponent(m[2].split("?")[0]);
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error || !data?.signedUrl) return storedUrl;
    return data.signedUrl;
  } catch {
    return storedUrl;
  }
}
