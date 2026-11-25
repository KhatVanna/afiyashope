"use client";

import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { CatalogProduct } from "@/data/demo-catalog.types";
import { useFormatMoney } from "@/hooks/use-format-money";
import { useLocaleText } from "@/components/i18n/locale-text";
import { getProductImageUrls } from "@/lib/product-images";

type ProductDetailViewProps = {
  product: CatalogProduct;
  related: CatalogProduct[];
};

export function ProductDetailView({ product, related }: ProductDetailViewProps) {
  const t = useLocaleText();
  const formatMoney = useFormatMoney();

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
        )
      : null;

  const galleryImages = getProductImageUrls(product);

  return (
    <div className="apple-reveal mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-8">
      <nav className="apple-reveal__item mb-4 truncate text-xs text-muted-foreground sm:mb-6 sm:text-sm">
        <Link href="/" className="hover:text-foreground">
          {t("Home", "ទំព័រដើម")}
        </Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-foreground">
          {t("Products", "ទំនិញ")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="apple-reveal__item apple-reveal__item--2 mb-4 sm:mb-6">
        {product.brand ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {product.brand}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy sm:mt-2 sm:text-4xl">
          {product.name}
        </h1>
      </div>

      <div className="grid gap-5 sm:gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <div className="apple-reveal__hero">
          <ProductGallery images={galleryImages} alt={product.name} discount={discount} />
        </div>

        <div className="apple-reveal__item apple-reveal__item--4 space-y-4 sm:space-y-5">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:rounded-2xl sm:p-5">
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
              <span className="text-2xl font-bold sm:text-3xl">{formatMoney(product.price, product.currency)}</span>
              {product.compareAtPrice ? (
                <span className="text-base text-muted-foreground line-through sm:text-lg">
                  {formatMoney(product.compareAtPrice, product.currency)}
                </span>
              ) : null}
            </div>

            {typeof product.stockLeft === "number" ? (
              <p className="mt-3 text-sm text-accent">
                {product.stockLeft > 0
                  ? t(`In stock — only ${product.stockLeft} left`, `មានក្នុងស្តុក — នៅសល់តែ ${product.stockLeft} មុខ`)
                  : t("Out of stock", "អស់ពីស្តុក")}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <ScrollReveal as="section" variant="apple" className="mt-12 max-w-3xl space-y-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
            {product.name}
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
            {product.description ||
              (product.brand
                ? t(
                    `Experience premium quality with the ${product.name} from ${product.brand}. Designed for everyday performance with a clean finish and reliable build — a strong pick for customers who want value without compromise.`,
                    `ស្វែងយល់ពីគុណភាពល្អរបស់ ${product.name} ពី ${product.brand}។ រចនាឡើងសម្រាប់ការប្រើប្រាស់ប្រចាំថ្ងៃ ជាមួយនឹងរូបរាងស្អាត និងគុណភាពជឿទុកចិត្តបាន។`
                  )
                : t(
                    `Experience premium quality with the ${product.name}. Designed for everyday performance with a clean finish and reliable build — a strong pick for customers who want value without compromise.`,
                    `ស្វែងយល់ពីគុណភាពល្អរបស់ ${product.name}។ រចនាឡើងសម្រាប់ការប្រើប្រាស់ប្រចាំថ្ងៃ ជាមួយនឹងរូបរាងស្អាត និងគុណភាពជឿទុកចិត្តបាន។`
                  ))}
          </p>
        </div>

        <div className="border-t border-border pt-8">
          <h3 className="text-xl font-semibold text-navy">{t("Highlights", "ចំណុចសំខាន់ៗ")}</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {product.brand ? (
              <li>
                <strong className="text-foreground">{t("Trusted brand:", "ម៉ាកដែលគួរឱ្យទុកចិត្ត៖")}</strong> {product.brand}
              </li>
            ) : null}
            <li>
              <strong className="text-foreground">{t("Fast delivery options", "ជម្រើសដឹកជញ្ជូនរហ័ស")}</strong>{" "}
              {t("available at checkout", "មាននៅពេលទូទាត់")}
            </li>
            <li>
              <strong className="text-foreground">{t("Easy returns", "ការប្រគល់ទំនិញវិញងាយស្រួល")}</strong>{" "}
              {t("on eligible purchases", "សម្រាប់ការទិញដែលមានលក្ខខណ្ឌ")}
            </li>
          </ul>
        </div>
      </ScrollReveal>

      {related.length > 0 ? (
        <section className="mt-14">
          <ScrollReveal variant="apple">
            <h2 className="mb-6 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
              {t("You might also like", "អ្នកប្រហែលជាចូលចិត្តទំនិញទាំងនេះផងដែរ")}
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((item, index) => (
              <ScrollReveal key={item.id} variant="apple" delay={(index % 4) * 90}>
                <ProductCard product={item} />
              </ScrollReveal>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
