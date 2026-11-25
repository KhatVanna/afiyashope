"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  getLanguageName,
  REGION_PRESETS,
  useRegionStore,
  useRegionLanguage,
} from "@/stores/region-store";

type RegionSelectorProps = {
  className?: string;
  variant?: "footer" | "header";
  compact?: boolean;
};

export function RegionSelector({
  className = "",
  variant = "footer",
  compact = false,
}: RegionSelectorProps) {
  const isHeader = variant === "header";
  const regionId = useRegionStore((state) => state.regionId);
  const hydrated = useRegionStore((state) => state.hydrated);
  const hydrate = useRegionStore((state) => state.hydrate);
  const setRegionId = useRegionStore((state) => state.setRegionId);
  const displayLanguage = useRegionLanguage();
  const isKhmer = displayLanguage === "KM";
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current =
    REGION_PRESETS.find((preset) => preset.id === regionId) ?? REGION_PRESETS[0];
  const currentLanguageName = getLanguageName(current.language, displayLanguage);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.documentElement.lang = current.language === "KM" ? "km" : "en";
  }, [current.language]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${isKhmer ? "ភាសា" : "Language"}: ${currentLanguageName}`}
        onClick={() => setOpen((value) => !value)}
        className={
          isHeader
            ? `inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1.5 text-xs text-foreground transition hover:bg-muted ${
                compact ? "h-9 w-9 justify-center p-0" : ""
              }`
            : "inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.flagSrc}
          alt=""
          className="h-4 w-6 rounded-sm object-cover"
        />
        <span className={compact ? "sr-only" : ""}>
          {hydrated ? currentLanguageName : getLanguageName(current.language, displayLanguage)}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition ${
            isHeader ? "text-muted-foreground" : "text-zinc-400"
          } ${open ? "rotate-180" : ""} ${compact ? "hidden" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={isKhmer ? "ការជ្រើសរើសភាសា" : "Language selection"}
          className={
            isHeader
              ? "absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
              : "absolute bottom-full right-0 z-50 mb-2 w-72 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl shadow-black/40"
          }
        >
          <div
            className={`border-b px-3 py-2 ${
              isHeader ? "border-border" : "border-zinc-800"
            }`}
          >
            <p
              lang={isKhmer ? "km" : "en"}
              className={`text-[11px] font-semibold uppercase tracking-wide ${
                isHeader ? "text-muted-foreground" : "text-zinc-500"
              }`}
            >
              {isKhmer ? "ភាសា" : "Language"}
            </p>
          </div>
          <ul className="max-h-72 overflow-y-auto p-1.5">
            {REGION_PRESETS.map((preset) => {
              const selected = preset.id === current.id;
              return (
                <li key={preset.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      setRegionId(preset.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      selected
                        ? isHeader
                          ? "bg-primary/10 text-foreground"
                          : "bg-[#21A8D8]/15 text-white"
                        : isHeader
                          ? "text-foreground hover:bg-muted"
                          : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preset.flagSrc}
                      alt=""
                      className="mt-0.5 h-4 w-6 rounded-sm object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        lang={isKhmer ? "km" : "en"}
                        className="block text-sm font-medium"
                      >
                        {getLanguageName(preset.language, displayLanguage)}
                      </span>
                    </span>
                    {selected ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#21A8D8]" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
