import type { ApiResponse } from "@/types/api";
import type { CatalogCategory, CatalogProduct } from "@/data/demo-catalog.types";

type ApiProduct = {
  id: number;
  slug: string;
  name: string;
  price: number;
  compare_at_price?: number | null;
  stock_quantity?: number;
  average_rating?: number;
  is_featured?: boolean;
  short_description?: string | null;
  description?: string | null;
  brand?: { name?: string | null; slug?: string | null } | null;
  category?: { slug?: string | null } | null;
  primary_image?: { path?: string | null; url?: string | null } | null;
  images?: Array<{ path?: string | null; url?: string | null }> | null;
};

type ApiCategory = {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  product_count?: number;
};

export type CatalogBrand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  productCount: number;
};

export type CatalogListResult<T> = {
  items: T[];
  error: boolean;
};

export type CatalogProductsResult = {
  items: CatalogProduct[];
  total: number;
  lastPage: number;
  page: number;
  error: boolean;
};

export type CatalogProductDetailResult =
  | { product: CatalogProduct; related: CatalogProduct[] }
  | { error: true }
  | null;

class CatalogApiFailure extends Error {
  constructor(
    readonly status: number,
    readonly endpoint: string
  ) {
    super(`Catalog request failed (${status}) at ${endpoint}`);
  }
}

function apiOrigin(): string {
  return (
    process.env.LARAVEL_API_ORIGIN ??
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ??
    "http://127.0.0.1:8000"
  );
}

function endpointPath(path: string): string {
  const pathname = path.split("?")[0] || "/";
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  return normalizedPath.replace(
    /^\/catalog\/products\/[^/]+$/,
    "/catalog/products/:slug"
  );
}

function logCatalogFailure(status: number, endpoint: string): void {
  console.error("[catalog-api] request failed", {
    status,
    endpoint: endpointPath(endpoint),
  });
}

async function catalogFetch<T>(path: string): Promise<T> {
  const endpoint = endpointPath(path);
  let response: Response;

  try {
    response = await fetch(`${apiOrigin()}/api/v1${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
  } catch {
    logCatalogFailure(0, endpoint);
    throw new CatalogApiFailure(0, endpoint);
  }

  if (!response.ok) {
    logCatalogFailure(response.status, endpoint);
    throw new CatalogApiFailure(response.status, endpoint);
  }

  let payload: ApiResponse<T>;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    logCatalogFailure(response.status, endpoint);
    throw new CatalogApiFailure(response.status, endpoint);
  }

  if (payload.success !== true) {
    logCatalogFailure(response.status, endpoint);
    throw new CatalogApiFailure(response.status, endpoint);
  }

  return payload.data;
}

export function mapApiProduct(product: ApiProduct): CatalogProduct {
  const imageList = Array.isArray(product.images) ? product.images : [];
  const images = imageList
    .map((image) => [image?.url, image?.path].find((path) => path?.trim()) ?? "")
    .filter(Boolean);
  const primary =
    [product.primary_image?.url, product.primary_image?.path, images[0]].find(
      (path) => path?.trim()
    ) ?? "";

  return {
    id: String(product.id),
    slug: product.slug,
    name: product.name,
    brand: product.brand?.name ?? null,
    price: Number(product.price),
    compareAtPrice:
      product.compare_at_price != null ? Number(product.compare_at_price) : undefined,
    image: primary,
    images,
    stockLeft: product.stock_quantity,
    rating: product.average_rating != null ? Number(product.average_rating) : undefined,
    category: product.category?.slug ?? "",
    featured: Boolean(product.is_featured),
    shortDescription: product.short_description ?? undefined,
    description: product.description ?? undefined,
  };
}

export async function fetchCategories(): Promise<CatalogListResult<CatalogCategory>> {
  try {
    const data = await catalogFetch<{ items: ApiCategory[] }>("/catalog/categories");

    return {
      items: (data.items ?? []).map((category) => ({
        id: String(category.id),
        name: category.name,
        slug: category.slug,
        image: category.image?.trim() ?? "",
        productCount: Number(category.product_count ?? 0),
      })),
      error: false,
    };
  } catch (error) {
    if (!(error instanceof CatalogApiFailure)) {
      throw error;
    }

    return { items: [], error: true };
  }
}

export async function fetchBrands(): Promise<CatalogListResult<CatalogBrand>> {
  try {
    const data = await catalogFetch<{
      items: Array<{
        id: number;
        name: string;
        slug: string;
        logo_url?: string | null;
        product_count?: number;
      }>;
    }>("/catalog/brands");

    return {
      items: (data.items ?? []).map((brand) => ({
        id: String(brand.id),
        name: brand.name,
        slug: brand.slug,
        logoUrl: brand.logo_url?.trim() ?? "",
        productCount: Number(brand.product_count ?? 0),
      })),
      error: false,
    };
  } catch (error) {
    if (!(error instanceof CatalogApiFailure)) {
      throw error;
    }

    return { items: [], error: true };
  }
}

export async function fetchProducts(params: {
  q?: string;
  category?: string;
  brand?: string;
  sort?: string;
  page?: number;
  perPage?: number;
  featured?: boolean;
}): Promise<CatalogProductsResult> {
  try {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    if (params.category) search.set("category", params.category);
    if (params.brand) search.set("brand", params.brand);
    if (params.sort) search.set("sort", params.sort);
    if (params.page) search.set("page", String(params.page));
    if (params.perPage) search.set("per_page", String(params.perPage));
    if (params.featured) search.set("featured", "1");

    const query = search.toString();
    const data = await catalogFetch<{
      items: ApiProduct[];
      meta: { total: number; last_page: number; current_page: number };
    }>(`/catalog/products${query ? `?${query}` : ""}`);

    return {
      items: (data.items ?? []).map(mapApiProduct),
      total: data.meta?.total ?? 0,
      lastPage: data.meta?.last_page ?? 1,
      page: data.meta?.current_page ?? 1,
      error: false,
    };
  } catch (error) {
    if (!(error instanceof CatalogApiFailure)) {
      throw error;
    }

    return { items: [], total: 0, lastPage: 1, page: 1, error: true };
  }
}

export async function fetchProductBySlug(
  slug: string
): Promise<CatalogProductDetailResult> {
  const endpoint = `/catalog/products/${encodeURIComponent(slug)}`;

  try {
    const data = await catalogFetch<{
      product: ApiProduct;
      related: ApiProduct[];
    }>(endpoint);

    if (!data?.product) {
      logCatalogFailure(200, endpoint);

      return { error: true };
    }

    return {
      product: mapApiProduct(data.product),
      related: (data.related ?? []).map(mapApiProduct),
    };
  } catch (error) {
    if (!(error instanceof CatalogApiFailure)) {
      throw error;
    }

    return error.status === 404 ? null : { error: true };
  }
}

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "Blog & News", href: "/blog" },
  { label: "Contact", href: "/contact" },
];
