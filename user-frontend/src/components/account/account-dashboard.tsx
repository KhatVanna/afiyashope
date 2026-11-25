"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Heart,
  KeyRound,
  Loader2,
  MapPin,
  Package,
  Settings2,
  Trash2,
  UserRound,
} from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { useLocaleText } from "@/components/i18n/locale-text";
import { storeApi } from "@/lib/store-api";
import { useFormatMoney } from "@/hooks/use-format-money";
import {
  getLanguageName,
  REGION_PRESETS,
  useRegionLanguage,
  useRegionStore,
} from "@/stores/region-store";
import { useAuthStore } from "@/stores/auth-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import type { AuthUser } from "@/types/auth";
import type { CustomerAddress, CustomerOrder } from "@/types/account";

type TabId =
  | "profile"
  | "addresses"
  | "orders"
  | "wishlist"
  | "security"
  | "preferences";

const TABS: Array<{ id: TabId; label: string; icon: typeof UserRound }> = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "orders", label: "Orders", icon: Package },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "security", label: "Security", icon: KeyRound },
  { id: "preferences", label: "Preferences", icon: Settings2 },
];

const STATUS_LABELS: Record<string, string> = {
  pending: "កំពុងរង់ចាំ",
  confirmed: "បានបញ្ជាក់",
  processing: "កំពុងដំណើរការ",
  shipped: "បានដឹកជញ្ជូន",
  delivered: "បានប្រគល់",
  cancelled: "បានបោះបង់",
  failed: "បរាជ័យ",
  paid: "បានបង់ប្រាក់",
  refunded: "បានសងប្រាក់វិញ",
};

const TAB_LABELS: Record<string, string> = {
  Profile: "ប្រវត្តិរូប",
  Addresses: "អាសយដ្ឋាន",
  Orders: "ការបញ្ជាទិញ",
  Wishlist: "បញ្ជីចំណូលចិត្ត",
  Security: "សុវត្ថិភាព",
  Preferences: "ចំណូលចិត្ត",
};

const EMPTY_ADDRESS = {
  label: "Home",
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "KH",
  is_default: true,
};

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

