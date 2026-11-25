"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocaleText } from "@/components/i18n/locale-text";

const STORAGE_KEY = "v2005-splash-seen";
const MIN_VISIBLE_MS = 1500;
const FADE_MS = 480;

export function SiteSplash() {
  const t = useLocaleText();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === "1") {
        return;
      }
    } catch {
      // Private mode — still show splash once this visit.
    }

    setVisible(true);
    const started = performance.now();

    const finish = () => {
      const elapsed = performance.now() - started;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);

      window.setTimeout(() => {
        setLeaving(true);
        window.setTimeout(() => {
          setVisible(false);
          try {
            window.sessionStorage.setItem(STORAGE_KEY, "1");
          } catch {
            // Ignore storage failures.
          }
        }, FADE_MS);
      }, wait);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
      window.setTimeout(finish, 2800);
    }

    return () => {
      window.removeEventListener("load", finish);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`site-splash ${leaving ? "site-splash--leave" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={t("Loading Afiya Shope", "កំពុងផ្ទុក Afiya Shope")}
    >
      <div className="site-splash__mark" aria-hidden>
        <span className="site-splash__ring" />
        <span className="site-splash__ring site-splash__ring--delayed" />
        <div className="site-splash__logo-wrap">
          <Image
            src="/images/afiyashope_logo.png"
            alt="Afiya Shope"
            width={768}
            height={768}
            priority
            unoptimized
            className="site-splash__logo"
          />
        </div>
      </div>
    </div>
  );
}
