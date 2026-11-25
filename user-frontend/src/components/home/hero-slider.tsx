"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { siFacebook } from "simple-icons";
import type { PublicSiteBanner } from "@/lib/site-content-api";
import { useRegionLanguage } from "@/stores/region-store";

const FALLBACK_BANNER: PublicSiteBanner = {
  id: 0,
  media_type: "video",
  media_url: "/videos/TVC.mp4",
  mobile_media_url: null,
  poster_url: "/videos/TVC-poster.jpg",
  eyebrow_km: "✨ ម៉ូដថ្មីឆ្នាំ ២០២៦",
  eyebrow_en: "✨ NEW COLLECTION 2026",
  headline_km: "ម៉ូដ Abaya ទាន់សម័យ",
  headline_en: "Elegant Abaya Styles",
  subtitle_km: "សុភាពរាបសារ និងប្រណិតភាព • សាច់ក្រណាត់នាំចូលគុណភាពខ្ពស់",
  subtitle_en: "Modest elegance in premium imported fabrics.",
  button_text_km: "ឆាតសួរព័ត៌មាន FB Page",
  button_text_en: "Chat with us on Facebook",
  button_url: "https://www.facebook.com/share/1E66nep5tC/?mibextid=wwXIfr",
  text_align: "left",
  overlay_opacity: 40,
};

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