function formatDate(value: string | null | undefined, language: "EN" | "KM") {
  if (!value) return "—";
  return new Intl.DateTimeFormat(language === "KM" ? "km-KH" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusTone(status: string) {
  switch (status) {
    case "delivered":
    case "paid":
      return "bg-emerald-50 text-emerald-700";
    case "confirmed":
    case "processing":
    case "shipped":
      return "bg-cyan-50 text-cyan-800";
    case "pending":
      return "bg-amber-50 text-amber-700";
    case "cancelled":
    case "failed":
    case "refunded":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function AccountDashboard() {
  const t = useLocaleText();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const [tab, setTab] = useState<TabId>("profile");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-navy">
            {t("My Account", "គណនីរបស់ខ្ញុំ")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t(
              `Welcome back, ${user.name}. Manage your profile, orders, and preferences.`,
              `សូមស្វាគមន៍មកវិញ ${user.name}។ គ្រប់គ្រងប្រវត្តិរូប ការបញ្ជាទិញ និងចំណូលចិត្តរបស់អ្នក។`
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-lg border border-foreground px-4 py-2.5 text-sm font-semibold"
          >
            {t("Continue shopping", "បន្តទិញទំនិញ")}
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
          >
            {t("Log out", "ចាកចេញ")}
          </button>
        </div>
      </div>

      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-border bg-card p-3 shadow-sm">
          <nav className="space-y-1">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTab(item.id);
                    setNotice(null);
                    setError(null);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.label, TAB_LABELS[item.label] ?? item.label)}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          {tab === "profile" ? (
            <ProfilePanel
              user={user}
              onSaved={(next) => {
                setUser(next);
                setNotice(t("Profile updated.", "បានធ្វើបច្ចុប្បន្នភាពប្រវត្តិរូប។"));
              }}
              onError={setError}
            />
          ) : null}
          {tab === "addresses" ? (
            <AddressesPanel
              onNotice={setNotice}
              onError={setError}
            />
          ) : null}
          {tab === "orders" ? <OrdersPanel onError={setError} /> : null}
          {tab === "wishlist" ? <WishlistPanel /> : null}
          {tab === "security" ? (
            <SecurityPanel
              onNotice={setNotice}
              onError={setError}
            />
          ) : null}
          {tab === "preferences" ? <PreferencesPanel /> : null}
        </section>
      </div>
    </div>
  );
}

function ProfilePanel({
  user,
  onSaved,
  onError,
}: {
  user: AuthUser;
  onSaved: (user: AuthUser) => void;
  onError: (message: string | null) => void;
}) {
  const t = useLocaleText();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone ?? "");
  }, [user]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    onError(null);

    const { ok, payload } = await storeApi<{ user: AuthUser }>("/account/profile", {
      method: "PATCH",
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
      }),
    });

    setSaving(false);

    if (!payload.success) {
      onError(
        payload.errors?.email?.[0] ??
          payload.errors?.name?.[0] ??
          payload.message ??
          t("Unable to update profile.", "មិនអាចធ្វើបច្ចុប្បន្នភាពប្រវត្តិរូបបានទេ។")
      );
      return;
    }
    if (!ok) {
      onError(t("Unable to update profile.", "មិនអាចធ្វើបច្ចុប្បន្នភាពប្រវត្តិរូបបានទេ។"));
      return;
    }

    onSaved(payload.data.user);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-navy">
          {t("Profile details", "ព័ត៌មានប្រវត្តិរូប")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Update your name, email, and phone number.", "ធ្វើបច្ចុប្បន្នភាពឈ្មោះ អ៊ីមែល និងលេខទូរស័ព្ទរបស់អ្នក។")}
        </p>
      </div>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">{t("Full name", "ឈ្មោះពេញ")}</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t("Email", "អ៊ីមែល")}</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t("Phone", "លេខទូរស័ព្ទ")}</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("Save profile", "រក្សាទុកប្រវត្តិរូប")}
          </button>
        </div>
      </form>
    </div>
  );
}

