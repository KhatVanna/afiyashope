"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { siFacebook } from "simple-icons";

export function HeroSlider() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      void video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  }, [playing]);

  return (
    <section className="relative isolate min-h-[28rem] overflow-hidden bg-[#21A8D8] text-white sm:min-h-[32rem] lg:min-h-[36rem]">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src="/videos/TVC.mp4"
        poster="/videos/TVC-poster.jpg"
        muted
        loop
        playsInline
        autoPlay
        aria-label="Afiya Shope promotional video"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#168DB5]/95 via-[#21A8D8]/70 to-[#F9318D]/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#168DB5]/60 via-transparent to-white/10" />

      <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:py-24">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
          ✨ NEW COLLECTION 2026
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          ម៉ូដ Abaya ទាន់សម័យ
        </h1>
        <p className="mt-4 max-w-xl text-base text-zinc-200 sm:text-lg">
          សុភាពរាបសារ និងប្រណិតភាព • សាច់ក្រណាត់នាំចូលគុណភាពខ្ពស់
        </p>
        <div className="mt-8">
          <Link
            href="https://www.facebook.com/share/1E66nep5tC/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground transition hover:opacity-90"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d={siFacebook.path} />
            </svg>
            ឆាតសួរព័ត៌មាន FB Page
          </Link>
        </div>
      </div>

      <button
        type="button"
        aria-label={playing ? "Pause video" : "Play video"}
        onClick={() => setPlaying((value) => !value)}
        className="absolute bottom-4 right-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-zinc-900 shadow-lg transition hover:bg-zinc-100 sm:bottom-6 sm:right-6"
      >
        {playing ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="h-4 w-4 fill-current pl-0.5" />
        )}
      </button>
    </section>
  );
}
