"use client";

import Link from "next/link";
import { type CatalogProduct } from "@/data/demo-catalog.types";
import { useFormatMoney } from "@/hooks/use-format-money";
import { ProductImage } from "@/components/product-image";
import { getProductImageUrls } from "@/lib/product-images";
import { useLocaleText } from "@/components/i18n/locale-text";

type ProductCardProps = {
  product: CatalogProduct;
  priority?: boolean;
};

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const t = useLocaleText();
  const formatMoney = useFormatMoney();
  const productImages = getProductImageUrls(product);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#ffd1dc] bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
        <Link href={`/products/${product.slug}`} className="relative block h-full w-full">
          <ProductImage
            src={productImages[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
            priority={priority}
            className="object-contain p-3 transition duration-500 ease-out group-hover:scale-105"
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center gap-2 p-4 text-center">
        {typeof product.stockLeft === "number" ? (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              product.stockLeft > 0
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {product.stockLeft > 0
              ? t("✓ In stock", "✓ មានស្តុក")
              : t("Out of stock", "អស់ស្តុក")}
          </span>
        ) : null}
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 min-h-[2.75rem] w-full text-sm font-bold text-foreground transition hover:text-primary"
        >
          {product.name}
        </Link>

        <div className="mt-auto flex flex-wrap items-baseline justify-center gap-2 pt-1">
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <span className="text-sm text-muted-foreground line-through">
              {formatMoney(product.compareAtPrice)}
            </span>
          ) : null}
          <span className="text-lg font-bold text-[#139bc6]">
            {formatMoney(product.price)}
          </span>
        </div>

        <Link
          href={`/products/${product.slug}`}
          className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-[#ffd1dc] bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-[#fff1f4]"
        >
          {t("View", "ចុចមើល")}
        </Link>
      </div>
    </article>
  );
}
