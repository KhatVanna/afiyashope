"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, Tag, Trash2, Upload, X } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { useAdminText } from "@/components/layout/admin-language-selector";
import { adminApi } from "@/lib/admin-api";
import { useAuthStore } from "@/stores/auth-store";
import type { AdminBrand, BrandFormValues } from "@/types/brand";

const EMPTY_FORM: BrandFormValues = {
  name: "",
  description: "",
  is_active: true,
  sort_order: "0",
};

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ACCEPTED_LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function compressLogoImage(file: File): Promise<File> {
  const image = await createImageBitmap(file);

  try {
    const scale = Math.min(1, 800 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to create an image canvas.");

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error("Unable to compress the image.")),
        "image/webp",
        0.86
      );
    });

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
      type: "image/webp",
    });
  } finally {
    image.close();
  }
}

function updateBrandList(items: AdminBrand[], brand: AdminBrand) {
  const existingIndex = items.findIndex((item) => item.id === brand.id);
  if (existingIndex < 0) return [...items, brand];

  return items.map((item) => (item.id === brand.id ? brand : item));
}

export function BrandsManager() {
  const t = useAdminText();
  const user = useAuthStore((state) => state.user);
  const canManage = useMemo(
    () => user?.roles?.some((role) => role.slug === "super-admin") ?? false,
    [user]
  );
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBrand | null>(null);
  const [form, setForm] = useState<BrandFormValues>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadBrands = useCallback(async () => {
    try {
      const { ok, payload } = await adminApi<{ items: AdminBrand[] }>("/admin/brands");
      setLoadError(false);
      if (!ok || payload.success !== true) {
        console.error("[brands] Could not load brands.", payload.message);
        setLoadError(true);
        setBrands([]);
        return;
      }

      setBrands(payload.data.items ?? []);
    } catch (error) {
      console.error("[brands] Could not load brands.", error);
      setLoadError(true);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManage) return;

    let active = true;
    queueMicrotask(() => {
      if (active) void loadBrands();
    });

    return () => {
      active = false;
    };
  }, [canManage, loadBrands]);

  function revokeLogoPreview() {
    if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
  }

  function closeForm() {
    revokeLogoPreview();
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormError(null);
    setLogoFile(null);
  }

  function openCreateForm() {
    revokeLogoPreview();
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormError(null);
    setLogoFile(null);
    setModalOpen(true);
  }

  function openEditForm(brand: AdminBrand) {
    revokeLogoPreview();
    setEditing(brand);
    setForm({
      name: brand.name,
      description: brand.description ?? "",
      is_active: brand.is_active,
      sort_order: String(brand.sort_order),
    });
    setFormErrors({});
    setFormError(null);
    setLogoFile(null);
    setLogoPreview(brand.logo_url);
    setModalOpen(true);
  }

  async function handleLogoChange(file: File | undefined) {
    if (!file) return;
    setFormError(null);
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setFormError(t("Logo must be JPG, PNG, or WebP and no more than 2 MB."));
      return;
    }

    setCompressing(true);
    try {
      const compressed = await compressLogoImage(file);
      if (compressed.size > MAX_LOGO_BYTES) {
        setFormError(t("Logo must be JPG, PNG, or WebP and no more than 2 MB."));
        return;
      }

      revokeLogoPreview();
      setLogoFile(compressed);
      setLogoPreview(URL.createObjectURL(compressed));
    } catch (error) {
      console.error("[brands] Could not process the logo image.", error);
      setFormError(t("Unable to process logo image."));
    } finally {
      setCompressing(false);
    }
  }

  async function saveBrand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setNoticeIsError(false);
    setFormError(null);
    setFormErrors({});

    const name = form.name.trim();
    if (!name) {
      setFormError(t("Brand name is required."));
      setFormErrors({ name: [t("Brand name is required.")] });
      return;
    }

    setSaving(true);
    try {
      const path = editing ? `/admin/brands/${editing.id}` : "/admin/brands";
      const { ok, payload } = await adminApi<{ brand: AdminBrand }>(path, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          name,
          description: form.description.trim() || null,
          is_active: form.is_active,
          sort_order: Number(form.sort_order) || 0,
        }),
      });

      if (!ok || payload.success !== true) {
        console.error("[brands] Could not save brand.", payload.message);
        setFormErrors(payload.success === false ? payload.errors ?? {} : {});
        setFormError(t("Unable to save brand."));
        return;
      }

      let savedBrand = payload.data.brand;
      if (logoFile) {
        const logoForm = new FormData();
        logoForm.append("logo", logoFile);
        const logoResult = await adminApi<{ brand: AdminBrand }>(
          `/admin/brands/${savedBrand.id}/logo`,
          { method: "POST", body: logoForm }
        );

        if (!logoResult.ok || logoResult.payload.success !== true) {
          console.error(
            "[brands] Brand saved, but logo upload failed.",
            logoResult.payload.message
          );
          setBrands((current) => updateBrandList(current, savedBrand));
          setEditing(savedBrand);
          setFormError(t("Brand details were saved, but the logo upload failed."));
          return;
        }

        savedBrand = logoResult.payload.data.brand;
      }

      setBrands((current) => updateBrandList(current, savedBrand));
      closeForm();
      setNotice(t(editing ? "Brand updated." : "Brand created."));
    } catch (error) {
      console.error("[brands] Could not save brand.", error);
      setFormError(t("Unable to save brand."));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(brand: AdminBrand) {
    setUpdatingId(brand.id);
    setNotice(null);
    setNoticeIsError(false);
    try {
      const { ok, payload } = await adminApi<{ brand: AdminBrand }>(
        `/admin/brands/${brand.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ is_active: !brand.is_active }),
        }
      );
      if (!ok || payload.success !== true) {
        console.error("[brands] Could not update brand status.", payload.message);
        setNotice(t("Unable to update brand status."));
        setNoticeIsError(true);
        return;
      }

      setBrands((current) => updateBrandList(current, payload.data.brand));
      setNotice(t("Brand status updated."));
    } catch (error) {
      console.error("[brands] Could not update brand status.", error);
      setNotice(t("Unable to update brand status."));
      setNoticeIsError(true);
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteBrand(brand: AdminBrand) {
    if (!window.confirm(t("Delete this brand? Products will remain but will no longer be assigned to it."))) {
      return;
    }

    setDeletingId(brand.id);
    setNotice(null);
    setNoticeIsError(false);
    try {
      const { ok, payload } = await adminApi<null>(`/admin/brands/${brand.id}`, {
        method: "DELETE",
      });
      if (!ok || payload.success !== true) {
        console.error("[brands] Could not delete brand.", payload.message);
        setNotice(t("Unable to delete brand."));
        setNoticeIsError(true);
        return;
      }

      setBrands((current) => current.filter((item) => item.id !== brand.id));
      setNotice(t("Brand deleted."));
    } catch (error) {
      console.error("[brands] Could not delete brand.", error);
      setNotice(t("Unable to delete brand."));
      setNoticeIsError(true);
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
            <Tag className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-semibold uppercase tracking-wide">{t("Brands")}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {t("Brands")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("Manage product brands, logos, and visibility.")}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("Add brand")}
        </button>
      </header>

      {notice ? (
        <p
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm ${
            noticeIsError
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
          }`}
        >
          {notice}
        </p>
      ) : null}

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <p>{t("Unable to load brands.")}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setLoadError(false);
              void loadBrands();
            }}
            className="mt-3 font-semibold underline"
          >
            {t("Retry")}
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">{t("Logo")}</th>
                  <th className="px-5 py-3">{t("Brand name")}</th>
                  <th className="px-5 py-3">{t("Product count")}</th>
                  <th className="px-5 py-3">{t("Status")}</th>
                  <th className="px-5 py-3 text-right">{t("Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  Array.from({ length: 5 }, (_, index) => (
                    <tr key={index} aria-hidden="true">
                      <td colSpan={5} className="px-5 py-4">
                        <div className="h-10 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                      </td>
                    </tr>
                  ))
                ) : brands.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                      {t("No brands found.")}
                    </td>
                  </tr>
                ) : (
                  brands.map((brand) => (
                    <tr key={brand.id} className="text-slate-700 dark:text-slate-200">
                      <td className="px-5 py-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                          <ProductImage
                            src={brand.logo_url}
                            alt={brand.name}
                            fill
                            sizes="48px"
                            compact
                            className="object-contain p-1"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{brand.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{brand.slug}</p>
                      </td>
                      <td className="px-5 py-3">{brand.product_count}</td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          disabled={updatingId === brand.id}
                          onClick={() => void toggleActive(brand)}
                          aria-label={`${brand.is_active ? t("Deactivate") : t("Activate")} ${brand.name}`}
                          aria-pressed={brand.is_active}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                            brand.is_active
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {updatingId === brand.id ? t("Saving...") : t(brand.is_active ? "Active" : "Inactive")}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(brand)}
                            aria-label={`${t("Edit")} ${brand.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteBrand(brand)}
                            disabled={deletingId === brand.id}
                            aria-label={`${t("Delete")} ${brand.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                          >
                            {deletingId === brand.id ? (
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
            aria-labelledby="brand-form-title"
            className="my-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="brand-form-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t(editing ? "Edit brand" : "Create brand")}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t("The brand logo is optional.")}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                aria-label={t("Close")}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={saveBrand} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("Brand name")}</span>
                <input
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                {formErrors.name?.[0] ? <span className="block text-xs text-red-600">{formErrors.name[0]}</span> : null}
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("Description")}</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("Sort order")}</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.sort_order}
                    onChange={(event) => setForm((current) => ({ ...current, sort_order: event.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
                <label className="flex items-center gap-3 self-end rounded-lg border border-slate-200 px-3 py-3 dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("Active")}</span>
                </label>
              </div>

              <div className="space-y-2">
                <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{t("Logo")}</span>
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                    <ProductImage
                      src={logoPreview ?? editing?.logo_url}
                      alt={form.name || t("Brand name")}
                      fill
                      sizes="80px"
                      compact
                      className="object-contain p-2"
                    />
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    {compressing ? t("Compressing...") : t("Upload logo")}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={compressing || saving}
                      onChange={(event) => {
                        void handleLogoChange(event.target.files?.[0]);
                        event.currentTarget.value = "";
                      }}
                      className="sr-only"
                    />
                  </label>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("Logo must be JPG, PNG, or WebP and no more than 2 MB.")}
                </p>
              </div>

              {formError ? (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                  {formError}
                </p>
              ) : null}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving || compressing}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving || compressing}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  {saving ? t("Saving...") : t("Save brand")}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
