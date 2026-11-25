export type AdminBrand = {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  product_count: number;
  created_at: string;
  updated_at: string;
};

export type BrandFormValues = {
  name: string;
  description: string;
  is_active: boolean;
  sort_order: string;
};
