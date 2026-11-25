"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Search, X } from "@/components/ui/emoji-icons";
import { adminApi } from "@/lib/admin-api";
import {
  useAdminLanguage,
  useAdminText,
  type AdminLanguage,
} from "@/components/layout/admin-language-selector";
import { useAuthStore } from "@/stores/auth-store";
import type { AdminCustomer, CustomersListData } from "@/types/customer";

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

function formatDate(value: string | null | undefined, language: AdminLanguage) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(language === "km" ? "km-KH" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function canUpdateCustomers(roleSlugs: string[]) {
  return roleSlugs.includes("super-admin") || roleSlugs.includes("admin");
}

function statusTone(status: string) {
  switch (status) {
    case "delivered":
    case "paid":
      return "bg-[#e2f5fc] text-[#075985]";
    case "confirmed":
    case "processing":
    case "shipped":
      return "bg-[#e2f5fc] text-[#0077b6]";
    case "pending":
      return "bg-[#fef5e5] text-[#b45309]";
    case "cancelled":
    case "failed":
    case "refunded":
      return "bg-[#fdede8] text-[#c2410c]";
    default:
      return "bg-[#f1f5f9] text-slate-500";
  }
}

export function CustomersManager() {
  const t = useAdminText();
  const language = useAdminLanguage();
  const user = useAuthStore((state) => state.user);
  const roleSlugs = useMemo(
    () => user?.roles?.map((role) => role.slug) ?? [],
    [user]
  );
  const canUpdate = canUpdateCustomers(roleSlugs);

  const [items, setItems] = useState<AdminCustomer[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [selected, setSelected] = useState<AdminCustomer | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      per_page: "15",
    });
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter === "active") params.set("is_active", "1");
    if (statusFilter === "inactive") params.set("is_active", "0");

    const { ok, payload } = await adminApi<CustomersListData>(
      `/admin/customers?${params.toString()}`
    );

    if (!ok || !payload.success) {
      setError(payload.message || "Unable to load customers.");
      setItems([]);
      setLoading(false);
      return;
    }

    setItems(payload.data.items);
    setMeta(payload.data.meta);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  async function openDetail(customer: AdminCustomer) {
    setDetailLoading(true);
    setSelected(customer);
    setEditName(customer.name);
    setEditEmail(customer.email);
    setEditPhone(customer.phone ?? "");
    setEditActive(customer.is_active);
    setFormErrors({});

    const { ok, payload } = await adminApi<{ customer: AdminCustomer }>(
      `/admin/customers/${customer.id}`
    );

    setDetailLoading(false);

    if (!ok || !payload.success) {
      setError(payload.message || "Unable to load customer details.");
      return;
    }

    setSelected(payload.data.customer);
    setEditName(payload.data.customer.name);
    setEditEmail(payload.data.customer.email);
    setEditPhone(payload.data.customer.phone ?? "");
    setEditActive(payload.data.customer.is_active);
  }

  function closeDetail() {
    setSelected(null);
    setFormErrors({});
  }

  async function saveCustomer() {
    if (!selected || !canUpdate) return;

    setSaving(true);
    setNotice(null);
    setFormErrors({});

    const { ok, payload } = await adminApi<{ customer: AdminCustomer }>(
      `/admin/customers/${selected.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim() || null,
          is_active: editActive,
        }),
      }
    );

    setSaving(false);

    if (!payload.success) {
      setFormErrors(payload.errors ?? {});
      setError(payload.message || "Unable to update customer.");
      return;
    }
    if (!ok) {
      setError("Unable to update customer.");
      return;
    }

    setSelected(payload.data.customer);
    setNotice("Customer updated.");
    await loadCustomers();
  }

  async function toggleActive(customer: AdminCustomer) {
    if (!canUpdate) return;

    const { ok, payload } = await adminApi<{ customer: AdminCustomer }>(
      `/admin/customers/${customer.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ is_active: !customer.is_active }),
      }
    );

    if (!ok || !payload.success) {
      setError(payload.message || "Unable to update customer status.");
      return;
    }

    setNotice(
      payload.data.customer.is_active
        ? "Customer activated."
        : "Customer deactivated."
    );
    await loadCustomers();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-800">
          {t("Customers")}
        </h1>
        <p className="mt-2 text-slate-500">
          {t("View storefront customer accounts, addresses, and order history.")}
        </p>
      </div>

      <section className="rounded-2xl border border-white bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-7">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder={t("Search by name, email, or phone...")}
              className="h-11 w-full rounded-xl border border-[#d6e8f2] bg-[#f1f9fd] pl-10 pr-3 text-sm outline-none focus:border-[#0077b6] focus:bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value as typeof statusFilter);
            }}
            className="h-11 rounded-xl border border-[#d6e8f2] bg-[#f1f9fd] px-3 text-sm text-slate-700 outline-none lg:col-span-3"
          >
            <option value="all">{t("All status")}</option>
            <option value="active">{t("Active")}</option>
            <option value="inactive">{t("Inactive")}</option>
          </select>
          <div className="flex items-center rounded-xl bg-[#f1f9fd] px-3 text-sm text-slate-500 lg:col-span-2">
            {meta.total.toLocaleString()} {t("customers")}
          </div>
        </div>
      </section>

      {notice ? (
        <div className="rounded-xl border border-[#beeafa] bg-[#e2f5fc] px-4 py-3 text-sm text-[#075985]">
          {t(notice)}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-[#ffd5c8] bg-[#fdede8] px-4 py-3 text-sm text-[#c2410c]">
          {t(error)}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-white bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#e2edf4] text-slate-400">
                <th className="px-4 py-3 font-medium">{t("Customer")}</th>
                <th className="px-4 py-3 font-medium">{t("Phone")}</th>
                <th className="px-4 py-3 font-medium">{t("Orders")}</th>
                <th className="px-4 py-3 font-medium">{t("Addresses")}</th>
                <th className="px-4 py-3 font-medium">{t("Joined")}</th>
                <th className="px-4 py-3 font-medium">{t("Status")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("Loading customers...")}
                    </span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                    {t("No customers found.")}
                  </td>
                </tr>
              ) : (
                items.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-[#edf6fa] last:border-0"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-800">{customer.name}</p>
                      <p className="text-xs text-slate-400">{customer.email}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {customer.phone ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {customer.orders_count ?? 0}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {customer.addresses_count ?? 0}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(customer.created_at, language)}
                    </td>
                    <td className="px-4 py-4">
                      {canUpdate ? (
                        <button
                          type="button"
                          onClick={() => void toggleActive(customer)}
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            customer.is_active
                              ? "bg-[#e2f5fc] text-[#075985]"
                              : "bg-[#f1f5f9] text-slate-500"
                          }`}
                        >
                          {customer.is_active ? t("Active") : t("Inactive")}
                        </button>
                      ) : (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            customer.is_active
                              ? "bg-[#e2f5fc] text-[#075985]"
                              : "bg-[#f1f5f9] text-slate-500"
                          }`}
                        >
                          {customer.is_active ? t("Active") : t("Inactive")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => void openDetail(customer)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#d6e8f2] px-3 py-2 text-sm font-medium text-slate-600 hover:bg-[#f1f9fd]"
                        >
                          <Eye className="h-4 w-4" />
                          {t("View")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#e2edf4] px-4 py-3">
          <p className="text-sm text-slate-500">
            {t("Page")} {meta.current_page} {t("of")} {meta.last_page}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-lg border border-[#d6e8f2] px-3 py-1.5 text-sm font-medium text-slate-600 disabled:opacity-40"
            >
              {t("Previous")}
            </button>
            <button
              type="button"
              disabled={page >= meta.last_page || loading}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border border-[#d6e8f2] px-3 py-1.5 text-sm font-medium text-slate-600 disabled:opacity-40"
            >
              {t("Next")}
            </button>
          </div>
        </div>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-6">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e2edf4] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {selected.name}
                </h2>
                <p className="text-sm text-slate-500">{selected.email}</p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label={t("Close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center gap-2 px-5 py-16 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("Loading customer details...")}
              </div>
            ) : (
              <div className="space-y-6 px-5 py-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoCard
                    label={t("Orders")}
                    value={String(selected.orders_count ?? selected.orders?.length ?? 0)}
                  />
                  <InfoCard
                    label={t("Addresses")}
                    value={String(
                      selected.addresses_count ?? selected.addresses?.length ?? 0
                    )}
                  />
                  <InfoCard
                    label={t("Joined")}
                    value={formatDate(selected.created_at, language)}
                  />
                  <InfoCard
                    label={t("Status")}
                    value={selected.is_active ? t("Active") : t("Inactive")}
                  />
                </div>

                <div className="rounded-xl border border-[#e2edf4] bg-[#f1f9fd] p-4">
                  <h3 className="text-sm font-semibold text-slate-800">
                    {t("Account details")}
                  </h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-slate-700">{t("Name")}</span>
                      <input
                        value={editName}
                        disabled={!canUpdate}
                        onChange={(event) => setEditName(event.target.value)}
                        className="h-11 w-full rounded-xl border border-[#d6e8f2] bg-white px-3 text-sm outline-none disabled:opacity-60"
                      />
                      {formErrors.name?.[0] ? (
                        <span className="text-xs text-[#fa896b]">
                          {t(formErrors.name[0])}
                        </span>
                      ) : null}
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-slate-700">{t("Email")}</span>
                      <input
                        type="email"
                        value={editEmail}
                        disabled={!canUpdate}
                        onChange={(event) => setEditEmail(event.target.value)}
                        className="h-11 w-full rounded-xl border border-[#d6e8f2] bg-white px-3 text-sm outline-none disabled:opacity-60"
                      />
                      {formErrors.email?.[0] ? (
                        <span className="text-xs text-[#fa896b]">
                          {t(formErrors.email[0])}
                        </span>
                      ) : null}
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-slate-700">{t("Phone")}</span>
                      <input
                        value={editPhone}
                        disabled={!canUpdate}
                        onChange={(event) => setEditPhone(event.target.value)}
                        className="h-11 w-full rounded-xl border border-[#d6e8f2] bg-white px-3 text-sm outline-none disabled:opacity-60"
                      />
                    </label>
                    <label className="flex items-center gap-2 pt-7 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={editActive}
                        disabled={!canUpdate}
                        onChange={(event) => setEditActive(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[#0077b6]"
                      />
                      {t("Active account")}
                    </label>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-[#e2edf4]">
                  <div className="border-b border-[#e2edf4] bg-[#f1f9fd] px-4 py-3 text-sm font-semibold text-slate-700">
                    {t("Addresses")}
                  </div>
                  {(selected.addresses ?? []).length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">
                      {t("No addresses on file.")}
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#edf6fa]">
                      {selected.addresses?.map((address) => (
                        <li key={address.id} className="px-4 py-3 text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-slate-800">
                                {t(address.label ?? "Address")} · {address.full_name}
                              </p>
                              <p className="mt-1 text-slate-600">
                                {address.line1}
                                {address.line2 ? `, ${address.line2}` : ""}
                              </p>
                              <p className="text-slate-600">
                                {[address.city, address.state, address.postal_code]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                              <p className="text-slate-500">{address.country}</p>
                            </div>
                            {address.is_default ? (
                              <span className="rounded-full bg-[#e2f5fc] px-2.5 py-1 text-xs font-semibold text-[#0077b6]">
                                {t("Default")}
                              </span>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="overflow-hidden rounded-xl border border-[#e2edf4]">
                  <div className="border-b border-[#e2edf4] bg-[#f1f9fd] px-4 py-3 text-sm font-semibold text-slate-700">
                    {t("Recent orders")}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#e2edf4] text-slate-400">
                          <th className="px-4 py-3 font-medium">{t("Order")}</th>
                          <th className="px-4 py-3 font-medium">{t("Placed")}</th>
                          <th className="px-4 py-3 font-medium">{t("Status")}</th>
                          <th className="px-4 py-3 font-medium">{t("Payment")}</th>
                          <th className="px-4 py-3 font-medium">{t("Total")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selected.orders ?? []).length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-8 text-center text-slate-500"
                            >
                              {t("No orders yet.")}
                            </td>
                          </tr>
                        ) : (
                          selected.orders?.map((order) => (
                            <tr
                              key={order.id}
                              className="border-b border-[#edf6fa] last:border-0"
                            >
                              <td className="px-4 py-3 font-medium text-slate-700">
                                {order.order_number}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {formatDate(order.placed_at ?? order.created_at, language)}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusTone(order.status)}`}
                                >
                                  {t(order.status)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusTone(order.payment_status)}`}
                                >
                                  {t(order.payment_status)}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-800">
                                {money(order.grand_total, order.currency)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-[#e2edf4] pt-4">
                  <button
                    type="button"
                    onClick={closeDetail}
                    className="rounded-xl border border-[#d6e8f2] px-4 py-2.5 text-sm font-semibold text-slate-600"
                  >
                    {t("Close")}
                  </button>
                  {canUpdate ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void saveCustomer()}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0077b6] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {t("Save changes")}
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  const t = useAdminText();
  return (
    <div className="rounded-xl border border-[#e2edf4] bg-[#f1f9fd] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{t(label)}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  );
}
