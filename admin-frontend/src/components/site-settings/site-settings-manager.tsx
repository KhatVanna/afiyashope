"use client";

import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Check,
  GripVertical,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  type HTMLInputTypeAttribute,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuthStore } from "@/stores/auth-store";
import {
  detectMediaType,
  getMediaLinkError,
  MediaInput,
} from "@/components/site-settings/media-input";
import {
  createSiteBanner,
  deleteSiteBanner,
  loadSiteBanners,
  loadSiteSettings,
  reorderSiteBanners,
  saveSiteSettings,
  updateSiteBanner,
  uploadSiteMedia,
  SiteSettingsRequestError,
  type SiteBanner,
  type SiteBannerPayload,
  type SiteMediaKind,
  type SiteSettingsData,
  type SettingsGroup,
} from "@/lib/site-settings-api";

type SettingsTab = "banners" | SettingsGroup;

const TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: "banners", label: "Banners" },
  { id: "branding", label: "Branding" },
  { id: "contact", label: "Contact & Social" },
  { id: "footer", label: "Footer" },
  { id: "seo", label: "SEO" },
];

const EMPTY_SETTINGS: SiteSettingsData = {
  branding: {
    logo_light: "",
    logo_dark: "",
    favicon: "",
    primary_color: "#21A8D8",
    secondary_color: "#F9318D",
  },
  contact: {
    phone: "",
    whatsapp_url: "",
    email: "",
    address_km: "",
    address_en: "",
    map_url: "",
    facebook_url: "",
    instagram_url: "",
    tiktok_url: "",
    telegram_url: "",
    business_hours_km: "",
    business_hours_en: "",
  },
  footer: {
    about_km: "",
    about_en: "",
    quick_links: [],
    policy_links: {
      privacy: "",
      returns: "",
      shipping: "",
      terms: "",
    },
    payment_methods: {
      aba: false,
      acleda: false,
      wing: false,
      khqr: false,
      cash_on_delivery: false,
    },
    copyright_km: "",
    copyright_en: "",
  },
  seo: {
    site_title_km: "",
    site_title_en: "",
    meta_description_km: "",
    meta_description_en: "",
    og_image: "",
    keywords: [],
    google_analytics_id: "",
  },
};

const EMPTY_BANNER: SiteBanner = {
  id: null,
  media_type: "image",
  media_url: "",
  mobile_media_url: null,
  poster_url: null,
  eyebrow_km: "",
  eyebrow_en: "",
  headline_km: "",
  headline_en: "",
  subtitle_km: "",
  subtitle_en: "",
  button_text_km: "",
  button_text_en: "",
  button_url: "",
  text_align: "left",
  overlay_opacity: 40,
  is_active: true,
  sort_order: 0,
  starts_at: null,
  ends_at: null,
};

const FIELD_CLASS =
  "mt-1.5 block w-full rounded-xl border border-[#d6e8f2] bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0077b6] focus:ring-2 focus:ring-[#0077b6]/15";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function dateTimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function toApiDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function emptyBanner(): SiteBanner {
  return { ...EMPTY_BANNER };
}

