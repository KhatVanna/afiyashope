import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { fetchCategories } from "@/lib/catalog-api";
import { CatalogErrorMessage } from "@/components/catalog/catalog-error-message";
import { ProductImage } from "@/components/product-image";
import { LocaleText } from "@/components/i18n/locale-text";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse Afiya Shope product categories.",
};

export default async function CategoriesPage() {
  const result = await fetchCategories();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <ScrollReveal>
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            <LocaleText en="Home" km="ទំព័រដើម" />
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">
            <LocaleText en="Categories" km="ប្រភេទទំនិញ" />
          </span>
        </nav>
      </ScrollReveal>

      <ScrollReveal delay={40}>
        <h1 className="text-3xl font-semibold tracking-tight text-navy">
          <LocaleText en="Categories" km="ប្រភេទទំនិញ" />
        </h1>
        <p className="mt-2 text-muted-foreground">
          <LocaleText
            en="Find the right collection for everyday life and premium upgrades."
            km="ស្វែងរកម៉ូដដែលស័ក្តិសមសម្រាប់ការប្រើប្រាស់ប្រចាំថ្ងៃ និងឱកាសពិសេស។"
          />
        </p>
      </ScrollReveal>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.error ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <CatalogErrorMessage />
          </div>
        ) : result.items.map((category, index) => (
          <ScrollReveal key={category.id} delay={(index % 3) * 90}>
            <Link
              href={`/products?category=${category.slug}`}
              className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="relative aspect-[16/10]">
                <ProductImage
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-contain p-4 transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold">{category.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  <LocaleText
                    en={`${category.productCount} products`}
                    km={`${category.productCount} មុខ`}
                  />
                </p>
              </div>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
