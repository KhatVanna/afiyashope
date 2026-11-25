"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountDashboard } from "@/components/account/account-dashboard";
import { useLocaleText } from "@/components/i18n/locale-text";
import { useAuthStore } from "@/stores/auth-store";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export function LoginForm() {
  const t = useLocaleText();
  const translateError = (message?: string) => {
    if (!message) return "";
    const translations: Record<string, string> = {
      "Enter a valid email": "សូមបញ្ចូលអ៊ីមែលត្រឹមត្រូវ",
      "Password is required": "សូមបញ្ចូលពាក្យសម្ងាត់",
      "Name is required": "សូមបញ្ចូលឈ្មោះ",
      "Password must be at least 8 characters": "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៨ តួអក្សរ",
      "Confirm your password": "សូមបញ្ជាក់ពាក្យសម្ងាត់",
      "Passwords do not match": "ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ",
      "Unable to sign in with these credentials.": "មិនអាចចូលគណនីដោយប្រើព័ត៌មាននេះបានទេ។",
      "Unable to create this account.": "មិនអាចបង្កើតគណនីនេះបានទេ។",
      "Unable to reach the authentication server.": "មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេផ្ទៀងផ្ទាត់គណនីបានទេ។",
    };
    return t(message, translations[message] ?? message);
  };
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const setUser = useAuthStore((state) => state.setUser);
  const hydrate = useAuthStore((state) => state.hydrate);
  const [mode, setMode] = useState<"login" | "register">("login");

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
    },
  });

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  async function onLogin(values: LoginFormValues) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(values),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        const message =
          payload?.errors?.email?.[0] ??
          payload?.message ??
          t("Unable to sign in with these credentials.", "មិនអាចចូលគណនីដោយប្រើព័ត៌មាននេះបានទេ។");
        loginForm.setError("root", { message });
        return;
      }

      setUser(payload.data.user);
      router.refresh();
    } catch {
      loginForm.setError("root", {
        message: t(
          "Unable to reach the authentication server.",
          "មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេផ្ទៀងផ្ទាត់គណនីបានទេ។"
        ),
      });
    }
  }

  async function onRegister(values: RegisterFormValues) {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(values),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        const message =
          payload?.errors?.email?.[0] ??
          payload?.errors?.password?.[0] ??
          payload?.message ??
          t("Unable to create this account.", "មិនអាចបង្កើតគណនីនេះបានទេ។");
        registerForm.setError("root", { message });
        return;
      }

      setUser(payload.data.user);
      router.refresh();
    } catch {
      registerForm.setError("root", {
        message: t(
          "Unable to reach the authentication server.",
          "មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេផ្ទៀងផ្ទាត់គណនីបានទេ។"
        ),
      });
    }
  }

  if (!hydrated) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm text-muted-foreground">
          {t("Checking session...", "កំពុងពិនិត្យស្ថានភាពចូលគណនី...")}
        </p>
      </div>
    );
  }

  if (user) {
    return <AccountDashboard />;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <h1 className="text-3xl font-semibold tracking-tight text-navy">
        {mode === "login"
          ? t("Sign in", "ចូលគណនី")
          : t("Create account", "បង្កើតគណនី")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t(
          "Customer accounts only. Staff and admin must use the admin portal.",
          "សម្រាប់គណនីអតិថិជនប៉ុណ្ណោះ។ បុគ្គលិក និងអ្នកគ្រប់គ្រងត្រូវប្រើប្រព័ន្ធគ្រប់គ្រង។"
        )}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-muted/60 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          {t("Sign in", "ចូលគណនី")}
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            mode === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          {t("Register", "ចុះឈ្មោះ")}
        </button>
      </div>

      {mode === "login" ? (
        <form
          className="mt-8 space-y-4"
          onSubmit={loginForm.handleSubmit(onLogin)}
          noValidate
        >
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              {t("Email", "អ៊ីមែល")}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              {...loginForm.register("email")}
            />
            {loginForm.formState.errors.email ? (
              <p className="mt-1 text-xs text-error">
                {translateError(loginForm.formState.errors.email.message)}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              {t("Password", "ពាក្យសម្ងាត់")}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              {...loginForm.register("password")}
            />
            {loginForm.formState.errors.password ? (
              <p className="mt-1 text-xs text-error">
                {translateError(loginForm.formState.errors.password.message)}
              </p>
            ) : null}
          </div>

          {loginForm.formState.errors.root ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-error dark:bg-red-950/40">
              {translateError(loginForm.formState.errors.root.message)}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loginForm.formState.isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {loginForm.formState.isSubmitting
              ? t("Signing in...", "កំពុងចូលគណនី...")
              : t("Continue", "បន្ត")}
          </button>
        </form>
      ) : (
        <form
          className="mt-8 space-y-4"
          onSubmit={registerForm.handleSubmit(onRegister)}
          noValidate
        >
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
              {t("Full name", "ឈ្មោះពេញ")}
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              {...registerForm.register("name")}
            />
            {registerForm.formState.errors.name ? (
              <p className="mt-1 text-xs text-error">
                {translateError(registerForm.formState.errors.name.message)}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="register-email" className="mb-1.5 block text-sm font-medium">
              {t("Email", "អ៊ីមែល")}
            </label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              {...registerForm.register("email")}
            />
            {registerForm.formState.errors.email ? (
              <p className="mt-1 text-xs text-error">
                {translateError(registerForm.formState.errors.email.message)}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="register-password" className="mb-1.5 block text-sm font-medium">
              {t("Password", "ពាក្យសម្ងាត់")}
            </label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              {...registerForm.register("password")}
            />
            {registerForm.formState.errors.password ? (
              <p className="mt-1 text-xs text-error">
                {translateError(registerForm.formState.errors.password.message)}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="password_confirmation"
              className="mb-1.5 block text-sm font-medium"
            >
              {t("Confirm password", "បញ្ជាក់ពាក្យសម្ងាត់")}
            </label>
            <input
              id="password_confirmation"
              type="password"
              autoComplete="new-password"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              {...registerForm.register("password_confirmation")}
            />
            {registerForm.formState.errors.password_confirmation ? (
              <p className="mt-1 text-xs text-error">
                {translateError(registerForm.formState.errors.password_confirmation.message)}
              </p>
            ) : null}
          </div>

          {registerForm.formState.errors.root ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-error dark:bg-red-950/40">
              {translateError(registerForm.formState.errors.root.message)}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={registerForm.formState.isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {registerForm.formState.isSubmitting
              ? t("Creating account...", "កំពុងបង្កើតគណនី...")
              : t("Create customer account", "បង្កើតគណនីអតិថិជន")}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {t(
          "Demo customer: customer@afiyashope.test / password",
          "គណនីសាកល្បង៖ customer@afiyashope.test / password"
        )}
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        <Link href="/contact" className="underline">
          {t("Need help?", "ត្រូវការជំនួយមែនទេ?")}
        </Link>
      </p>
    </div>
  );
}
