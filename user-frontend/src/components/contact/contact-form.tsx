"use client";

import { Phone } from "lucide-react";
import { useLocaleText } from "@/components/i18n/locale-text";

export function ContactForm() {
  const t = useLocaleText();

  return (
    <form className="mt-6 grid gap-4 sm:grid-cols-2">
      <input
        className="h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        placeholder={t("First name", "នាមខ្លួន")}
        aria-label={t("First name", "នាមខ្លួន")}
      />
      <input
        className="h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        placeholder={t("Last name", "នាមត្រកូល")}
        aria-label={t("Last name", "នាមត្រកូល")}
      />
      <input
        className="h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary sm:col-span-2"
        placeholder={t("Email *", "អ៊ីមែល *")}
        aria-label={t("Email", "អ៊ីមែល")}
        type="email"
      />
      <textarea
        className="min-h-32 rounded-lg border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary sm:col-span-2"
        placeholder={t("Message *", "សារ *")}
        aria-label={t("Message", "សារ")}
      />
      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-3 text-sm font-semibold uppercase tracking-wide text-background sm:col-span-2"
      >
        <Phone className="h-4 w-4" />
        {t("Send", "ផ្ញើសារ")}
      </button>
    </form>
  );
}
