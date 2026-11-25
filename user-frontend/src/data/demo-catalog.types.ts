export type ProductCurrency = "USD" | "KHR";

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  sku?: string;
  brand: string | null;
  price: number;
  currency?: ProductCurrency | null;
  compareAtPrice?: number;
  image: string;
  images: string[];
  stockLeft?: number;
  rating?: number;
  category: string;
  categoryName?: string | null;
  featured?: boolean;
  shortDescription?: string;
  description?: string;
};

export type CatalogCategory = {
  id: string;
  name: string;
  nameKm?: string | null;
  slug: string;
  image: string;
  productCount: number;
};

/** @deprecated Use CatalogProduct */
export type DemoProduct = CatalogProduct;
/** @deprecated Use CatalogCategory */
export type DemoCategory = CatalogCategory;