export function SiteSettingsManager() {
  const user = useAuthStore((state) => state.user);
  const canManage = useMemo(
    () =>
      user?.roles?.some((role) =>
        ["admin", "super-admin"].includes(role.slug)
      ) ?? false,
    [user]
  );
  const [tab, setTab] = useState<SettingsTab>("banners");
  const [settings, setSettings] = useState<SiteSettingsData>(EMPTY_SETTINGS);
  const [savedSettings, setSavedSettings] =
    useState<SiteSettingsData>(EMPTY_SETTINGS);
  const [banners, setBanners] = useState<SiteBanner[]>([]);
  const [savedBanners, setSavedBanners] = useState<SiteBanner[]>([]);
  const [selectedBanner, setSelectedBanner] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bannerFieldErrors, setBannerFieldErrors] = useState<Record<string, string>>({});
  const [bannerErrorIndex, setBannerErrorIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextSettings, nextBanners] = await Promise.all([
        loadSiteSettings(),
        loadSiteBanners(),
      ]);
      setSettings(nextSettings);
      setSavedSettings(clone(nextSettings));
      setBanners(nextBanners);
      setSavedBanners(clone(nextBanners));
      setSelectedBanner(0);
    } catch (loadError) {
      setError(
        `${errorMessage(loadError, "Unable to load site settings.")} If the site settings tables are not installed locally, run the approved local migration and seed first.`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManage) {
      void Promise.resolve().then(load);
    }
  }, [canManage, load]);

  const dirty =
    tab === "banners"
      ? JSON.stringify(banners) !== JSON.stringify(savedBanners)
      : JSON.stringify(settings[tab]) !== JSON.stringify(savedSettings[tab]);
  const hasUnsavedChanges =
    JSON.stringify(settings) !== JSON.stringify(savedSettings) ||
    JSON.stringify(banners) !== JSON.stringify(savedBanners);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function updateField<
    K extends SettingsGroup,
    F extends keyof SiteSettingsData[K],
  >(
    group: K,
    field: F,
    value: SiteSettingsData[K][F]
  ) {
    setSettings((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [field]: value,
      },
    }));
    setNotice(null);
  }

  function updateBanner(index: number, patch: Partial<SiteBanner>) {
    setBanners((current) =>
      current.map((banner, currentIndex) =>
        currentIndex === index ? { ...banner, ...patch } : banner
      )
    );
    setBannerFieldErrors((current) => {
      const next = { ...current };
      for (const field of Object.keys(patch)) delete next[field];
      if ("headline_km" in patch || "headline_en" in patch) {
        delete next.headline_km;
        delete next.headline_en;
      }
      return next;
    });
    setNotice(null);
  }

  async function handleUpload(
    file: File,
    kind: SiteMediaKind,
    key: string,
    onUploaded: (url: string) => void
  ) {
    const acceptedExtensions: Record<SiteMediaKind, string[]> = {
      logo: ["jpg", "jpeg", "png", "webp", "svg"],
      favicon: ["jpg", "jpeg", "png", "webp"],
      banner_image: ["jpg", "jpeg", "png", "webp"],
      banner_video: ["mp4", "webm"],
      poster: ["jpg", "jpeg", "png", "webp"],
    };
    const acceptedMimeTypes: Record<SiteMediaKind, string[]> = {
      logo: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
      favicon: ["image/jpeg", "image/png", "image/webp"],
      banner_image: ["image/jpeg", "image/png", "image/webp"],
      banner_video: ["video/mp4", "video/webm"],
      poster: ["image/jpeg", "image/png", "image/webp"],
    };
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const maxBytes = kind === "banner_video" ? 15 * 1024 * 1024 : 5 * 1024 * 1024;
    if (
      !acceptedExtensions[kind].includes(extension) ||
      (file.type !== "" && !acceptedMimeTypes[kind].includes(file.type))
    ) {
      setError(
        kind === "logo"
          ? "Choose a JPG, PNG, WebP, or SVG logo."
          : kind === "banner_video"
            ? "Choose an MP4 or WebM video."
            : "Choose a JPG, PNG, or WebP image."
      );
      return;
    }
    if (file.size > maxBytes) {
      setError(
        kind === "banner_video"
          ? "Video files must be 15 MB or smaller."
          : "Image files must be 5 MB or smaller."
      );
      return;
    }

    setUploading(key);
    setError(null);
    try {
      const result = await uploadSiteMedia(file, kind);
      onUploaded(result.url);
      setNotice("Media uploaded. Save this tab to apply it to the storefront.");
    } catch (uploadError) {
      setError(errorMessage(uploadError, "Unable to upload this media file."));
    } finally {
      setUploading(null);
    }
  }

  async function saveCurrentTab() {
    setSaving(true);
    setError(null);
    setBannerFieldErrors({});
    setNotice(null);
    try {
      if (tab === "banners") {
        for (const [index, banner] of banners.entries()) {
          const errors: Record<string, string> = {};
          const mediaError = banner.media_url
            ? getMediaLinkError(banner.media_url)
            : "Add a media file or direct HTTPS link before saving.";
          if (mediaError) errors.media_url = mediaError;

          const original = savedBanners[index];
          for (const [field, value, previous] of [
            ["mobile_media_url", banner.mobile_media_url, original?.mobile_media_url],
            ["poster_url", banner.poster_url, original?.poster_url],
          ] as const) {
            if (!value) continue;
            if (/^(blob:|data:)/i.test(value)) {
              errors[field] = "Temporary browser media URLs cannot be saved. Upload the file or use a direct HTTPS link.";
            } else if (value !== previous && getMediaLinkError(value)) {
              errors[field] = getMediaLinkError(value) ?? "Use a direct HTTPS media link.";
            }
          }
          if (/^(blob:|data:)/i.test(banner.button_url)) {
            errors.button_url = "Temporary browser URLs cannot be used as a button link.";
          }
          if (Object.keys(errors).length > 0) {
            setSelectedBanner(index);
            setBannerErrorIndex(index);
            setBannerFieldErrors(errors);
            return;
          }
        }

        const saved = [...banners];
        for (const [index, banner] of banners.entries()) {
          setBannerErrorIndex(index);
          setSelectedBanner(index);
          const {
            id,
            media_type: _mediaType,
            starts_at: startsAt,
            ends_at: endsAt,
            ...fields
          } = banner;
          void _mediaType;
          const payload: SiteBannerPayload = {
            ...fields,
            sort_order: index,
            starts_at: toApiDate(startsAt),
            ends_at: toApiDate(endsAt),
          };
          saved[index] =
            id === null
              ? await createSiteBanner(payload)
              : await updateSiteBanner(id, payload);
          setBanners([...saved]);
          setSavedBanners((current) => {
            const next = [...current];
            next[index] = saved[index];
            return next;
          });
        }
        if (saved.length > 0 && saved.every((banner) => banner.id !== null)) {
          await reorderSiteBanners(
            saved.flatMap((banner) => (banner.id === null ? [] : [banner.id]))
          );
        }
        setBanners(saved);
        setSavedBanners(clone(saved));
        setBannerFieldErrors({});
      } else {
        switch (tab) {
          case "branding":
            await saveSiteSettings("branding", settings.branding);
            break;
          case "contact":
            await saveSiteSettings("contact", settings.contact);
            break;
          case "footer":
            await saveSiteSettings("footer", settings.footer);
            break;
          case "seo":
            await saveSiteSettings("seo", settings.seo);
            break;
        }
        switch (tab) {
          case "branding":
            setSavedSettings((current) => ({
              ...current,
              branding: clone(settings.branding),
            }));
            break;
          case "contact":
            setSavedSettings((current) => ({
              ...current,
              contact: clone(settings.contact),
            }));
            break;
          case "footer":
            setSavedSettings((current) => ({
              ...current,
              footer: clone(settings.footer),
            }));
            break;
          case "seo":
            setSavedSettings((current) => ({
              ...current,
              seo: clone(settings.seo),
            }));
            break;
        }
      }
      setNotice("Site settings saved.");
    } catch (saveError) {
      if (tab === "banners" && saveError instanceof SiteSettingsRequestError) {
        setBannerFieldErrors(saveError.fieldErrors);
        if (Object.keys(saveError.fieldErrors).length === 0) {
          setError(
            `The banner save was rejected with HTTP ${saveError.status}, but the API returned no field details.`
          );
        }
      } else {
        setError(errorMessage(saveError, "Unable to save site settings."));
      }
    } finally {
      setSaving(false);
    }
  }

  function discardBanners() {
    setBanners(clone(savedBanners));
    setSelectedBanner(0);
    setBannerFieldErrors({});
    setBannerErrorIndex(null);
    setError(null);
    setNotice(null);
  }

  async function removeBanner(index: number) {
    const banner = banners[index];
    if (!banner) return;
    if (
      banner.id !== null &&
      !window.confirm("Delete this banner? Its uploaded media will be kept.")
    ) {
      return;
    }
    setError(null);
    if (banner.id !== null) {
      try {
        await deleteSiteBanner(banner.id);
        setSavedBanners((current) =>
          current.filter((saved) => saved.id !== banner.id)
        );
      } catch (deleteError) {
        setError(errorMessage(deleteError, "Unable to delete this banner."));
        return;
      }
    }
    setBanners((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setSelectedBanner((current) => Math.max(0, Math.min(current, banners.length - 2)));
    setNotice(banner.id === null ? null : "Banner deleted. Uploaded media was kept.");
  }

  function moveBanner(from: number, to: number) {
    if (to < 0 || to >= banners.length || from === to) return;
    setBanners((current) => {
      const next = [...current];
      const [moving] = next.splice(from, 1);
      next.splice(to, 0, moving);
      return next.map((banner, index) => ({ ...banner, sort_order: index }));
    });
    setSelectedBanner(to);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = TABS.findIndex((item) => item.id === tab);
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? TABS.length - 1
          : (currentIndex + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) %
            TABS.length;
    const nextTab = TABS[nextIndex]?.id;
    if (nextTab) {
      setTab(nextTab);
      document.getElementById(`site-settings-tab-${nextTab}`)?.focus();
    }
  }

  if (!canManage) {
    return (
      <section className="rounded-2xl border border-white bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-800">Site Settings</h1>
        <p className="mt-2 text-sm text-slate-500">
          Only Admin and Super Admin roles can manage site settings.
        </p>
      </section>
    );
  }

  const activeBanner = banners[selectedBanner];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0077b6]">
            Storefront controls
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-800">
            Site Settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Manage the banners, branding, contact details, footer, and SEO shown
            on the public store.
          </p>
        </div>
        {tab !== "banners" ? (
          <button
            type="button"
            onClick={() => void saveCurrentTab()}
            disabled={loading || saving || uploading !== null || !dirty}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0077b6] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-700/20 transition hover:bg-[#005d92] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {saving ? "Saving..." : "Save changes"}
          </button>
        ) : null}
      </header>

      {notice ? (
        <p
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-xl border border-[#beeafa] bg-[#e2f5fc] px-4 py-3 text-sm text-[#075985]"
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
          {notice}
        </p>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-[#ffd5c8] bg-[#fdede8] px-4 py-3 text-sm text-[#9a3412]"
        >
          <p>{error}</p>
          {loading ? null : (
            <button
              type="button"
              onClick={() => void load()}
              className="shrink-0 font-semibold underline underline-offset-2"
            >
              Retry
            </button>
          )}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#dcecf4] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div
          role="tablist"
          aria-label="Site settings sections"
          onKeyDown={onTabKeyDown}
          className="flex gap-1 overflow-x-auto border-b border-[#e2edf4] px-3 pt-3 sm:px-5"
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              id={`site-settings-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              aria-controls="site-settings-panel"
              tabIndex={tab === item.id ? 0 : -1}
              onClick={() => setTab(item.id)}
              className={`min-h-11 shrink-0 rounded-t-xl border-b-2 px-4 text-sm font-semibold transition ${
                tab === item.id
                  ? "border-[#0077b6] bg-[#f1f9fd] text-[#00679e]"
                  : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              {item.label}
              {item.id === tab && dirty ? (
                <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-amber-500 align-middle" />
              ) : null}
            </button>
          ))}
        </div>

        <section
          id="site-settings-panel"
          role="tabpanel"
          aria-labelledby={`site-settings-tab-${tab}`}
          className="min-h-96 p-4 sm:p-6"
        >
          {loading ? (
            <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading site settings...
            </div>
          ) : error && banners.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              Site settings are unavailable until the API responds.
            </p>
          ) : tab === "banners" ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">
                    Hero banners
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Reorder, schedule, and preview the storefront hero banners.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBanners((current) => [...current, emptyBanner()]);
                    setSelectedBanner(banners.length);
                    setBannerFieldErrors({});
                    setBannerErrorIndex(null);
                  }}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#b8d9eb] px-3 py-2 text-sm font-semibold text-[#0077b6] transition hover:bg-[#f1f9fd]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add banner
                </button>
              </div>
              {Object.keys(bannerFieldErrors).length > 0 ? (
                <BannerValidationSummary
                  errors={bannerFieldErrors}
                  bannerNumber={
                    bannerErrorIndex === null ? null : bannerErrorIndex + 1
                  }
                />
              ) : null}
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.8fr)]">
                <div className="space-y-5">
                  <BannerList
                    banners={banners}
                    selectedIndex={selectedBanner}
                    draggedIndex={draggedIndex}
                    onSelect={setSelectedBanner}
                    onDragStart={setDraggedIndex}
                    onDrop={(index) => {
                      if (draggedIndex !== null) moveBanner(draggedIndex, index);
                      setDraggedIndex(null);
                    }}
                    onDragEnd={() => setDraggedIndex(null)}
                  />
                  {activeBanner ? (
                    <BannerEditor
                      banner={activeBanner}
                      index={selectedBanner}
                      bannerCount={banners.length}
                      uploading={uploading}
                      fieldErrors={
                        bannerErrorIndex === selectedBanner
                          ? bannerFieldErrors
                          : {}
                      }
                      onChange={(patch) => updateBanner(selectedBanner, patch)}
                      onMove={(to) => moveBanner(selectedBanner, to)}
                      onRemove={() => void removeBanner(selectedBanner)}
                      onUpload={(file, kind, key, onUploaded) =>
                        void handleUpload(file, kind, key, onUploaded)
                      }
                    />
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#cbdde8] p-8 text-center text-sm text-slate-500">
                      No banners yet. Add one to configure the storefront hero.
                    </div>
                  )}
                </div>
                {activeBanner ? <BannerPreview banner={activeBanner} /> : null}
              </div>
            </div>
          ) : (
            <SettingsEditor
              tab={tab}
              settings={settings}
              uploading={uploading}
              onChange={updateField}
              onUpload={(file, kind, key, onUploaded) =>
                void handleUpload(file, kind, key, onUploaded)
              }
            />
          )}
        </section>

        {!loading && hasUnsavedChanges && tab !== "banners" ? (
          <div
            role="status"
            className="border-t border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:px-6"
          >
            You have unsaved changes. Use Save changes in each edited section
            before leaving the page.
          </div>
        ) : null}
      </div>
      {!loading && tab === "banners" && dirty ? (
        <div
          role="status"
          className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/95 px-4 py-3 shadow-lg backdrop-blur"
        >
          <span className="text-sm font-semibold text-amber-900">
            Unsaved changes
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={discardBanners}
              disabled={saving || uploading !== null}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#b8d9eb] bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Discard
            </button>
            <button
              type="button"
              onClick={() => void saveCurrentTab()}
              disabled={saving || uploading !== null}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#0077b6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#005d92] disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {saving ? "Saving..." : "Save banners"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SettingsEditor({
  tab,
  settings,
  uploading,
  onChange,
  onUpload,
}: {
  tab: Exclude<SettingsTab, "banners">;
  settings: SiteSettingsData;
  uploading: string | null;
  onChange: <K extends SettingsGroup, F extends keyof SiteSettingsData[K]>(
    group: K,
    field: F,
    value: SiteSettingsData[K][F]
  ) => void;
  onUpload: (
    file: File,
    kind: SiteMediaKind,
    key: string,
    onUploaded: (url: string) => void
  ) => void;
}) {
  if (tab === "branding") {
    const branding = settings.branding;
    return (
      <div className="space-y-6">
        <SectionHeading
          title="Branding"
          description="Choose storefront logos, favicon, and brand colors."
        />
        <div className="grid gap-5 md:grid-cols-2">
          <MediaPicker
            id="branding-logo-light"
            label="Light logo"
            value={branding.logo_light}
            kind="logo"
            uploading={uploading === "branding-logo-light"}
            onChange={(value) => onChange("branding", "logo_light", value)}
            onUpload={onUpload}
          />
          <MediaPicker
            id="branding-logo-dark"
            label="Dark logo (optional)"
            value={branding.logo_dark}
            kind="logo"
            uploading={uploading === "branding-logo-dark"}
            onChange={(value) => onChange("branding", "logo_dark", value)}
            onUpload={onUpload}
          />
          <MediaPicker
            id="branding-favicon"
            label="Favicon"
            value={branding.favicon}
            kind="favicon"
            uploading={uploading === "branding-favicon"}
            onChange={(value) => onChange("branding", "favicon", value)}
            onUpload={onUpload}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField
              label="Primary color"
              value={branding.primary_color}
              onChange={(value) =>
                onChange("branding", "primary_color", value)
              }
            />
            <ColorField
              label="Secondary color"
              value={branding.secondary_color}
              onChange={(value) =>
                onChange("branding", "secondary_color", value)
              }
            />
          </div>
        </div>
        <p className="rounded-xl bg-[#f1f9fd] p-3 text-xs leading-relaxed text-slate-500">
          Brand colors are saved for later use; they will only affect storefront
          areas that already support theming.
        </p>
      </div>
    );
  }

  if (tab === "contact") {
    const contact = settings.contact;
    return (
      <div className="space-y-6">
        <SectionHeading
          title="Contact & Social"
          description="Manage the contact details and social profiles shown to customers."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Phone" value={contact.phone} onChange={(value) => onChange("contact", "phone", value)} />
          <TextField label="Email" type="email" value={contact.email} onChange={(value) => onChange("contact", "email", value)} />
          <TextField label="WhatsApp link" type="url" value={contact.whatsapp_url} onChange={(value) => onChange("contact", "whatsapp_url", value)} />
          <TextField label="Google Maps link" type="url" value={contact.map_url} onChange={(value) => onChange("contact", "map_url", value)} />
          <TextField label="Facebook page URL" type="url" value={contact.facebook_url} onChange={(value) => onChange("contact", "facebook_url", value)} />
          <TextField label="Instagram URL" type="url" value={contact.instagram_url} onChange={(value) => onChange("contact", "instagram_url", value)} />
          <TextField label="TikTok URL" type="url" value={contact.tiktok_url} onChange={(value) => onChange("contact", "tiktok_url", value)} />
          <TextField label="Telegram channel URL" type="url" value={contact.telegram_url} onChange={(value) => onChange("contact", "telegram_url", value)} />
          <TextAreaField label="Address (Khmer)" value={contact.address_km} onChange={(value) => onChange("contact", "address_km", value)} />
          <TextAreaField label="Address (English)" value={contact.address_en} onChange={(value) => onChange("contact", "address_en", value)} />
          <TextAreaField label="Business hours (Khmer)" value={contact.business_hours_km} onChange={(value) => onChange("contact", "business_hours_km", value)} />
          <TextAreaField label="Business hours (English)" value={contact.business_hours_en} onChange={(value) => onChange("contact", "business_hours_en", value)} />
        </div>
      </div>
    );
  }

  if (tab === "footer") {
    const footer = settings.footer;
    const paymentMethods = [
      ["aba", "ABA"],
      ["acleda", "ACLEDA"],
      ["wing", "Wing"],
      ["khqr", "KHQR"],
      ["cash_on_delivery", "Cash on delivery"],
    ] as const;
    return (
      <div className="space-y-6">
        <SectionHeading
          title="Footer"
          description="Edit the about text, link groups, payment options, and copyright."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <TextAreaField label="About text (Khmer)" value={footer.about_km} onChange={(value) => onChange("footer", "about_km", value)} />
          <TextAreaField label="About text (English)" value={footer.about_en} onChange={(value) => onChange("footer", "about_en", value)} />
        </div>
        <section className="space-y-3 rounded-xl border border-[#e2edf4] p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-800">Quick links</h3>
            <button
              type="button"
              onClick={() =>
                onChange("footer", "quick_links", [
                  ...footer.quick_links,
                  { label_km: "", label_en: "", url: "" },
                ])
              }
              className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-[#0077b6] hover:bg-[#f1f9fd]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add link
            </button>
          </div>
          {footer.quick_links.map((link, index) => (
            <div key={`${index}-${link.url}`} className="grid gap-3 rounded-lg bg-[#f7fbfd] p-3 md:grid-cols-[1fr_1fr_1.2fr_auto]">
              <TextField id={`footer-link-${index}-km`} label="Label (Khmer)" value={link.label_km} onChange={(value) => onChange("footer", "quick_links", footer.quick_links.map((item, i) => i === index ? { ...item, label_km: value } : item))} />
              <TextField id={`footer-link-${index}-en`} label="Label (English)" value={link.label_en} onChange={(value) => onChange("footer", "quick_links", footer.quick_links.map((item, i) => i === index ? { ...item, label_en: value } : item))} />
              <TextField id={`footer-link-${index}-url`} label="URL" value={link.url} onChange={(value) => onChange("footer", "quick_links", footer.quick_links.map((item, i) => i === index ? { ...item, url: value } : item))} />
              <div className="flex items-end gap-1 pb-1">
                <button type="button" aria-label={`Move quick link ${index + 1} up`} disabled={index === 0} onClick={() => onChange("footer", "quick_links", moveItem(footer.quick_links, index, index - 1))} className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" aria-label={`Move quick link ${index + 1} down`} disabled={index === footer.quick_links.length - 1} onClick={() => onChange("footer", "quick_links", moveItem(footer.quick_links, index, index + 1))} className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:opacity-40"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" aria-label={`Remove quick link ${index + 1}`} onClick={() => onChange("footer", "quick_links", footer.quick_links.filter((_, i) => i !== index))} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </section>
        <section className="space-y-4 rounded-xl border border-[#e2edf4] p-4">
          <h3 className="font-semibold text-slate-800">Policy links</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {(["privacy", "returns", "shipping", "terms"] as const).map((key) => (
              <TextField key={key} label={policyLabel(key)} value={footer.policy_links[key]} onChange={(value) => onChange("footer", "policy_links", { ...footer.policy_links, [key]: value })} />
            ))}
          </div>
        </section>
        <section className="space-y-3 rounded-xl border border-[#e2edf4] p-4">
          <h3 className="font-semibold text-slate-800">Payment methods</h3>
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map(([key, label]) => (
              <label key={key} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#d6e8f2] px-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={footer.payment_methods[key]}
                  onChange={(event) => onChange("footer", "payment_methods", { ...footer.payment_methods, [key]: event.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#0077b6] focus:ring-[#0077b6]"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-500">The storefront uses its bundled local payment icons.</p>
        </section>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Copyright (Khmer)" value={footer.copyright_km} onChange={(value) => onChange("footer", "copyright_km", value)} />
          <TextField label="Copyright (English)" value={footer.copyright_en} onChange={(value) => onChange("footer", "copyright_en", value)} />
        </div>
      </div>
    );
  }

  const seo = settings.seo;
  return (
    <div className="space-y-6">
      <SectionHeading
        title="SEO"
        description="Set page metadata and social sharing defaults."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Site title (Khmer)" value={seo.site_title_km} onChange={(value) => onChange("seo", "site_title_km", value)} />
        <TextField label="Site title (English)" value={seo.site_title_en} onChange={(value) => onChange("seo", "site_title_en", value)} />
        <TextAreaField label="Meta description (Khmer)" value={seo.meta_description_km} onChange={(value) => onChange("seo", "meta_description_km", value)} />
        <TextAreaField label="Meta description (English)" value={seo.meta_description_en} onChange={(value) => onChange("seo", "meta_description_en", value)} />
        <div className="md:col-span-2">
          <MediaPicker
            id="seo-og-image"
            label="Default share image (Open Graph)"
            value={seo.og_image}
            kind="banner_image"
            uploading={uploading === "seo-og-image"}
            onChange={(value) => onChange("seo", "og_image", value)}
            onUpload={onUpload}
          />
        </div>
        <TextField
          label="Keywords (comma-separated)"
          hint="Optional; up to 30 keywords."
          value={seo.keywords.join(", ")}
          onChange={(value) =>
            onChange(
              "seo",
              "keywords",
              value.split(",").map((keyword) => keyword.trim()).filter(Boolean)
            )
          }
        />
        <TextField
          label="Google Analytics ID"
          hint="Optional GA4 format, for example G-ABC1234567."
          value={seo.google_analytics_id}
          onChange={(value) => onChange("seo", "google_analytics_id", value)}
        />
      </div>
    </div>
  );
}

function BannerList({
  banners,
  selectedIndex,
  draggedIndex,
  onSelect,
  onDragStart,
  onDrop,
  onDragEnd,
}: {
  banners: SiteBanner[];
  selectedIndex: number;
  draggedIndex: number | null;
  onSelect: (index: number) => void;
  onDragStart: (index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
}) {
  if (banners.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#cbdde8] p-5 text-sm text-slate-500">
        No banners have been created.
      </p>
    );
  }

  return (
    <ul className="space-y-2" aria-label="Banner order">
      {banners.map((banner, index) => (
        <li
          key={banner.id ?? `new-${index}`}
          draggable
          onDragStart={(event: DragEvent<HTMLLIElement>) => {
            event.dataTransfer.effectAllowed = "move";
            onDragStart(index);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onDrop(index);
          }}
          onDragEnd={onDragEnd}
          className={`rounded-xl border transition ${
            draggedIndex === index
              ? "border-[#0077b6] opacity-60"
              : selectedIndex === index
                ? "border-[#0077b6] bg-[#f1f9fd]"
                : "border-[#e2edf4] bg-white"
          }`}
        >
          <div className="flex items-center gap-2 p-2.5">
            <GripVertical
              className="h-4 w-4 shrink-0 cursor-grab text-slate-400"
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => onSelect(index)}
              className="min-w-0 flex-1 text-left"
            >
              <span className="block truncate text-sm font-semibold text-slate-800">
                {banner.headline_en || banner.headline_km || `Banner ${index + 1}`}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {banner.media_type === "video" ? "Video" : "Image"} ·{" "}
                {banner.is_active ? "Active" : "Inactive"}
              </span>
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function BannerEditor({
  banner,
  index,
  bannerCount,
  uploading,
  fieldErrors,
  onChange,
  onMove,
  onRemove,
  onUpload,
}: {
  banner: SiteBanner;
  index: number;
  bannerCount: number;
  uploading: string | null;
  fieldErrors: Record<string, string>;
  onChange: (patch: Partial<SiteBanner>) => void;
  onMove: (to: number) => void;
  onRemove: () => void;
  onUpload: (
    file: File,
    kind: SiteMediaKind,
    key: string,
    onUploaded: (url: string) => void
  ) => void;
}) {
  const prefix = `banner-${banner.id ?? `new-${index}`}`;
  const detectedType = detectMediaType(banner.media_url);

  return (
    <section className="space-y-5 rounded-2xl border border-[#e2edf4] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-800">
          {banner.headline_en || banner.headline_km || `Banner ${index + 1}`}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#d6e8f2] px-2.5 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={banner.is_active}
              onChange={(event) => onChange({ is_active: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-[#0077b6] focus:ring-[#0077b6]"
            />
            Active
          </label>
          <button
            type="button"
            aria-label={`Move banner ${index + 1} up`}
            disabled={index === 0}
            onClick={() => onMove(index - 1)}
            className="rounded-lg border border-[#d6e8f2] p-2 text-slate-600 hover:bg-[#f1f9fd] disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Move banner ${index + 1} down`}
            disabled={index === bannerCount - 1}
            onClick={() => onMove(index + 1)}
            className="rounded-lg border border-[#d6e8f2] p-2 text-slate-600 hover:bg-[#f1f9fd] disabled:opacity-40"
          >
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Delete banner ${index + 1}`}
            onClick={onRemove}
            className="rounded-lg border border-rose-100 p-2 text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <MediaInput
        id={`${prefix}-media`}
        label="Media"
        value={banner.media_url}
        uploading={uploading === `${prefix}-media`}
        error={fieldErrors.media_url}
        onChange={(value) =>
          onChange({
            media_url: value,
            media_type: detectMediaType(value) ?? banner.media_type,
            poster_url:
              detectMediaType(value) === "video" ? banner.poster_url : null,
          })
        }
        onUpload={onUpload}
      />

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-800">Text</h4>
          <p className="mt-1 text-xs text-slate-500">
            Add a headline in Khmer or English; one language is enough.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-xl bg-[#f7fbfd] p-3">
            <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Khmer</h5>
            <TextField id={`${prefix}-headline-km`} label="Headline" value={banner.headline_km} error={fieldErrors.headline_km} onChange={(value) => onChange({ headline_km: value })} />
            <TextAreaField id={`${prefix}-subtitle-km`} label="Subtitle" value={banner.subtitle_km} error={fieldErrors.subtitle_km} onChange={(value) => onChange({ subtitle_km: value })} />
            <TextField id={`${prefix}-button-text-km`} label="Button text" value={banner.button_text_km} error={fieldErrors.button_text_km} onChange={(value) => onChange({ button_text_km: value })} />
          </div>
          <div className="space-y-3 rounded-xl bg-[#f7fbfd] p-3">
            <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">English</h5>
            <TextField id={`${prefix}-headline-en`} label="Headline" value={banner.headline_en} error={fieldErrors.headline_en} onChange={(value) => onChange({ headline_en: value })} />
            <TextAreaField id={`${prefix}-subtitle-en`} label="Subtitle" value={banner.subtitle_en} error={fieldErrors.subtitle_en} onChange={(value) => onChange({ subtitle_en: value })} />
            <TextField id={`${prefix}-button-text-en`} label="Button text" value={banner.button_text_en} error={fieldErrors.button_text_en} onChange={(value) => onChange({ button_text_en: value })} />
          </div>
          <TextField
            label="Button URL (HTTPS or /relative-path)"
            value={banner.button_url}
            error={fieldErrors.button_url}
            onChange={(value) => onChange({ button_url: value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-slate-700">Text alignment</span>
        <div role="group" aria-label="Banner text alignment" className="inline-flex rounded-lg bg-slate-100 p-1">
          {(["left", "center", "right"] as const).map((alignment) => (
            <button
              key={alignment}
              type="button"
              aria-pressed={banner.text_align === alignment}
              onClick={() => onChange({ text_align: alignment })}
              className={`min-h-9 rounded-md px-3 text-sm font-medium capitalize ${
                banner.text_align === alignment
                  ? "bg-white text-[#00679e] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {alignment}
            </button>
          ))}
        </div>
      </div>

      <details className="rounded-xl border border-[#e2edf4] p-3">
        <summary className="cursor-pointer select-none text-sm font-semibold text-slate-700">
          More text options
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField label="Eyebrow (Khmer)" value={banner.eyebrow_km} error={fieldErrors.eyebrow_km} onChange={(value) => onChange({ eyebrow_km: value })} />
          <TextField label="Eyebrow (English)" value={banner.eyebrow_en} error={fieldErrors.eyebrow_en} onChange={(value) => onChange({ eyebrow_en: value })} />
        </div>
      </details>

      <details className="rounded-xl border border-[#e2edf4] p-3">
        <summary className="cursor-pointer select-none text-sm font-semibold text-slate-700">
          Advanced options
        </summary>
        <div className="mt-4 space-y-4">
          <MediaInput
            id={`${prefix}-mobile-media`}
            label="Mobile media"
            optional
            value={banner.mobile_media_url}
            uploading={uploading === `${prefix}-mobile-media`}
            error={fieldErrors.mobile_media_url}
            onChange={(value) => onChange({ mobile_media_url: value || null })}
            onUpload={onUpload}
          />
          {detectedType === "video" ? (
            <MediaInput
              id={`${prefix}-poster`}
              label="Poster / fallback image"
              optional
              allowVideo={false}
              imageUploadKind="poster"
              value={banner.poster_url}
              uploading={uploading === `${prefix}-poster`}
              error={fieldErrors.poster_url}
              onChange={(value) => onChange({ poster_url: value || null })}
              onUpload={onUpload}
            />
          ) : null}
          <div>
            <label htmlFor={`${prefix}-overlay`} className="flex items-center justify-between text-sm font-medium text-slate-700">
              <span>Overlay darkness</span>
              <span className="text-xs text-slate-500">{banner.overlay_opacity}%</span>
            </label>
            <input
              id={`${prefix}-overlay`}
              type="range"
              min="0"
              max="80"
              value={banner.overlay_opacity}
              onChange={(event) => onChange({ overlay_opacity: Number(event.target.value) })}
              className="mt-3 w-full accent-[#0077b6]"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Starts at"
              type="datetime-local"
              value={dateTimeLocal(banner.starts_at)}
              error={fieldErrors.starts_at}
              onChange={(value) => onChange({ starts_at: value || null })}
            />
            <TextField
              label="Ends at"
              type="datetime-local"
              value={dateTimeLocal(banner.ends_at)}
              error={fieldErrors.ends_at}
              onChange={(value) => onChange({ ends_at: value || null })}
            />
          </div>
        </div>
      </details>
    </section>
  );
}

function BannerPreview({ banner }: { banner: SiteBanner }) {
  const mobileSrc = banner.mobile_media_url || banner.media_url;
  return (
    <aside className="space-y-4">
      <div>
        <h3 className="font-semibold text-slate-800">Live preview</h3>
        <p className="mt-1 text-xs text-slate-500">
          Preview updates as you edit; it is not published until saved.
        </p>
      </div>
      <PreviewFrame
        title="Desktop"
        banner={banner}
        media={banner.media_url}
        className="aspect-[16/7]"
      />
      <PreviewFrame
        title="Mobile"
        banner={banner}
        media={mobileSrc}
        className="mx-auto aspect-[9/14] max-w-[16rem]"
      />
    </aside>
  );
}

function BannerValidationSummary({
  errors,
  bannerNumber,
}: {
  errors: Record<string, string>;
  bannerNumber: number | null;
}) {
  const fieldLabels: Record<string, string> = {
    media_url: "Media",
    mobile_media_url: "Mobile media",
    poster_url: "Poster image",
    eyebrow_km: "Khmer eyebrow",
    eyebrow_en: "English eyebrow",
    headline_km: "Khmer headline",
    headline_en: "English headline",
    subtitle_km: "Khmer subtitle",
    subtitle_en: "English subtitle",
    button_text_km: "Khmer button text",
    button_text_en: "English button text",
    button_url: "Button URL",
    text_align: "Text alignment",
    overlay_opacity: "Overlay darkness",
    starts_at: "Starts at",
    ends_at: "Ends at",
  };
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p className="font-semibold">
        Please fix these banner fields{bannerNumber ? ` (banner ${bannerNumber})` : ""}:
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1">
        {Object.entries(errors).map(([field, message]) => (
          <li key={field}>
            <span className="font-medium">{fieldLabels[field] ?? field}:</span> {message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PreviewFrame({
  title,
  banner,
  media,
  className,
}: {
  title: string;
  banner: SiteBanner;
  media: string;
  className: string;
}) {
  const textAlign =
    banner.text_align === "center"
      ? "items-center text-center"
      : banner.text_align === "right"
        ? "items-end text-right"
        : "items-start text-left";
  const previewType = detectMediaType(media) ?? banner.media_type;
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-slate-500">{title}</p>
      <div className={`relative isolate overflow-hidden rounded-xl border border-[#d6e8f2] bg-slate-200 ${className}`}>
        {media && previewType === "video" ? (
          <video
            src={media}
            poster={banner.poster_url || undefined}
            muted
            loop
            playsInline
            autoPlay
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : media ? (
          <Image
            src={media}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 600px"
            className="object-cover"
          />
        ) : null}
        <div
          className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-transparent"
          style={{ opacity: banner.overlay_opacity / 80 }}
        />
        <div className={`absolute inset-0 flex flex-col justify-center gap-1 p-4 text-white sm:p-6 ${textAlign}`}>
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-100 sm:text-xs">
            {banner.eyebrow_en || banner.eyebrow_km || "New collection"}
          </span>
          <span className="max-w-[90%] text-lg font-bold leading-tight sm:text-2xl">
            {banner.headline_en || banner.headline_km || "Banner headline"}
          </span>
          {banner.subtitle_en || banner.subtitle_km ? (
            <span className="max-w-[90%] text-[10px] text-white/85 sm:text-xs">
              {banner.subtitle_en || banner.subtitle_km}
            </span>
          ) : null}
          {banner.button_text_en || banner.button_text_km ? (
            <span className="mt-1 inline-flex rounded-md bg-[#0077b6] px-2.5 py-1 text-[9px] font-semibold sm:text-xs">
              {banner.button_text_en || banner.button_text_km}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MediaPicker({
  id,
  label,
  value,
  kind,
  required = false,
  uploading,
  onChange,
  onUpload,
}: {
  id: string;
  label: string;
  value: string | null;
  kind: SiteMediaKind;
  required?: boolean;
  uploading: boolean;
  onChange: (value: string) => void;
  onUpload: (
    file: File,
    kind: SiteMediaKind,
    key: string,
    onUploaded: (url: string) => void
  ) => void;
}) {
  const accept =
    kind === "logo"
      ? ".jpg,.jpeg,.png,.webp,.svg"
      : kind === "banner_video"
        ? ".mp4,.webm"
        : ".jpg,.jpeg,.png,.webp";
  const isVideo = kind === "banner_video";

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onUpload(file, kind, id, onChange);
  }

  return (
    <div className="min-w-0 rounded-xl border border-[#e2edf4] bg-[#f7fbfd] p-3">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative mt-2 flex min-h-28 items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#bfd7e5] bg-white">
        {value ? (
          isVideo ? (
            <video
              src={value}
              muted
              playsInline
              controls
              className="max-h-44 w-full object-contain"
            />
          ) : (
            <Image
              src={value}
              alt={`${label} preview`}
              width={280}
              height={160}
              unoptimized
              className="max-h-40 w-auto max-w-full object-contain"
            />
          )
        ) : (
          <span className="px-3 text-center text-xs text-slate-400">
            No media selected
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label
          htmlFor={id}
          className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#b8d9eb] bg-white px-3 py-1.5 text-xs font-semibold text-[#0077b6] hover:bg-[#f1f9fd] ${
            uploading ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {uploading ? "Uploading..." : value ? "Replace media" : "Choose media"}
        </label>
        {value && !required ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="min-h-9 rounded-lg px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
          >
            Remove
          </button>
        ) : null}
        <span className="text-[11px] text-slate-400">
          {isVideo ? "MP4 / WebM · max 15 MB" : "JPG / PNG / WebP · max 5 MB"}
          {kind === "logo" ? " · SVG allowed" : ""}
        </span>
      </div>
      <input
        id={id}
        type="file"
        accept={accept}
        onChange={selectFile}
        disabled={uploading}
        className="sr-only"
        aria-label={`Choose ${label.toLowerCase()}`}
      />
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function TextField({
  id: suppliedId,
  label,
  value,
  onChange,
  type = "text",
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: HTMLInputTypeAttribute;
  hint?: string;
  error?: string;
  id?: string;
}) {
  const id =
    suppliedId ??
    `site-setting-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <label htmlFor={id} className="block min-w-0 text-sm font-medium text-slate-700">
      {label}
      {hint ? <span className="ml-1 font-normal text-slate-400">({hint})</span> : null}
      <input
        id={id}
        type={type}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`${FIELD_CLASS} ${error ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
      />
      {error ? (
        <span id={`${id}-error`} role="alert" className="mt-1 block text-xs font-normal text-red-700">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function TextAreaField({
  id: suppliedId,
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
}) {
  const id =
    suppliedId ??
    `site-setting-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <label htmlFor={id} className="block min-w-0 text-sm font-medium text-slate-700">
      {label}
      <textarea
        id={id}
        rows={3}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`${FIELD_CLASS} resize-y ${error ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
      />
      {error ? (
        <span id={`${id}-error`} role="alert" className="mt-1 block text-xs font-normal text-red-700">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `color-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label htmlFor={id} className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-1.5 flex h-[42px] items-center gap-2 rounded-xl border border-[#d6e8f2] bg-white px-2">
        <input
          id={id}
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#0077b6"}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
          aria-label={label}
        />
        <span className="font-mono text-xs text-slate-600">{value}</span>
      </div>
    </label>
  );
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function policyLabel(key: "privacy" | "returns" | "shipping" | "terms"): string {
  return {
    privacy: "Privacy policy URL",
    returns: "Returns policy URL",
    shipping: "Shipping policy URL",
    terms: "Terms URL",
  }[key];
}
