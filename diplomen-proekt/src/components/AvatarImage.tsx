import { useState, useCallback, useEffect } from "react";
import { supabase } from "../supabase-client";

const BUCKET = "profile-pictures";

function getStoragePathFromPublicUrl(url: string): string | null {
  try {
    if (!url || !url.includes(BUCKET + "/")) return null;
    const after = url.split(BUCKET + "/")[1];
    return after?.split("?")[0] ?? null;
  } catch (err) {
    console.error("[AvatarImage] getStoragePathFromPublicUrl:", err);
    return null;
  }
}

interface AvatarImageProps {
  url: string | null | undefined;
  fallback: React.ReactNode;
  className?: string;
  imgClassName?: string;
  alt?: string;
}

export function AvatarImage({ url, fallback, className, imgClassName, alt = "" }: AvatarImageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const storagePath = url ? getStoragePathFromPublicUrl(url) : null;
  const effectiveUrl = storagePath ? signedUrl : (signedUrl || url);

  const trySignedUrl = useCallback(async (originalUrl: string) => {
    const path = getStoragePathFromPublicUrl(originalUrl);
    if (!path) return;
    try {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
      if (error) {
        console.error("[AvatarImage] createSignedUrl failed:", error);
        setFailed(true);
        return;
      }
      if (data?.signedUrl) setSignedUrl(data.signedUrl);
      else setFailed(true);
    } catch (err) {
      console.error("[AvatarImage] trySignedUrl:", err);
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    if (!url || failed) return;
    const path = getStoragePathFromPublicUrl(url);
    if (path) {
      trySignedUrl(url);
    }
  }, [url, failed, trySignedUrl]);

  const handleError = useCallback(() => {
    if (effectiveUrl && !signedUrl && getStoragePathFromPublicUrl(effectiveUrl)) {
      trySignedUrl(effectiveUrl);
    } else {
      setFailed(true);
    }
  }, [effectiveUrl, signedUrl, trySignedUrl]);

  if (!effectiveUrl || failed) return <>{fallback}</>;
  if (storagePath && !signedUrl && !failed) return <>{fallback}</>;

  return (
    <span className={className ? `block ${className}` : undefined}>
      <img
        src={effectiveUrl}
        alt={alt}
        className={imgClassName}
        onError={handleError}
      />
    </span>
  );
}
