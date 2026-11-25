"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useLocaleText } from "@/components/i18n/locale-text";

type PromoSlide = {
  type: "image" | "video";
  src: string;
  altEn: string;
  altKm: string;
  poster?: string;
};

const slides: PromoSlide[] = [
  {
    type: "video",
    src: "/videos/promo.mp4",
    poster: "/videos/promo-poster.png",
    altEn: "Afiya Shope promotional video",
    altKm: "វីដេអូផ្សព្វផ្សាយរបស់ Afiya Shope",
  },
  {
    type: "image",
    src: "/videos/frames/01.png",
    altEn: "Smartwatch lifestyle",
    altKm: "របៀបប្រើប្រាស់នាឡិកាឆ្លាតវៃ",
  },
  {
    type: "image",
    src: "/videos/frames/02.png",
    altEn: "Wireless headphones",
    altKm: "កាសឥតខ្សែ",
  },
  {
    type: "image",
    src: "/videos/frames/03.png",
    altEn: "Gaming controller",
    altKm: "ឧបករណ៍បញ្ជាហ្គេម",
  },
];

export function PromoBanner() {
  const t = useLocaleText();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const active = slides[index];

  useEffect(() => {
    if (!playing || active.type === "video") return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [playing, active.type, index]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || active.type !== "video") return;
    if (playing) {
      void video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  }, [playing, active, index]);

  function goTo(next: number) {
    setIndex((next + slides.length) % slides.length);
  }

  function togglePlay() {
    setPlaying((value) => !value);
  }

  return (
    <section className="bg-[#168DB5] text-white">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:py-16">
        <div className="relative aspect-square overflow-hidden rounded-[1.75rem] bg-zinc-900 sm:aspect-[4/3] lg:aspect-square">
          {active.type === "video" ? (
            <video
              key={active.src}
              ref={videoRef}
              className="h-full w-full object-cover"
              src={active.src}
              poster={active.poster}
              aria-label={t(active.altEn, active.altKm)}
              muted
              loop
              playsInline
              onClick={togglePlay}
            />
          ) : (
            <Image
              key={active.src}
              src={active.src}
              alt={t(active.altEn, active.altKm)}
              fill
              className="object-cover transition duration-500"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={false}
            />
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

          <div className="absolute inset-0 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label={t("Previous media", "មេឌៀមុន")}
              onClick={() => goTo(index - 1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              type="button"
              aria-label={playing ? t("Pause", "ផ្អាក") : t("Play", "ចាក់")}
              onClick={togglePlay}
              className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-lg transition hover:bg-white"
            >
              {playing ? (
                <Pause className="h-7 w-7 fill-current" />
              ) : (
                <Play className="h-7 w-7 fill-current pl-0.5" />
              )}
            </button>

            <button
              type="button"
              aria-label={t("Next media", "មេឌៀបន្ទាប់")}
              onClick={() => goTo(index + 1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            aria-label={playing ? t("Pause", "ផ្អាក") : t("Play", "ចាក់")}
            onClick={togglePlay}
            className="absolute bottom-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-900 shadow-md transition hover:bg-zinc-100"
          >
            {playing ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current pl-0.5" />
            )}
          </button>

          <div className="absolute bottom-4 left-4 flex items-center gap-1.5">
            {slides.map((slide, slideIndex) => (
              <button
                key={`${slide.src}-${slideIndex}`}
                type="button"
                aria-label={t(`Show slide ${slideIndex + 1}`, `បង្ហាញស្លាយទី ${slideIndex + 1}`)}
                onClick={() => setIndex(slideIndex)}
                className={`h-1.5 rounded-full transition ${
                  slideIndex === index ? "w-6 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="max-w-xl lg:pl-4">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="block">Afiya Shope –</span>
            <span className="block">{t("expensive", "តម្លៃថ្លៃ")}</span>
            <span className="block">{t("was", "គឺជារឿង")}</span>
            <span className="mt-1 block bg-gradient-to-r from-cyan-300 to-pink-400 bg-clip-text text-transparent">
              {t("yesterday!", "ពីម្សិលមិញ!")}
            </span>
          </h2>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
            {t(
              "Afiya Shope stands for clear selection, strong quality and a shopping experience without detours.",
              "Afiya Shope ផ្តល់ជូនជម្រើសច្បាស់លាស់ គុណភាពល្អ និងបទពិសោធន៍ទិញទំនិញងាយស្រួល។"
            )}
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-white transition hover:text-zinc-300"
          >
            {t("Visit the shop", "ចូលមើលហាង")}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
