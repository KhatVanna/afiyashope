"use client";

import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { useLocaleText } from "@/components/i18n/locale-text";
import { useWishlistStore } from "@/stores/wishlist-store";

export function WishlistView() {
  const t = useLocaleText();
  const items = useWishlistStore((state) => state.items);
  const clear = useWishlistStore((state) => state.clear);

  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="text-lg font-medium">{t("Your wishlist is empty", "បញ្ជីចំណូលចិត្តរបស់អ្នកមិនទាន់មានទំនិញទេ")}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("Save products you love and revisit them anytime.", "រក្សាទុកទំនិញដែលអ្នកពេញចិត្ត ដើម្បីមើលម្តងទៀតនៅពេលក្រោយ។")}
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex rounded-lg border border-foreground px-5 py-2.5 text-sm font-semibold uppercase tracking-wide"
        >
          {t("Continue shopping", "បន្តទិញទំនិញ")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t(
            `${items.length} saved ${items.length === 1 ? "item" : "items"}`,
            `បានរក្សាទុក ${items.length} មុខ`
          )}
        </p>
        <button
          type="button"
          onClick={clear}
          className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          {t("Clear all", "សម្អាតទាំងអស់")}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
