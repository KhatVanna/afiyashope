import type { Metadata } from "next";
import Link from "next/link";
import { CatalogErrorMessage } from "@/components/catalog/catalog-error-message";
import { LocaleText } from "@/components/i18n/locale-text";
import { ProductCard } from "@/components/product/product-card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { fetchProducts } from "@/lib/catalog-api";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse the full Afiya Shope product catalog.",
};

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    sort?: string;
    page?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category ?? "";
  const brand = params.brand ?? "";
  const sort = params.sort ?? "latest";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const catalog = await fetchProducts({
    q: query || undefined,
    category: category || undefined,
    brand: brand || undefined,
    sort,
    page,
    perPage: 20,
  });
  const totalPages = Math.max(1, catalog.lastPage);
  const currentPage = Math.min(page, totalPages);
  const pageItems = catalog.items;

  function buildHref(nextPage: number) {
    const search = new URLSearchParams();
    if (query) search.set("q", params.q ?? "");
    if (category) search.set("category", category);
    if (brand) search.set("brand", brand);
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

      {catalog.error ? <CatalogErrorMessage className="mb-6" /> : null}
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
