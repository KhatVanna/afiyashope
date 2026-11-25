"use client";

import Image from "next/image";
import { useId, useState, type ChangeEvent } from "react";
import { Loader2, Upload, X } from "lucide-react";
import type { SiteMediaKind } from "@/lib/site-settings-api";

type MediaType = "image" | "video";
type InputMode = "upload" | "link";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const VIDEO_EXTENSIONS = ["mp4", "webm"];
const FILE_MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
};

function extensionFromPath(path: string): string {
  return path.split(".").pop()?.toLowerCase() ?? "";
}

export function detectMediaType(url: string): MediaType | null {
  const path = url.split(/[?#]/, 1)[0] ?? "";
  const extension = extensionFromPath(path);
  if (IMAGE_EXTENSIONS.includes(extension)) return "image";
  if (VIDEO_EXTENSIONS.includes(extension)) return "video";
  return null;
}

export function getMediaLinkError(value: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "Use a direct HTTPS link.";
    if (url.username || url.password) return "Links with embedded credentials are not allowed.";
    if (!detectMediaType(url.pathname)) {
      return "Use a JPG, JPEG, PNG, WebP, MP4, or WebM file link.";
    }
    return null;
  } catch {
    return "Enter a valid HTTPS link.";
  }
}

export function MediaInput({
  id,
  label,
  value,
  uploading,
  error,
  allowVideo = true,
  optional = false,
  imageUploadKind = "banner_image",
  onChange,
  onUpload,
}: {
  id: string;
  label: string;
  value: string | null;
  uploading: boolean;
  error?: string;
  allowVideo?: boolean;
  optional?: boolean;
  imageUploadKind?: SiteMediaKind;
  onChange: (value: string) => void;
  onUpload: (
    file: File,
    kind: SiteMediaKind,
    key: string,
    onUploaded: (url: string) => void
  ) => void;
}) {
  const generatedId = useId();
  const [mode, setMode] = useState<InputMode>("upload");
  const [clientError, setClientError] = useState<string | null>(null);
  const inputId = `${id}-${generatedId.replace(/:/g, "")}`;
  const mediaType = value ? detectMediaType(value) : null;
  const fileAccept = allowVideo
    ? ".jpg,.jpeg,.png,.webp,.mp4,.webm"
    : ".jpg,.jpeg,.png,.webp";
  const fieldError = clientError ?? error;

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const extension = extensionFromPath(file.name);
    const isVideo = VIDEO_EXTENSIONS.includes(extension);
    const maxBytes = isVideo ? 15 * 1024 * 1024 : 5 * 1024 * 1024;
    if (
      !FILE_MIME_TYPES[extension] ||
      (!allowVideo && isVideo) ||
      (file.type !== "" && file.type !== FILE_MIME_TYPES[extension])
    ) {
      setClientError(
        allowVideo
          ? "Choose a JPG, JPEG, PNG, WebP, MP4, or WebM file."
          : "Choose a JPG, JPEG, PNG, or WebP image."
      );
      return;
    }
    if (file.size > maxBytes) {
      setClientError(
        isVideo
          ? "Video files must be 15 MB or smaller."
          : "Image files must be 5 MB or smaller."
      );
      return;
    }

    setClientError(null);
    onUpload(
      file,
      isVideo ? "banner_video" : imageUploadKind,
      id,
      onChange
    );
  }

  function updateLink(value: string) {
    setClientError(getMediaLinkError(value));
    onChange(value);
  }

  const previewSrc =
    value && !/^(blob:|data:)/i.test(value) ? value : null;

  return (
    <section
      aria-label={label}
      className="min-w-0 space-y-3 rounded-xl border border-[#d6e8f2] bg-white p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-800">
          {label}
          {optional ? <span className="ml-1 font-normal text-slate-400">(optional)</span> : null}
        </h4>
        <div
          role="radiogroup"
          aria-label={`${label} input method`}
          className="inline-flex rounded-lg bg-slate-100 p-1"
        >
          {([
            ["upload", "Upload file"],
            ["link", "Paste link"],
          ] as const).map(([valueMode, caption]) => (
            <button
              key={valueMode}
              type="button"
              role="radio"
              aria-checked={mode === valueMode}
              onClick={() => {
                setMode(valueMode);
                setClientError(null);
              }}
              className={`min-h-8 rounded-md px-2.5 text-xs font-medium transition ${
                mode === valueMode
                  ? "bg-white text-[#00679e] shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {caption}
            </button>
          ))}
        </div>
      </div>

      {mode === "upload" ? (
        <label
          htmlFor={inputId}
          className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#b8d9eb] bg-[#f7fbfd] px-3 py-2 text-sm font-medium text-[#0077b6] hover:bg-[#eff9fe] ${
            uploading ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="h-4 w-4" aria-hidden="true" />
          )}
          {uploading ? "Uploading..." : "Choose a file"}
          <input
            id={inputId}
            type="file"
            accept={fileAccept}
            onChange={selectFile}
            disabled={uploading}
            className="sr-only"
          />
        </label>
      ) : (
        <div>
          <label htmlFor={`${inputId}-url`} className="sr-only">
            {label} HTTPS URL
          </label>
          <input
            id={`${inputId}-url`}
            type="url"
            inputMode="url"
            autoComplete="url"
            value={value ?? ""}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={`${inputId}-hint ${inputId}-error`}
            onChange={(event) => updateLink(event.target.value)}
            placeholder="https://example.com/banner.webp"
            className={`block min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#0077b6]/15 ${
              fieldError
                ? "border-red-400 focus:border-red-500"
                : "border-[#d6e8f2] focus:border-[#0077b6]"
            }`}
          />
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-slate-500">
            YouTube/Facebook links will not work as background. Use a direct file link.
          </p>
        </div>
      )}

      {previewSrc ? (
        <div className="relative aspect-[16/7] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          {mediaType === "video" ? (
            <video
              src={previewSrc}
              muted
              loop
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-contain"
            />
          ) : (
            <Image
              src={previewSrc}
              alt={`${label} preview`}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-contain"
            />
          )}
          <span className="absolute left-2 top-2 rounded-full bg-slate-900/75 px-2 py-1 text-[11px] font-semibold text-white">
            {mediaType === "video" ? "Video" : mediaType === "image" ? "Image" : "Unsupported"}
          </span>
          <button
            type="button"
            onClick={() => {
              setClientError(null);
              onChange("");
            }}
            className="absolute right-2 top-2 inline-flex min-h-8 items-center gap-1 rounded-full bg-white/95 px-2.5 text-xs font-semibold text-slate-700 shadow hover:bg-white"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Remove
          </button>
        </div>
      ) : (
        <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
          {optional ? "No media selected (optional)." : "Select or link media before saving."}
        </p>
      )}

      <p className="text-xs text-slate-500">
        Images: 5 MB max · Videos: 15 MB max
      </p>
      <p
        id={`${inputId}-error`}
        role={fieldError ? "alert" : undefined}
        className={`text-xs ${fieldError ? "text-red-700" : "sr-only"}`}
      >
        {fieldError ?? ""}
      </p>
    </section>
  );
}
