"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Boxes, Loader2, Pencil, Plus, Trash2, X } from "@/components/ui/emoji-icons";
import { useAdminText } from "@/components/layout/admin-language-selector";
import { adminApi } from "@/lib/admin-api";
import { useAuthStore } from "@/stores/auth-store";
import type { AdminCategory, CategoryFormValues } from "@/types/category";

const EMPTY_FORM: CategoryFormValues = {
  name: "",
  name_km: "",
};

function updateCategoryList(items: AdminCategory[], category: AdminCategory) {
  const updated = items.some((item) => item.id === category.id)
    ? items.map((item) => (item.id === category.id ? category : item))
    : [...items, category];

  return updated.sort(
    (left, right) =>
      left.sort_order - right.sort_order || left.name.localeCompare(right.name)
  );
}

export function CategoriesManager() {
  const t = useAdminText();
  const user = useAuthStore((state) => state.user);
  const canManage = useMemo(
    () => user?.roles?.some((role) => ["super-admin", "admin"].includes(role.slug)) ?? false,
    [user]
  );
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState<{ message: string; error: boolean } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState<CategoryFormValues>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const { ok, payload } = await adminApi<{ items: AdminCategory[] }>("/admin/categories");
      if (!ok || payload.success !== true) {
        console.error("[categories] Could not load categories.", payload.message);
        setLoadError(true);
        setCategories([]);
        return;
      }

      setLoadError(false);
      setCategories(payload.data.items ?? []);
    } catch (error) {
      console.error("[categories] Could not load categories.", error);
      setLoadError(true);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManage) return;

    let active = true;
    queueMicrotask(() => {
      if (active) void loadCategories();
    });

    return () => {
      active = false;
    };
  }, [canManage, loadCategories]);

  function openCreateForm() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormError(null);
    setModalOpen(true);
  }

  function openEditForm(category: AdminCategory) {
    setEditing(category);
    setForm({
      name: category.name,
      name_km: category.name_km ?? "",
    });
    setFormErrors({});
    setFormError(null);
    setModalOpen(true);
  }

  function closeForm() {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormError(null);
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setFormError(null);
    setFormErrors({});

    const name = form.name.trim();
    const nameKm = form.name_km.trim();
    if (!name || !nameKm) {
      const requiredMessage = t("Category names are required.");
      setFormError(requiredMessage);
      setFormErrors({
        ...(!name ? { name: [requiredMessage] } : {}),
        ...(!nameKm ? { name_km: [requiredMessage] } : {}),
      });
      return;
    }

    setSaving(true);
    try {
      const path = editing ? `/admin/categories/${editing.id}` : "/admin/categories";
      const { ok, payload } = await adminApi<{ category: AdminCategory }>(path, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({ name, name_km: nameKm }),
      });

      if (!ok || payload.success !== true) {
        console.error("[categories] Could not save category.", payload.message);
        setFormErrors(payload.success === false ? payload.errors ?? {} : {});
        setFormError(t("Unable to save category."));
        return;
      }

      setCategories((current) => updateCategoryList(current, payload.data.category));
      closeForm();
      setNotice({ message: t(editing ? "Category updated." : "Category created."), error: false });
    } catch (error) {
      console.error("[categories] Could not save category.", error);
      setFormError(t("Unable to save category."));
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category: AdminCategory) {
    const confirmation = `${t("Delete this category?")}\n${t(
      "Deleting this category will make {count} products uncategorized."
    ).replace("{count}", String(category.product_count))}`;
    if (!window.confirm(confirmation)) return;

    setDeletingId(category.id);
    setNotice(null);
    try {
      const { ok, payload } = await adminApi<null>(`/admin/categories/${category.id}`, {
        method: "DELETE",
      });
      if (!ok || payload.success !== true) {
        const message = payload.success === false ? payload.message : t("Unable to delete category.");
        console.error("[categories] Could not delete category.", message);
        setNotice({ message: t(message), error: true });
        return;
      }

      setCategories((current) => current.filter((item) => item.id !== category.id));
      setNotice({ message: t("Category deleted."), error: false });
    } catch (error) {
      console.error("[categories] Could not delete category.", error);
      setNotice({ message: t("Unable to delete category."), error: true });
    } finally {
      setDeletingId(null);
    }
  }

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        {t("You do not have access to this module.")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Boxes className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-semibold uppercase tracking-wide">{t("Categories")}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {t("Categories")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("Manage categories in English and Khmer.")}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("Add category")}
        </button>
      </header>

      {notice ? (
        <p
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm ${
            notice.error
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
          }`}
        >
          {notice.message}
        </p>
      ) : null}

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <p>{t("Unable to load categories.")}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setLoadError(false);
              void loadCategories();
            }}
            className="mt-3 font-semibold underline"
          >
            {t("Retry")}
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">{t("English name")}</th>
                  <th className="px-5 py-3">{t("Khmer name")}</th>
                  <th className="px-5 py-3">{t("Product count")}</th>
                  <th className="px-5 py-3 text-right">{t("Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  Array.from({ length: 5 }, (_, index) => (
                    <tr key={index} aria-hidden="true">
                      <td colSpan={4} className="px-5 py-4">
                        <div className="h-10 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                      </td>
                    </tr>
                  ))
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                      {t("No categories found.")}
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="text-slate-700 dark:text-slate-200">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{category.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{category.slug}</p>
                      </td>
                      <td className="px-5 py-3" lang="km">{category.name_km || "—"}</td>
                      <td className="px-5 py-3">
                        <span>{category.product_count}</span>
                        {category.product_count > 0 ? (
                          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                            {t("Products assigned; cannot delete.")}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(category)}
                            aria-label={`${t("Edit")} ${category.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteCategory(category)}
                            disabled={deletingId === category.id}
                            aria-label={`${t("Delete")} ${category.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                          >
                            {deletingId === category.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-form-title"
            className="my-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 id="category-form-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                {t(editing ? "Edit category" : "Create category")}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                aria-label={t("Close")}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={saveCategory} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("English name")}</span>
                <input
                  required
                  maxLength={255}
                  lang="en"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                {formErrors.name?.[0] ? <span className="block text-xs text-red-600">{formErrors.name[0]}</span> : null}
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("Khmer name")}</span>
                <input
                  required
                  maxLength={255}
                  lang="km"
                  value={form.name_km}
                  onChange={(event) => setForm((current) => ({ ...current, name_km: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                {formErrors.name_km?.[0] ? <span className="block text-xs text-red-600">{formErrors.name_km[0]}</span> : null}
              </label>

              {formError ? (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                  {formError}
                </p>
              ) : null}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  {saving ? t("Saving...") : t("Save category")}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
