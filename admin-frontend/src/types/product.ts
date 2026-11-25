export type CatalogOption = {
  id: number;
  name: string;
  slug: string;
};

export type AdminProduct = {
  id: number;
  category_id: number | null;
  brand_id: number | null;
  name: string;
  slug: string;
  sku: string;
  short_description: string | null;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  stock_quantity: number;
  track_inventory: boolean;
  is_active: boolean;
  is_featured: boolean;
  average_rating: number;
  reviews_count: number;
  sales_count: number;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category?: CatalogOption | null;
  brand?: CatalogOption | null;
  primary_image?: {
    id: number;
    path?: string | null;
    url?: string | null;
    alt_text: string | null;
  } | null;
};

export type ProductFormValues = {
  category_id: string;
  name: string;
  sku: string;
  description: string;
  price: string;
  stock_quantity: string;
};

export type ProductsListData = {
  items: AdminProduct[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type CatalogOptionsData = {
  categories: CatalogOption[];
  brands: CatalogOption[];
};
