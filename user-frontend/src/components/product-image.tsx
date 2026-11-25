"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { useRegionLanguage } from "@/stores/region-store";

type ProductImageProps = Omit<ImageProps, "src" | "onError"> & {
  src?: string | null;
  compact?: boolean;
};

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
  const isKhmer = useRegionLanguage() === "KM";
  const emptyImageLabel = isKhmer ? "មិនទាន់មានរូបភាព" : "No image available";
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSrc = typeof src === "string" ? src.trim() : "";

  if (!imageSrc || failedSrc === imageSrc) {
    return (
      <div
        role="img"
        aria-label={emptyImageLabel}
        className={`absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-hidden border border-slate-200 bg-slate-100 p-2 text-slate-400 ${className ?? ""}`}
      >
        <span aria-hidden="true" className="text-5xl leading-none">
          🖼️
        </span>
        {!compact ? (
          <span className="text-center text-[10px] leading-tight text-slate-500 sm:text-xs">
            {emptyImageLabel}
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