function mediaTypeFor(url: string, fallback: PublicSiteBanner["media_type"]) {
  const path = url.split(/[?#]/, 1)[0]?.toLowerCase() ?? "";
  const extension = path.split(".").pop();
  if (extension === "mp4" || extension === "webm") return "video";
  if (["jpg", "jpeg", "png", "webp"].includes(extension ?? "")) return "image";
  return fallback;
}

export function HeroSlider({ banners = [] }: { banners?: PublicSiteBanner[] }) {
  const isKhmer = useRegionLanguage() === "KM";
  const desktopVideoRef = useRef<HTMLVideoElement | null>(null);
  const mobileVideoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [saveData, setSaveData] = useState(false);
  const slides = banners.length > 0 ? banners : [FALLBACK_BANNER];
  const banner = slides[slideIndex % slides.length] ?? FALLBACK_BANNER;
  const hasCarousel = slides.length > 1;
  const mobileMedia = banner.mobile_media_url || banner.media_url;
  const mediaKey = `${banner.id}:${banner.media_url}:${mobileMedia}`;
  const [mediaErrorKey, setMediaErrorKey] = useState<string | null>(null);
  const mediaError = mediaErrorKey === mediaKey;
  const desktopType = mediaTypeFor(banner.media_url, banner.media_type);
  const mobileType = mediaTypeFor(mobileMedia, banner.media_type);
  const allowVideo = playing && !reducedMotion && !saveData && !mediaError;
  const fallbackImage = banner.poster_url || "/videos/TVC-poster.jpg";
  const align =
    banner.text_align === "center"
      ? "items-center text-center"
      : banner.text_align === "right"
        ? "items-end text-right"
        : "items-start text-left";
  const headline = isKhmer ? banner.headline_km : banner.headline_en;
  const eyebrow = isKhmer ? banner.eyebrow_km : banner.eyebrow_en;
  const subtitle = isKhmer ? banner.subtitle_km : banner.subtitle_en;
  const buttonText = isKhmer ? banner.button_text_km : banner.button_text_en;
  const textLanguage = isKhmer ? "km" : "en";
  const buttonUrl = banner.button_url || "";
  const externalButton = /^https:\/\//i.test(buttonUrl);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreferences = () => {
      setReducedMotion(preference.matches);
      setSaveData(
        (navigator as NavigatorWithConnection).connection?.saveData ?? false
      );
    };

    updatePreferences();
    preference.addEventListener("change", updatePreferences);
    return () => preference.removeEventListener("change", updatePreferences);
  }, []);

  useEffect(() => {
    for (const video of [desktopVideoRef.current, mobileVideoRef.current]) {
      if (!video) continue;
      if (allowVideo) {
        void video.play().catch(() => setMediaErrorKey(mediaKey));
      } else {
        video.pause();
      }
    }
  }, [allowVideo, slideIndex, mobileMedia, banner.media_url, mediaKey]);

  useEffect(() => {
    if (!hasCarousel || !playing || reducedMotion || saveData) return;
    const timer = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % slides.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [hasCarousel, playing, reducedMotion, saveData, slides.length]);

  function renderMedia(
    src: string,
    type: "image" | "video",
    ref: RefObject<HTMLVideoElement | null>
  ) {
    const canPlay = type === "video" && allowVideo;
    if (canPlay) {
      return (
        <video
          ref={ref}
          src={src}
          poster={banner.poster_url || undefined}
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
          onError={() => setMediaErrorKey(mediaKey)}
          aria-label={
            isKhmer ? "វីដេអូផ្សព្វផ្សាយរបស់ Afiya Shope" : "Afiya Shope promotional video"
          }
          className="absolute inset-0 h-full w-full object-cover"
        />
      );
    }

    const srcForImage =
      type === "video" || mediaError ? fallbackImage : src;
    return (
      <Image
        src={srcForImage}
        alt=""
        fill
        unoptimized
        sizes="100vw"
        onError={() => setMediaErrorKey(mediaKey)}
        className="object-cover"
      />
    );
  }

  return (
    <section
      aria-roledescription={hasCarousel ? "carousel" : undefined}
      aria-label={isKhmer ? "ផ្ទាំងផ្សព្វផ្សាយចម្បង" : "Storefront hero"}
      className="relative isolate min-h-[28rem] overflow-hidden bg-[#21A8D8] text-white sm:min-h-[32rem] lg:min-h-[36rem]"
    >
      <div className="absolute inset-0 hidden sm:block">
        {renderMedia(banner.media_url, desktopType, desktopVideoRef)}
      </div>
      <div className="absolute inset-0 sm:hidden">
        {renderMedia(mobileMedia, mobileType, mobileVideoRef)}
      </div>
      <div
        className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-transparent"
        style={{ opacity: Math.max(0, Math.min(80, banner.overlay_opacity)) / 80 }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#168DB5]/45 via-transparent to-white/10" />

      <div className={`relative mx-auto flex min-h-[28rem] w-full max-w-7xl flex-col justify-center px-4 py-16 sm:min-h-[32rem] sm:px-6 lg:min-h-[36rem] lg:py-24 ${align}`}>
        {eyebrow ? (
          <p lang={textLanguage} className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
            {eyebrow}
          </p>
        ) : null}
        {headline ? (
          <h1 lang={textLanguage} className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {headline}
          </h1>
        ) : null}
        {subtitle ? (
          <p lang={textLanguage} className="mt-4 max-w-xl text-base text-zinc-200 sm:text-lg">
            {subtitle}
          </p>
        ) : null}
        {buttonText && buttonUrl ? (
          <div className="mt-8">
            <Link
              href={buttonUrl}
              lang={textLanguage}
              target={externalButton ? "_blank" : undefined}
              rel={externalButton ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground transition hover:opacity-90"
            >
              {externalButton && buttonUrl.includes("facebook") ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path d={siFacebook.path} />
                </svg>
              ) : null}
              {buttonText}
            </Link>
          </div>
        ) : null}
      </div>

      {hasCarousel ? (
        <>
          <button
            type="button"
            aria-label={isKhmer ? "ផ្ទាំងមុន" : "Previous banner"}
            onClick={() =>
              setSlideIndex((current) => (current + slides.length - 1) % slides.length)
            }
            className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/45 text-white hover:bg-slate-950/70 sm:left-6"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={isKhmer ? "ផ្ទាំងបន្ទាប់" : "Next banner"}
            onClick={() => setSlideIndex((current) => (current + 1) % slides.length)}
            className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/45 text-white hover:bg-slate-950/70 sm:right-6"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-slate-950/50 px-3 py-1 text-xs text-white">
            {slideIndex + 1} / {slides.length}
          </span>
        </>
      ) : null}

      <button
        type="button"
        aria-label={
          isKhmer
            ? playing ? "ផ្អាកផ្ទាំងផ្សព្វផ្សាយ" : "ចាក់ផ្ទាំងផ្សព្វផ្សាយ"
            : playing ? "Pause banner" : "Play banner"
        }
        onClick={() => setPlaying((value) => !value)}
        className="absolute bottom-4 right-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-zinc-900 shadow-lg transition hover:bg-zinc-100 sm:bottom-6 sm:right-6"
      >
        {playing ? (
          <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4 fill-current pl-0.5" aria-hidden="true" />
        )}
      </button>
    </section>
  );
}
