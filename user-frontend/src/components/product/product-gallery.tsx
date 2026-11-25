"use client";

import { useState } from "react";
import { ProductImage } from "@/components/product-image";
import { useLocaleText } from "@/components/i18n/locale-text";

type ProductGalleryProps = {
  images: string[];
  alt: string;
  discount?: number | null;
};

export function ProductGallery({ images, alt, discount }: ProductGalleryProps) {
  const t = useLocaleText();
  const gallery = images.filter((image) => typeof image === "string" && image.trim());
  const [activeIndex, setActiveIndex] = useState(0);

  if (gallery.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-2xl">
        <ProductImage src={null} alt={alt} fill sizes="(max-width: 1024px) 100vw, 50vw" />
      </div>
    );
  }

  const activeImage = gallery[Math.min(activeIndex, gallery.length - 1)];

  return (
    <div
      className={`grid gap-3 sm:gap-4 ${
        gallery.length > 1 ? "lg:grid-cols-[72px_minmax(0,1fr)]" : ""
      }`}
    >
      {gallery.length > 1 ? (
        <div className="hidden max-h-[min(70vh,560px)] flex-col gap-2.5 overflow-y-auto lg:flex">
          {gallery.map((image, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={`desk-${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={t(`View image ${index + 1}`, `មើលរូបភាពទី ${index + 1}`)}
                className={`product-gallery-thumbnail relative aspect-square w-full shrink-0 overflow-hidden rounded-lg border bg-white transition ${
                  isActive
                    ? "border-foreground ring-1 ring-foreground"
                    : "border-border hover:border-foreground/40"
                }`}
              >
                <ProductImage
                  src={image}
                  alt=""
                  fill
                  compact
                  className="object-contain p-1.5"
                  sizes="72px"
                />
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="space-y-3 sm:space-y-4">
        <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-[#f1f9fd] sm:rounded-2xl">
          <ProductImage
            key={activeImage}
            src={activeImage}
            alt={alt}
            fill
            priority
            className="apple-image-fade object-contain p-4 sm:p-6"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {discount ? (
            <span className="absolute left-3 top-3 rounded-md bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground sm:left-4 sm:top-4 sm:px-2.5">
              -{discount}%
            </span>
          ) : null}
        </div>

        {gallery.length > 1 ? (
          <div className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-1 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {gallery.map((image, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={`mob-${image}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={t(`View image ${index + 1}`, `មើលរូបភាពទី ${index + 1}`)}
                  className={`product-gallery-thumbnail relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-white transition sm:h-20 sm:w-20 ${
                    isActive
                      ? "border-foreground ring-1 ring-foreground"
                      : "border-border hover:border-foreground/40"
                  }`}
                >
                  <ProductImage
                    src={image}
                    alt=""
                    fill
                    compact
                    className="object-contain p-1.5"
                    sizes="80px"
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
