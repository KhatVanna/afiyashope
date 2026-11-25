export type AdminCategory = {
  id: number;
  name: string;
  name_km: string | null;
  slug: string;
  product_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
};

export type CategoryFormValues = {
  name: string;
  name_km: string;
};