function AddressesPanel({
  onNotice,
  onError,
}: {
  onNotice: (message: string | null) => void;
  onError: (message: string | null) => void;
}) {
  const t = useLocaleText();
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    ...EMPTY_ADDRESS,
    label: t("Home", "ផ្ទះ"),
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { ok, payload } = await storeApi<{ items: CustomerAddress[] }>(
      "/account/addresses"
    );
    setLoading(false);
    if (!ok || !payload.success) {
      onError(payload.message || t("Unable to load addresses.", "មិនអាចផ្ទុកអាសយដ្ឋានបានទេ។"));
      return;
    }
    setItems(payload.data.items);
  }, [onError, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function startCreate() {
    setEditingId(null);
    setForm({
      ...EMPTY_ADDRESS,
      label: t("Home", "ផ្ទះ"),
      full_name: user?.name ?? "",
      phone: user?.phone ?? "",
      is_default: items.length === 0,
    });
    setShowForm(true);
  }

  function startEdit(address: CustomerAddress) {
    setEditingId(address.id);
    setForm({
      label: address.label ?? t("Home", "ផ្ទះ"),
      full_name: address.full_name,
      phone: address.phone ?? "",
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state ?? "",
      postal_code: address.postal_code ?? "",
      country: address.country || "KH",
      is_default: address.is_default,
    });
    setShowForm(true);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    onError(null);

    const body = {
      ...form,
      label: form.label.trim() || null,
      phone: form.phone.trim() || null,
      line2: form.line2.trim() || null,
      state: form.state.trim() || null,
      postal_code: form.postal_code.trim() || null,
    };

    const path = editingId
      ? `/account/addresses/${editingId}`
      : "/account/addresses";
    const method = editingId ? "PUT" : "POST";

    const { ok, payload } = await storeApi<{ address: CustomerAddress }>(path, {
      method,
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (!ok || !payload.success) {
      onError(payload.message || t("Unable to save address.", "មិនអាចរក្សាទុកអាសយដ្ឋានបានទេ។"));
      return;
    }

    onNotice(
      editingId
        ? t("Address updated.", "បានធ្វើបច្ចុប្បន្នភាពអាសយដ្ឋាន។")
        : t("Address added.", "បានបន្ថែមអាសយដ្ឋាន។")
    );
    setEditingId(null);
    setShowForm(false);
    setForm({ ...EMPTY_ADDRESS, label: t("Home", "ផ្ទះ") });
    await load();
  }

  async function onDelete(address: CustomerAddress) {
    if (!window.confirm(t(
      `Delete address “${address.label ?? address.line1}”?`,
      `តើអ្នកចង់លុបអាសយដ្ឋាន “${address.label ?? address.line1}” មែនទេ?`
    ))) {
      return;
    }
    const { ok, payload } = await storeApi<null>(
      `/account/addresses/${address.id}`,
      { method: "DELETE" }
    );
    if (!ok || !payload.success) {
      onError(payload.message || t("Unable to delete address.", "មិនអាចលុបអាសយដ្ឋានបានទេ។"));
      return;
    }
    onNotice(t("Address deleted.", "បានលុបអាសយដ្ឋាន។"));
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy">{t("Addresses", "អាសយដ្ឋាន")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Manage shipping and billing addresses.", "គ្រប់គ្រងអាសយដ្ឋានដឹកជញ្ជូន និងវិក្កយបត្រ។")}
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          {t("Add address", "បន្ថែមអាសយដ្ឋាន")}
        </button>
      </div>

      {loading ? (
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {t("Loading addresses...", "កំពុងផ្ទុកអាសយដ្ឋាន...")}
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("No addresses yet.", "មិនទាន់មានអាសយដ្ឋានទេ។")}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((address) => (
            <li
              key={address.id}
              className="rounded-xl border border-border bg-muted/30 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="text-sm">
                  <p className="font-semibold">
                    {address.label ?? t("Address", "អាសយដ្ឋាន")} · {address.full_name}
                    {address.is_default ? (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {t("Default", "លំនាំដើម")}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                  </p>
                  <p className="text-muted-foreground">
                    {[address.city, address.state, address.postal_code]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="text-muted-foreground">{address.country}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(address)}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium"
                  >
                    {t("Edit", "កែសម្រួល")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(address)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600"
                  >
                    {t("Delete", "លុប")}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-border bg-muted/20 p-4"
        >
          <h3 className="font-semibold">
            {editingId
              ? t("Edit address", "កែសម្រួលអាសយដ្ឋាន")
              : t("New address", "អាសយដ្ឋានថ្មី")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["label", t("Label", "ស្លាក")],
                ["full_name", t("Full name", "ឈ្មោះពេញ")],
                ["phone", t("Phone", "លេខទូរស័ព្ទ")],
                ["line1", t("Address line 1", "អាសយដ្ឋានបន្ទាត់ទី ១")],
                ["line2", t("Address line 2", "អាសយដ្ឋានបន្ទាត់ទី ២")],
                ["city", t("City", "ក្រុង/ស្រុក")],
                ["state", t("State / Province", "ខេត្ត")],
                ["postal_code", t("Postal code", "លេខប្រៃសណីយ៍")],
                ["country", t("Country code", "លេខកូដប្រទេស")],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block space-y-1.5">
                <span className="text-sm font-medium">{label}</span>
                <input
                  required={["full_name", "line1", "city", "country"].includes(key)}
                  value={form[key]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </label>
            ))}
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  is_default: event.target.checked,
                }))
              }
            />
            {t("Set as default address", "កំណត់ជាអាសយដ្ឋានលំនាំដើម")}
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("Save address", "រក្សាទុកអាសយដ្ឋាន")}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setShowForm(false);
                setForm({ ...EMPTY_ADDRESS, label: t("Home", "ផ្ទះ") });
              }}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold"
            >
              {t("Cancel", "បោះបង់")}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function OrdersPanel({ onError }: { onError: (message: string | null) => void }) {
  const t = useLocaleText();
  const language = useRegionLanguage();
  const formatMoney = useFormatMoney();
  const [items, setItems] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CustomerOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { ok, payload } = await storeApi<{
        items: CustomerOrder[];
      }>("/account/orders");
      setLoading(false);
      if (!ok || !payload.success) {
        onError(payload.message || t("Unable to load orders.", "មិនអាចផ្ទុកការបញ្ជាទិញបានទេ។"));
        return;
      }
      setItems(payload.data.items);
    })();
  }, [onError, t]);

  async function openOrder(order: CustomerOrder) {
    setDetailLoading(true);
    setSelected(order);
    const { ok, payload } = await storeApi<{ order: CustomerOrder }>(
      `/account/orders/${order.id}`
    );
    setDetailLoading(false);
    if (!ok || !payload.success) {
      onError(payload.message || t("Unable to load order.", "មិនអាចផ្ទុកព័ត៌មានការបញ្ជាទិញបានទេ។"));
      return;
    }
    setSelected(payload.data.order);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-navy">{t("Order history", "ប្រវត្តិការបញ្ជាទិញ")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Track your past and current orders.", "តាមដានការបញ្ជាទិញពីមុន និងបច្ចុប្បន្នរបស់អ្នក។")}
        </p>
      </div>

      {loading ? (
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {t("Loading orders...", "កំពុងផ្ទុកការបញ្ជាទិញ...")}
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">{t("No orders yet.", "មិនទាន់មានការបញ្ជាទិញទេ។")}</p>
          <Link
            href="/products"
            className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
          >
            {t("Start shopping", "ចាប់ផ្តើមទិញទំនិញ")}
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="px-4 py-3 font-medium">{t("Order", "ការបញ្ជាទិញ")}</th>
                <th className="px-4 py-3 font-medium">{t("Date", "កាលបរិច្ឆេទ")}</th>
                <th className="px-4 py-3 font-medium">{t("Status", "ស្ថានភាព")}</th>
                <th className="px-4 py-3 font-medium">{t("Payment", "ការបង់ប្រាក់")}</th>
                <th className="px-4 py-3 font-medium">{t("Total", "សរុប")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("Action", "សកម្មភាព")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold">{order.order_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(order.placed_at ?? order.created_at, language)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusTone(order.status)}`}
                    >
                      {t(order.status, STATUS_LABELS[order.status] ?? order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusTone(order.payment_status)}`}
                    >
                      {t(
                        order.payment_status,
                        STATUS_LABELS[order.payment_status] ?? order.payment_status
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {formatMoney(order.grand_total)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void openOrder(order)}
                      className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium"
                    >
                      {t("View", "មើល")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{selected.order_number}</h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(selected.placed_at ?? selected.created_at, language)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {t("Close", "បិទ")}
            </button>
          </div>
          {detailLoading ? (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("Loading details...", "កំពុងផ្ទុកព័ត៌មាន...")}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {(selected.items ?? []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-muted-foreground">
                      {t(`Qty ${item.quantity}`, `ចំនួន ${item.quantity}`)}
                      {item.sku ? ` · ${item.sku}` : ""}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {money(item.total_price, selected.currency)}
                  </p>
                </div>
              ))}
              <div className="border-t border-border pt-3 text-sm font-semibold">
                {t("Total:", "សរុប៖")} {money(selected.grand_total, selected.currency)}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function WishlistPanel() {
  const t = useLocaleText();
  const items = useWishlistStore((state) => state.items);
  const removeItem = useWishlistStore((state) => state.removeItem);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-navy">{t("Wishlist", "បញ្ជីចំណូលចិត្ត")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Products you saved for later.", "ទំនិញដែលអ្នកបានរក្សាទុកសម្រាប់ពេលក្រោយ។")}
        </p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">{t("Your wishlist is empty.", "បញ្ជីចំណូលចិត្តរបស់អ្នកមិនទាន់មានទំនិញទេ។")}</p>
          <Link
            href="/products"
            className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
          >
            {t("Browse products", "មើលទំនិញ")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((product) => (
            <div key={product.id} className="relative">
              <ProductCard product={product} />
              <button
                type="button"
                onClick={() => removeItem(product.id)}
                className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-red-600"
                aria-label={t(`Remove ${product.name}`, `ដក ${product.name} ចេញ`)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SecurityPanel({
  onNotice,
  onError,
}: {
  onNotice: (message: string | null) => void;
  onError: (message: string | null) => void;
}) {
  const t = useLocaleText();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    onError(null);

    const { ok, payload } = await storeApi<null>("/account/password", {
      method: "PUT",
      body: JSON.stringify({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });

    setSaving(false);

    if (!payload.success) {
      onError(
        payload.errors?.current_password?.[0] ??
          payload.errors?.password?.[0] ??
          payload.message ??
          t("Unable to update password.", "មិនអាចធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់បានទេ។")
      );
      return;
    }
    if (!ok) {
      onError(t("Unable to update password.", "មិនអាចធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់បានទេ។"));
      return;
    }

    setCurrentPassword("");
    setPassword("");
    setPasswordConfirmation("");
    onNotice(t("Password updated successfully.", "បានធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់ដោយជោគជ័យ។"));
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-navy">{t("Security", "សុវត្ថិភាព")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Change your account password.", "ផ្លាស់ប្តូរពាក្យសម្ងាត់គណនីរបស់អ្នក។")}
        </p>
      </div>
      <form className="max-w-md space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t("Current password", "ពាក្យសម្ងាត់បច្ចុប្បន្ន")}</span>
          <input
            required
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t("New password", "ពាក្យសម្ងាត់ថ្មី")}</span>
          <input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t("Confirm new password", "បញ្ជាក់ពាក្យសម្ងាត់ថ្មី")}</span>
          <input
            required
            type="password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("Update password", "ធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់")}
        </button>
      </form>
    </div>
  );
}

function PreferencesPanel() {
  const t = useLocaleText();
  const regionId = useRegionStore((state) => state.regionId);
  const setRegionId = useRegionStore((state) => state.setRegionId);
  const hydrate = useRegionStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const current = useMemo(
    () => REGION_PRESETS.find((preset) => preset.id === regionId) ?? REGION_PRESETS[0],
    [regionId]
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-navy">{t("Preferences", "ចំណូលចិត្ត")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            `Choose your language and currency. Current: ${getLanguageName(current.language, current.language)} · ${current.currencySymbol}`,
            `ជ្រើសរើសភាសា និងរូបិយប័ណ្ណ។ បច្ចុប្បន្ន៖ ${getLanguageName(current.language, "KM")} · ${current.currencySymbol}`
          )}
        </p>
      </div>
      <div className="grid gap-3">
        {REGION_PRESETS.map((preset) => {
          const selected = preset.id === current.id;
          const currencyLabel =
            preset.currency === "KHR" && current.language === "EN"
              ? "KHR"
              : preset.currencySymbol;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setRegionId(preset.id)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preset.flagSrc}
                alt=""
                className="h-5 w-7 rounded-sm object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  {getLanguageName(preset.language, current.language)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {currencyLabel} · {preset.language}
                </span>
              </span>
              {selected ? (
                <span className="text-xs font-semibold text-primary">{t("Selected", "បានជ្រើសរើស")}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
