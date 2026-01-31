import { useState, useCallback } from "react";
import { supabase } from "../supabase-client";

const BUCKET = "profile-pictures";

function getStoragePathFromPublicUrl(url: string): string | null {
  try {
    if (!url.includes(BUCKET + "/")) return null;
    const after = url.split(BUCKET + "/")[1];
    return after?.split("?")[0] ?? null;
  } catch {
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

  const effectiveUrl = signedUrl || url;

  const trySignedUrl = useCallback(async (originalUrl: string) => {
    const path = getStoragePathFromPublicUrl(originalUrl);
    if (!path) return;
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (data?.signedUrl) setSignedUrl(data.signedUrl);
    else setFailed(true);
  }, []);

  const handleError = useCallback(() => {
    if (effectiveUrl && !signedUrl && getStoragePathFromPublicUrl(effectiveUrl)) {
      trySignedUrl(effectiveUrl);
    } else {
      setFailed(true);
    }
  }, [effectiveUrl, signedUrl, trySignedUrl]);

  if (!effectiveUrl || failed) return <>{fallback}</>;

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
