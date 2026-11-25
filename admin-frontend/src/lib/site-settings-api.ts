import { adminApi } from "@/lib/admin-api";

export type SettingsGroup = "branding" | "contact" | "footer" | "seo";

export type BrandingSettings = {
  logo_light: string | null;
  logo_dark: string | null;
  favicon: string | null;
  primary_color: string;
  secondary_color: string;
};

export type ContactSettings = {
  phone: string;
  whatsapp_url: string;
  email: string;
  address_km: string;
  address_en: string;
  map_url: string;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
  telegram_url: string;
  business_hours_km: string;
  business_hours_en: string;
};

export type FooterQuickLink = {
  label_km: string;
  label_en: string;
  url: string;
};

export type FooterSettings = {
  about_km: string;
  about_en: string;
  quick_links: FooterQuickLink[];
  policy_links: {
    privacy: string;
    returns: string;
    shipping: string;
    terms: string;
  };
  payment_methods: {
    aba: boolean;
    acleda: boolean;
    wing: boolean;
    khqr: boolean;
    cash_on_delivery: boolean;
  };
  copyright_km: string;
  copyright_en: string;
};

export type SeoSettings = {
  site_title_km: string;
  site_title_en: string;
  meta_description_km: string;
  meta_description_en: string;
  og_image: string;
  keywords: string[];
  google_analytics_id: string;
};

export type SiteSettingsData = {
  branding: BrandingSettings;
  contact: ContactSettings;
  footer: FooterSettings;
  seo: SeoSettings;
};

export type SiteBanner = {
  id: number | null;
  media_type: "image" | "video";
  media_url: string;
  mobile_media_url: string | null;
  poster_url: string | null;
  eyebrow_km: string;
  eyebrow_en: string;
  headline_km: string;
  headline_en: string;
  subtitle_km: string;
  subtitle_en: string;
  button_text_km: string;
  button_text_en: string;
  button_url: string;
  text_align: "left" | "center" | "right";
  overlay_opacity: number;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
};

export type SiteBannerPayload = Omit<SiteBanner, "id" | "media_type">;

export type SiteMediaKind =
  | "logo"
  | "favicon"
  | "banner_image"
  | "banner_video"
  | "poster";

async function requestData<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const { ok, status, payload } = await adminApi<T>(path, init);
  if (!ok || !payload.success) {
    const errors = "errors" in payload ? payload.errors ?? {} : {};
    throw new SiteSettingsRequestError(
      payload.message || "Unable to complete the request.",
      Object.fromEntries(
        Object.entries(errors).map(([field, messages]) => [
          field,
          messages.join(" "),
        ])
      ),
      status
    );
  }
  return payload.data;
}

export class SiteSettingsRequestError extends Error {
  constructor(
    message: string,
    readonly fieldErrors: Record<string, string>,
    readonly status: number
  ) {
    super(message);
    this.name = "SiteSettingsRequestError";
  }
}

export async function loadSiteSettings(): Promise<SiteSettingsData> {
  const groups = await Promise.all(
    (["branding", "contact", "footer", "seo"] as const).map(async (group) => {
      const result = await requestData<{
        group: SettingsGroup;
        data: SiteSettingsData[typeof group];
      }>(`/admin/site-settings/${group}`);
      return [group, result.data] as const;
    })
  );

  return Object.fromEntries(groups) as SiteSettingsData;
}

export async function saveSiteSettings<K extends SettingsGroup>(
  group: K,
  data: SiteSettingsData[K]
): Promise<{ group: K; data: SiteSettingsData[K] }> {
  return requestData(`/admin/site-settings/${group}`, {
    method: "PUT",
    body: JSON.stringify({ data }),
  });
}

export async function loadSiteBanners(): Promise<SiteBanner[]> {
  const result = await requestData<{ banners: SiteBanner[] }>("/admin/banners");
  return result.banners;
}

export async function createSiteBanner(
  banner: SiteBannerPayload
): Promise<SiteBanner> {
  const result = await requestData<{ banner: SiteBanner }>("/admin/banners", {
    method: "POST",
    body: JSON.stringify(banner),
  });
  return result.banner;
}

export async function updateSiteBanner(
  id: number,
  banner: SiteBannerPayload
): Promise<SiteBanner> {
  const result = await requestData<{ banner: SiteBanner }>(
    `/admin/banners/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(banner),
    }
  );
  return result.banner;
}

export async function deleteSiteBanner(id: number): Promise<void> {
  await requestData<null>(`/admin/banners/${id}`, { method: "DELETE" });
}

export async function reorderSiteBanners(ids: number[]): Promise<void> {
  await requestData<{ banners: SiteBanner[] }>("/admin/banners/reorder", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

export async function uploadSiteMedia(
  file: File,
  kind: SiteMediaKind
): Promise<{ url: string; public_id: string; kind: SiteMediaKind }> {
  const formData = new FormData();
  formData.append("kind", kind);
  formData.append("file", file);

  return requestData<{ url: string; public_id: string; kind: SiteMediaKind }>(
    "/admin/media/site-settings",
    {
      method: "POST",
      body: formData,
    }
  );
}
