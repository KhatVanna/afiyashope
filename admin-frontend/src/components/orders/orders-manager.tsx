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
import type { AdminOrder, OrdersListData } from "@/types/order";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/types/order";

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

function formatDate(value: string | null, language: AdminLanguage) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(language === "km" ? "km-KH" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
    case "partially_refunded":
      return "bg-[#fdede8] text-[#c2410c]";
    default:
      return "bg-[#f1f5f9] text-slate-500";
  }
}

function canUpdateOrders(roleSlugs: string[]) {
  return (
    roleSlugs.includes("super-admin") ||
    roleSlugs.includes("admin") ||
    roleSlugs.includes("staff")
  );
}

export function OrdersManager() {
  const t = useAdminText();
  const language = useAdminLanguage();
  const user = useAuthStore((state) => state.user);
  const roleSlugs = useMemo(
    () => user?.roles?.map((role) => role.slug) ?? [],
    [user]
  );
  const canUpdate = canUpdateOrders(roleSlugs);

  const [items, setItems] = useState<AdminOrder[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
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

  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editPaymentStatus, setEditPaymentStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      per_page: "15",
    });
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (paymentFilter) params.set("payment_status", paymentFilter);

    const { ok, payload } = await adminApi<OrdersListData>(
      `/admin/orders?${params.toString()}`
    );

    if (!ok || !payload.success) {
      setError(payload.message || "Unable to load orders.");
      setItems([]);
      setLoading(false);
      return;
    }

    setItems(payload.data.items);
    setMeta(payload.data.meta);
    setLoading(false);
  }, [page, search, statusFilter, paymentFilter]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  async function openDetail(order: AdminOrder) {
    setDetailLoading(true);
    setSelected(order);
    setEditStatus(order.status);
    setEditPaymentStatus(order.payment_status);
    setEditNotes(order.notes ?? "");

    const { ok, payload } = await adminApi<{ order: AdminOrder }>(
      `/admin/orders/${order.id}`
    );

    setDetailLoading(false);

    if (!ok || !payload.success) {
      setError(payload.message || "Unable to load order details.");
      return;
    }

    setSelected(payload.data.order);
    setEditStatus(payload.data.order.status);
    setEditPaymentStatus(payload.data.order.payment_status);
    setEditNotes(payload.data.order.notes ?? "");
  }

  function closeDetail() {
    setSelected(null);
  }

  async function saveOrder() {
    if (!selected || !canUpdate) return;

    setSaving(true);
    setNotice(null);

    const { ok, payload } = await adminApi<{ order: AdminOrder }>(
      `/admin/orders/${selected.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status: editStatus,
          payment_status: editPaymentStatus,
          notes: editNotes.trim() || null,
        }),
      }
    );

    setSaving(false);

    if (!ok || !payload.success) {
      setError(payload.message || "Unable to update order.");
      return;
    }

    setSelected(payload.data.order);
    setNotice("Order updated.");
    await loadOrders();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-800">
          {t("Orders")}
        </h1>
        <p className="mt-2 text-slate-500">
          {t("Track customer orders, update fulfillment status, and review payments.")}
        </p>
      </div>

      <section className="rounded-2xl border border-white bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder={t("Search order #, email, phone, customer...")}
              className="h-11 w-full rounded-xl border border-[#d6e8f2] bg-[#f1f9fd] pl-10 pr-3 text-sm outline-none focus:border-[#0077b6] focus:bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value);
            }}
            className="h-11 rounded-xl border border-[#d6e8f2] bg-[#f1f9fd] px-3 text-sm text-slate-700 outline-none lg:col-span-3"
          >
            <option value="">{t("All statuses")}</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(status)}
              </option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(event) => {
              setPage(1);
              setPaymentFilter(event.target.value);
            }}
            className="h-11 rounded-xl border border-[#d6e8f2] bg-[#f1f9fd] px-3 text-sm text-slate-700 outline-none lg:col-span-2"
          >
            <option value="">{t("All payments")}</option>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(status)}
              </option>
            ))}
          </select>
          <div className="flex items-center rounded-xl bg-[#f1f9fd] px-3 text-sm text-slate-500 lg:col-span-2">
            {meta.total.toLocaleString()} {t("orders")}
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
                <th className="px-4 py-3 font-medium">{t("Order")}</th>
                <th className="px-4 py-3 font-medium">{t("Customer")}</th>
                <th className="px-4 py-3 font-medium">{t("Placed")}</th>
                <th className="px-4 py-3 font-medium">{t("Items")}</th>
                <th className="px-4 py-3 font-medium">{t("Total")}</th>
                <th className="px-4 py-3 font-medium">{t("Status")}</th>
                <th className="px-4 py-3 font-medium">{t("Payment")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("Loading orders...")}
                    </span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-500">
                    {t("No orders found.")}
                  </td>
                </tr>
              ) : (
                items.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[#edf6fa] last:border-0"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-800">
                        {order.order_number}
                      </p>
                      <p className="text-xs text-slate-400">#{order.id}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-700">
                        {order.customer?.name ?? t("Guest")}
                      </p>
                      <p className="text-xs text-slate-400">
                        {order.customer_email ?? order.customer?.email ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(order.placed_at ?? order.created_at, language)}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {order.items_count ?? 0}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-800">
                      {money(order.grand_total, order.currency)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusTone(order.status)}`}
                      >
                        {t(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusTone(order.payment_status)}`}
                      >
                        {t(order.payment_status)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => void openDetail(order)}
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
                  {selected.order_number}
                </h2>
                <p className="text-sm text-slate-500">
                  {t("Placed")} {formatDate(selected.placed_at ?? selected.created_at, language)}
                </p>
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
                {t("Loading order details...")}
              </div>
            ) : (
              <div className="space-y-6 px-5 py-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoCard
                    label={t("Customer")}
                    value={selected.customer?.name ?? t("Guest")}
                    hint={selected.customer_email ?? selected.customer?.email ?? "—"}
                  />
                  <InfoCard
                    label={t("Phone")}
                    value={selected.customer_phone ?? selected.customer?.phone ?? "—"}
                  />
                  <InfoCard
                    label={t("Grand total")}
                    value={money(selected.grand_total, selected.currency)}
                  />
                  <InfoCard
                    label={t("Items")}
                    value={String(selected.items?.length ?? selected.items_count ?? 0)}
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <AddressCard
                    title={t("Shipping address")}
                    address={selected.shipping_address}
                  />
                  <AddressCard
                    title={t("Billing address")}
                    address={selected.billing_address}
                  />
                </div>

                <div className="overflow-hidden rounded-xl border border-[#e2edf4]">
                  <div className="border-b border-[#e2edf4] bg-[#f1f9fd] px-4 py-3 text-sm font-semibold text-slate-700">
                    {t("Order items")}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#e2edf4] text-slate-400">
                          <th className="px-4 py-3 font-medium">{t("Product")}</th>
                          <th className="px-4 py-3 font-medium">{t("SKU")}</th>
                          <th className="px-4 py-3 font-medium">{t("Qty")}</th>
                          <th className="px-4 py-3 font-medium">{t("Unit")}</th>
                          <th className="px-4 py-3 font-medium">{t("Total")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selected.items ?? []).length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-8 text-center text-slate-500"
                            >
                              {t("No items on this order.")}
                            </td>
                          </tr>
                        ) : (
                          selected.items?.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-[#edf6fa] last:border-0"
                            >
                              <td className="px-4 py-3 font-medium text-slate-700">
                                {item.product_name}
                              </td>
                              <td className="px-4 py-3 text-slate-500">
                                {item.sku ?? "—"}
                              </td>
                              <td className="px-4 py-3 text-slate-700">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-slate-700">
                                {money(item.unit_price, selected.currency)}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-800">
                                {money(item.total_price, selected.currency)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <TotalRow label={t("Subtotal")} value={money(selected.subtotal, selected.currency)} />
                  <TotalRow label={t("Discount")} value={money(selected.discount_total, selected.currency)} />
                  <TotalRow label={t("Shipping")} value={money(selected.shipping_total, selected.currency)} />
                  <TotalRow label={t("Tax")} value={money(selected.tax_total, selected.currency)} />
                  <TotalRow
                    label={t("Grand total")}
                    value={money(selected.grand_total, selected.currency)}
                    emphasize
                  />
                </div>

                {(selected.payments ?? []).length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-[#e2edf4]">
                    <div className="border-b border-[#e2edf4] bg-[#f1f9fd] px-4 py-3 text-sm font-semibold text-slate-700">
                      {t("Payments")}
                    </div>
                    <ul className="divide-y divide-[#edf6fa]">
                      {selected.payments?.map((payment) => (
                        <li
                          key={payment.id}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                        >
                          <div>
                            <p className="font-medium text-slate-700">
                              {payment.provider}
                              {payment.method ? ` · ${payment.method}` : ""}
                            </p>
                            <p className="text-xs text-slate-400">
                              {payment.transaction_id ?? t("No transaction id")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-800">
                              {money(payment.amount, payment.currency)}
                            </p>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusTone(payment.status)}`}
                            >
                              {t(payment.status)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="rounded-xl border border-[#e2edf4] bg-[#f1f9fd] p-4">
                  <h3 className="text-sm font-semibold text-slate-800">
                    {t("Update order")}
                  </h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-slate-700">
                        {t("Fulfillment status")}
                      </span>
                      <select
                        value={editStatus}
                        disabled={!canUpdate}
                        onChange={(event) => setEditStatus(event.target.value)}
                        className="h-11 w-full rounded-xl border border-[#d6e8f2] bg-white px-3 text-sm outline-none disabled:opacity-60"
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {t(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-slate-700">
                        {t("Payment status")}
                      </span>
                      <select
                        value={editPaymentStatus}
                        disabled={!canUpdate}
                        onChange={(event) =>
                          setEditPaymentStatus(event.target.value)
                        }
                        className="h-11 w-full rounded-xl border border-[#d6e8f2] bg-white px-3 text-sm outline-none disabled:opacity-60"
                      >
                        {PAYMENT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {t(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="mt-4 block space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">{t("Notes")}</span>
                    <textarea
                      rows={3}
                      value={editNotes}
                      disabled={!canUpdate}
                      onChange={(event) => setEditNotes(event.target.value)}
                      className="w-full rounded-xl border border-[#d6e8f2] bg-white px-3 py-2 text-sm outline-none disabled:opacity-60"
                      placeholder={t("Internal fulfillment notes...")}
                    />
                  </label>
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
                      onClick={() => void saveOrder()}
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

function InfoCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[#e2edf4] bg-[#f1f9fd] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function AddressCard({
  title,
  address,
}: {
  title: string;
  address: AdminOrder["shipping_address"];
}) {
  const t = useAdminText();
  return (
    <div className="rounded-xl border border-[#e2edf4] px-4 py-3">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {address ? (
        <div className="mt-2 space-y-0.5 text-sm text-slate-600">
          {address.full_name ? <p>{address.full_name}</p> : null}
          {address.line1 ? <p>{address.line1}</p> : null}
          {address.line2 ? <p>{address.line2}</p> : null}
          <p>
            {[address.city, address.state, address.postal_code]
              .filter(Boolean)
              .join(", ")}
          </p>
          {address.country ? <p>{address.country}</p> : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-400">{t("No address on file.")}</p>
      )}
    </div>
  );
}

function TotalRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#e2edf4] px-3 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p
        className={`mt-1 ${emphasize ? "text-base font-semibold text-slate-800" : "text-sm font-medium text-slate-700"}`}
      >
        {value}
      </p>
    </div>
  );
}
