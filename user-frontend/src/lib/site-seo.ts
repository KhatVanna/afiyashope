import type { Metadata } from "next";
import type { ApiResponse } from "@/types/api";

export const DEFAULT_SITE_URL = "https://afiyashope-cambodia.vercel.app";
export const DEFAULT_SOCIAL_TITLE =
  "Afiya Shope | Luxury Abaya & Modest Fashion in Cambodia";
export const DEFAULT_SOCIAL_DESCRIPTION =
  "Discover elegant Abaya and modest fashion at Afiya Shope. Explore curated styles for every occasion, with wholesale and retail shopping across Cambodia.";
export const DEFAULT_OG_IMAGE_PATH = "/og-default.jpg";

const LEGACY_DEFAULT_SHARE_IMAGE = "/images/afiyashope_logo.png";

type PublicSeoSettings = {
  site_title_en?: unknown;
  meta_description_en?: unknown;
  og_image?: unknown;
};

type PublicSiteSettings = {
  seo?: PublicSeoSettings | null;
};

function getTrimmedText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getApiOrigin(): URL {
  const directOrigin = process.env.LARAVEL_API_ORIGIN?.trim();
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const configuredOrigin =
    directOrigin ||
    (publicApiUrl
      ? publicApiUrl.replace(/\/api\/v1\/?$/, "")
      : "http://127.0.0.1:8000");
  const parsed = new URL(configuredOrigin);

  return new URL("/", parsed.origin);
}

export function getSiteMetadataBase(): URL {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
  const parsed = new URL(configuredUrl);

  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
    console.warn(
      "[site-seo] NEXT_PUBLIC_SITE_URL must use HTTPS in production; using the production site URL."
    );
    return new URL(DEFAULT_SITE_URL);
  }

  return new URL("/", parsed.origin);
}

async function fetchPublicSeoSettings(): Promise<PublicSeoSettings | null> {
  let endpoint: URL;
  try {
    endpoint = new URL("/api/v1/site-settings", getApiOrigin());
  } catch {
    console.warn("[site-seo] public site settings API URL is invalid", {
      endpoint: "/api/v1/site-settings",
    });
    return null;
  }

  let response: Response;

  try {
    response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
  } catch {
    console.warn("[site-seo] public site settings request failed", {
      reason: "network",
      endpoint: "/api/v1/site-settings",
    });
    return null;
  }

  if (!response.ok) {
    console.warn("[site-seo] public site settings request failed", {
      status: response.status,
      endpoint: "/api/v1/site-settings",
    });
    return null;
  }

  let payload: ApiResponse<PublicSiteSettings>;
  try {
    payload = (await response.json()) as ApiResponse<PublicSiteSettings>;
  } catch {
    console.warn("[site-seo] public site settings response was invalid JSON", {
      endpoint: "/api/v1/site-settings",
    });
    return null;
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("success" in payload) ||
    !payload.success ||
    !("data" in payload) ||
    !payload.data ||
    typeof payload.data !== "object"
  ) {
    console.warn("[site-seo] public site settings response was unsuccessful", {
      endpoint: "/api/v1/site-settings",
    });
    return null;
  }

  if (!payload.data.seo || typeof payload.data.seo !== "object") {
    console.warn("[site-seo] public site settings response has no SEO group", {
      endpoint: "/api/v1/site-settings",
    });
    return null;
  }

  return payload.data.seo ?? null;
}

function resolveShareImage(
  value: unknown,
  siteUrl: URL
): URL | null {
  const image = getTrimmedText(value);
  if (!image || image === LEGACY_DEFAULT_SHARE_IMAGE) return null;

  try {
    const isBackendStoragePath = /^\/?storage\//i.test(image);
    const base = isBackendStoragePath ? getApiOrigin() : siteUrl;
    const resolved = image.startsWith("//")
      ? new URL(`${siteUrl.protocol}${image}`)
      : new URL(image, base);

    if (
      resolved.protocol !== "https:" ||
      resolved.username.length > 0 ||
      resolved.password.length > 0
    ) {
      return null;
    }

    if (
      resolved.hostname === "res.cloudinary.com" &&
      resolved.pathname.includes("/image/upload/")
    ) {
      resolved.pathname = resolved.pathname.replace(
        "/image/upload/",
        "/image/upload/c_fill,w_1200,h_630,g_auto,f_jpg,q_auto/"
      );
    }

    return resolved;
  } catch {
    return null;
  }
}

function getImageType(image: URL): string {
  if (image.hostname === "res.cloudinary.com") return "image/jpeg";
  if (image.pathname.toLowerCase().endsWith(".png")) return "image/png";
  if (image.pathname.toLowerCase().endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export async function generateHomePageMetadata(): Promise<Metadata> {
  const settings = await fetchPublicSeoSettings();
  const siteUrl = getSiteMetadataBase();
  const title = getTrimmedText(settings?.site_title_en) || DEFAULT_SOCIAL_TITLE;
  const description =
    getTrimmedText(settings?.meta_description_en) ||
    DEFAULT_SOCIAL_DESCRIPTION;
  const configuredImage = getTrimmedText(settings?.og_image);
  const resolvedImage = resolveShareImage(configuredImage, siteUrl);

  if (
    configuredImage &&
    configuredImage !== LEGACY_DEFAULT_SHARE_IMAGE &&
    !resolvedImage
  ) {
    console.warn(
      "[site-seo] configured SEO share image is not a public HTTPS image; using the static fallback."
    );
  }

  const image =
    resolvedImage ?? new URL(DEFAULT_OG_IMAGE_PATH, siteUrl);
  const imageUrl = image.toString();

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: siteUrl.toString(),
    },
    openGraph: {
      siteName: "Afiya Shope",
      title,
      description,
      url: siteUrl.toString(),
      type: "website",
      locale: "en_KH",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          type: getImageType(image),
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: imageUrl,
          alt: title,
        },
      ],
    },
  };
}
