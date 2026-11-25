import type { Metadata } from "next";
import Link from "next/link";
import { CatalogErrorMessage } from "@/components/catalog/catalog-error-message";
import { LocaleText } from "@/components/i18n/locale-text";
import { ProductCard } from "@/components/product/product-card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { fetchCategories, fetchProducts } from "@/lib/catalog-api";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse the full Afiya Shope product catalog with filters and sorting.",
};

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category ?? "";
  const sort = params.sort ?? "latest";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const [categoryResult, catalog] = await Promise.all([
    fetchCategories(),
    fetchProducts({
      q: query || undefined,
      category: category || undefined,
      sort,
      page,
      perPage: 20,
    }),
  ]);

  const categories = categoryResult.items;
  const total = catalog.total;
  const totalPages = Math.max(1, catalog.lastPage);
  const currentPage = Math.min(page, totalPages);
  const pageItems = catalog.items;
  const allCount = categories.reduce((sum, item) => sum + item.productCount, 0);

  const categoryName = categories.find((item) => item.slug === category)?.name;

  function buildHref(nextPage: number) {
    const search = new URLSearchParams();
    if (query) search.set("q", params.q ?? "");
    if (category) search.set("category", category);
    if (sort && sort !== "latest") search.set("sort", sort);
    if (nextPage > 1) search.set("page", String(nextPage));
    const value = search.toString();
    return value ? `/products?${value}` : "/products";
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <ScrollReveal>
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            <LocaleText en="Home" km="ទំព័រដើម" />
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">
            <LocaleText en="Products" km="ទំនិញ" />
          </span>
        </nav>
      </ScrollReveal>

      <ScrollReveal delay={40}>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-navy">
              {categoryName ?? <LocaleText en="All products" km="ទំនិញទាំងអស់" />}
            </h1>
            {catalog.error ? (
              <CatalogErrorMessage className="mt-3" />
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                <LocaleText
                  en={`${total.toLocaleString()} product${total === 1 ? "" : "s"}`}
                  km={`ទំនិញ ${total.toLocaleString()} មុខ`}
                />
                {query ? (
                  <LocaleText
                    en={` matching “${params.q}”`}
                    km={` ដែលត្រូវនឹង “${params.q}”`}
                  />
                ) : ""}
                {" · "}
                <LocaleText
                  en={`Page ${currentPage} of ${totalPages}`}
                  km={`ទំព័រ ${currentPage} នៃ ${totalPages}`}
                />
              </p>
            )}
          </div>
        </div>
      </ScrollReveal>

      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <ScrollReveal delay={60}>
          <aside className="h-fit space-y-6 rounded-2xl border border-border bg-card p-5">
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
                <LocaleText en="Categories" km="ប្រភេទទំនិញ" />
              </h2>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/products"
                    className={`text-sm ${!category ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <LocaleText en={`All (${allCount})`} km={`ទាំងអស់ (${allCount})`} />
                  </Link>
                </li>
                {categoryResult.error ? (
                  <li>
                    <CatalogErrorMessage className="px-3 py-2 text-left text-xs" />
                  </li>
                ) : categories.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/products?category=${item.slug}`}
                      className={`text-sm ${category === item.slug ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {item.name} ({item.productCount})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
                <LocaleText en="Sort" km="តម្រៀប" />
              </h2>
              <ul className="space-y-2 text-sm">
                <SortLink
                  labelEn="Latest"
                  labelKm="ថ្មីបំផុត"
                  href={category ? `/products?category=${category}` : "/products"}
                  active={sort === "latest" || !params.sort}
                />
                <SortLink
                  labelEn="Popular"
                  labelKm="ពេញនិយម"
                  href={`/products?sort=popular${category ? `&category=${category}` : ""}`}
                  active={sort === "popular"}
                />
                <SortLink
                  labelEn="Price: Low to High"
                  labelKm="តម្លៃ៖ ពីទាបទៅខ្ពស់"
                  href={`/products?sort=price-asc${category ? `&category=${category}` : ""}`}
                  active={sort === "price-asc"}
                />
                <SortLink
                  labelEn="Price: High to Low"
                  labelKm="តម្លៃ៖ ពីខ្ពស់ទៅទាប"
                  href={`/products?sort=price-desc${category ? `&category=${category}` : ""}`}
                  active={sort === "price-desc"}
                />
                <SortLink
                  labelEn="Offers"
                  labelKm="ការផ្តល់ជូន"
                  href={`/products?sort=offers${category ? `&category=${category}` : ""}`}
                  active={sort === "offers"}
                />
              </ul>
            </div>
          </aside>
        </ScrollReveal>

        <div>
          {catalog.error ? null : pageItems.length === 0 ? (
            <ScrollReveal>
              <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
                <p className="text-lg font-medium">
                  <LocaleText en="No products found" km="រកមិនឃើញទំនិញទេ" />
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  <LocaleText
                    en="Try another search or browse all categories."
                    km="សូមសាកល្បងស្វែងរកពាក្យផ្សេង ឬមើលប្រភេទទំនិញទាំងអស់។"
                  />
                </p>
                <Link
                  href="/products"
                  className="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  <LocaleText en="Browse all" km="មើលទាំងអស់" />
                </Link>
              </div>
            </ScrollReveal>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                {pageItems.map((product, index) => (
                  <ScrollReveal key={product.id} delay={(index % 5) * 70}>
                    <ProductCard product={product} priority={index === 0} />
                  </ScrollReveal>
                ))}
              </div>

              <ScrollReveal className="mt-10">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <PaginationLink
                    href={buildHref(currentPage - 1)}
                    disabled={currentPage <= 1}
                    labelEn="Previous"
                    labelKm="មុន"
                  />
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter((pageNumber) => {
                      if (totalPages <= 7) return true;
                      return (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        Math.abs(pageNumber - currentPage) <= 2
                      );
                    })
                    .map((pageNumber, index, list) => {
                      const previous = list[index - 1];
                      const showEllipsis = previous && pageNumber - previous > 1;

                      return (
                        <span key={pageNumber} className="contents">
                          {showEllipsis ? (
                            <span className="px-2 text-muted-foreground">…</span>
                          ) : null}
                          <Link
                            href={buildHref(pageNumber)}
                            className={`inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-medium ${
                              pageNumber === currentPage
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:bg-muted"
                            }`}
                          >
                            {pageNumber}
                          </Link>
                        </span>
                      );
                    })}
                  <PaginationLink
                    href={buildHref(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    labelEn="Next"
                    labelKm="បន្ទាប់"
                  />
                </div>
              </ScrollReveal>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SortLink({
  labelEn,
  labelKm,
  href,
  active,
}: {
  labelEn: string;
  labelKm: string;
  href: string;
  active: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={
          active
            ? "font-semibold text-primary"
            : "text-muted-foreground hover:text-foreground"
        }
      >
        <LocaleText en={labelEn} km={labelKm} />
      </Link>
    </li>
  );
}

function PaginationLink({
  href,
  disabled,
  labelEn,
  labelKm,
}: {
  href: string;
  disabled: boolean;
  labelEn: string;
  labelKm: string;
}) {
  if (disabled) {
    return (
      <span className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm text-muted-foreground opacity-50">
        <LocaleText en={labelEn} km={labelKm} />
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
    >
      <LocaleText en={labelEn} km={labelKm} />
    </Link>
  );
}
