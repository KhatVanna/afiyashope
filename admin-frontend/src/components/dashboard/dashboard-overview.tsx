"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useAdminText } from "@/components/layout/admin-language-selector";

export function DashboardOverview() {
  const t = useAdminText();
  const user = useAuthStore((state) => state.user);
  const firstName = user?.name?.split(" ")[0] ?? "Admin";

  return (
    <div className="space-y-6">
      <section className="dashboard-welcome overflow-hidden rounded-2xl bg-gradient-to-r from-[#e2f5fc] via-[#f5f8ff] to-white p-6 shadow-sm sm:p-8">
        <div className="max-w-xl">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
            {t("Welcome back!")} {t(firstName)} 👋
          </h1>
          <p className="mt-2 text-base text-slate-500">
            {t("Check your store reports, orders, and catalog performance.")}
          </p>
        </div>
      </section>
    </div>
  );
}
