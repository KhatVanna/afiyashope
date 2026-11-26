"use client";

import { MessageCircle, X } from "lucide-react";
import {
  siFacebook,
  siInstagram,
  siTelegram,
  siTiktok,
  type SimpleIcon,
} from "simple-icons";
import { useState } from "react";
import { useLocaleText } from "@/components/i18n/locale-text";

const CONTACT_CHANNELS: Array<{
  name: string;
  detail: string;
  href: string;
  icon: SimpleIcon;
  color: string;
}> = [
  {
    name: "Facebook",
    detail: "Afiya Shope",
    href: "https://www.facebook.com/share/1ABogiY4WS/?mibextid=wwXIfr",
    icon: siFacebook,
    color: "text-[#1877f2]",
  },
  {
    name: "Instagram",
    detail: "@afiyashope",
    href: "https://www.instagram.com/afiyashope?hvrq=OGtycGFiY3YwdHFo&utm_source=qr",
    icon: siInstagram,
    color: "text-[#e4405f]",
  },
  {
    name: "Telegram",
    detail: "@AfiyaShope",
    href: "https://t.me/AfiyaShope",
    icon: siTelegram,
    color: "text-[#26a5e4]",
  },
  {
    name: "TikTok",
    detail: "@afiya.shope",
    href: "https://www.tiktok.com/@afiya.shope",
    icon: siTiktok,
    color: "text-foreground",
  },
];

function BrandIcon({ icon }: { icon: SimpleIcon }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0 fill-current"
      role="img"
      viewBox="0 0 24 24"
    >
      <path d={icon.path} />
    </svg>
  );
}

export function ContactChatButton() {
  const t = useLocaleText();
  const [open, setOpen] = useState(false);

  return (
    <div
      className="fixed bottom-6 right-6 z-50"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setOpen(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      {open ? (
        <div
          className="absolute bottom-full right-0 mb-3 flex w-64 flex-col gap-2 rounded-2xl border border-border bg-card p-3 shadow-xl"
          aria-label={t("Contact links", "តំណភ្ជាប់ទំនាក់ទំនង")}
          role="group"
        >
          {CONTACT_CHANNELS.map((channel) => (
            <a
              key={channel.name}
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl p-2.5 text-foreground transition hover:bg-muted"
              aria-label={`${channel.name} ${channel.detail}`}
            >
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted ${channel.color}`}>
                <BrandIcon icon={channel.icon} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{channel.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {channel.detail}
                </span>
              </span>
            </a>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={
          open
            ? t("Close contact links", "បិទតំណភ្ជាប់ទំនាក់ទំនង")
            : t("Open contact links", "បើកតំណភ្ជាប់ទំនាក់ទំនង")
        }
        aria-expanded={open}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#21a8d8] text-white shadow-lg transition hover:bg-[#168db5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#21a8d8]"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
