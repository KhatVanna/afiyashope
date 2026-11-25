export type PublicSiteBanner = {
  id: number;
  media_type: "image" | "video";
  media_url: string;
  mobile_media_url: string | null;
  poster_url: string | null;
  eyebrow_km: string | null;
  eyebrow_en: string | null;
  headline_km: string;
  headline_en: string;
  subtitle_km: string | null;
  subtitle_en: string | null;
  button_text_km: string | null;
  button_text_en: string | null;
  button_url: string | null;
  text_align: "left" | "center" | "right";
  overlay_opacity: number;
};

type SiteBannersResponse = {
  success: boolean;
  data?: {
    banners?: PublicSiteBanner[];
  };
};

export async function fetchSiteBanners(): Promise<PublicSiteBanner[]> {
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  const url = `${apiBase.replace(/\/+$/, "")}/banners`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return [];

    const payload = (await response.json()) as SiteBannersResponse;
    return payload.success && Array.isArray(payload.data?.banners)
      ? payload.data.banners
      : [];
  } catch {
    return [];
  }
}
