"use client";

import Image, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";
import { useState } from "react";

type ImageWithFallbackProps = Omit<ImageProps, "src" | "onError"> & {
  src: string;
};

export function ImageWithFallback({ src, ...props }: ImageWithFallbackProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (failedSrc === src) {
    return (
      <div
        role={props.alt ? "img" : undefined}
        aria-label={props.alt ? `${props.alt} (image unavailable)` : undefined}
        aria-hidden={props.alt ? undefined : true}
        className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground"
      >
        <ImageOff className="h-8 w-8 opacity-60" aria-hidden="true" />
        {props.alt ? <span className="sr-only">Image unavailable</span> : null}
      </div>
    );
  }

  return <Image {...props} src={src} alt={props.alt} onError={() => setFailedSrc(src)} />;
}
