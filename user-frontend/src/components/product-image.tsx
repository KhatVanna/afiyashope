"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type ProductImageProps = Omit<ImageProps, "src" | "onError"> & {
  src?: string | null;
  compact?: boolean;
};

const EMPTY_IMAGE_LABEL = "មិនទាន់មានរូបភាព";

export function ProductImage({
  src,
  alt = "",
  className,
  compact = false,
  priority = false,
  loading,
  unoptimized,
  ...imageProps
}: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSrc = typeof src === "string" ? src.trim() : "";

  if (!imageSrc || failedSrc === imageSrc) {
    return (
      <div
        role="img"
        aria-label={EMPTY_IMAGE_LABEL}
        className={`absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-hidden border border-slate-200 bg-slate-100 p-2 text-slate-400 ${className ?? ""}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="aspect-square w-[36%] max-w-14"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        {!compact ? (
          <span className="text-center text-[10px] leading-tight text-slate-500 sm:text-xs">
            {EMPTY_IMAGE_LABEL}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <Image
      {...imageProps}
      src={imageSrc}
      alt={alt}
      className={className}
      priority={priority}
      loading={priority ? undefined : loading ?? "lazy"}
      unoptimized={
        unoptimized ?? (imageSrc.startsWith("data:") || imageSrc.startsWith("blob:"))
      }
      onError={() => setFailedSrc(imageSrc)}
    />
  );
}
