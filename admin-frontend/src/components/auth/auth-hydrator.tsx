"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useAdminText } from "@/components/layout/admin-language-selector";

export function AuthHydrator({ children }: { children: React.ReactNode }) {
  const t = useAdminText();
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydrated = useAuthStore((state) => state.hydrated);
  const authUnavailable = useAuthStore((state) => state.authUnavailable);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">{t("Opening admin…")}</p>
      </div>
    );
  }

  if (authUnavailable && !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <p className="text-sm text-muted-foreground" role="status">
          {t("The authentication service is temporarily unavailable. Please try again shortly.")}
        </p>
        <button
          type="button"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          onClick={() => void hydrate()}
        >
          {t("Retry")}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
