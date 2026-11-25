import type { Metadata } from "next";
import Link from "next/link";
import { LocaleText } from "@/components/i18n/locale-text";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Afiya Shope order.",
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-navy">
        <LocaleText en="Checkout" km="ទូទាត់ប្រាក់" />
      </h1>
      <p className="mt-2 text-muted-foreground">
        <LocaleText
          en="Full checkout with addresses and payments arrives in Phase 6."
          km="មុខងារទូទាត់ពេញលេញ រួមទាំងអាសយដ្ឋាន និងការបង់ប្រាក់ នឹងមាននៅដំណាក់កាលទី ៦។"
        />
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li><LocaleText en="1. Customer information" km="១. ព័ត៌មានអតិថិជន" /></li>
          <li><LocaleText en="2. Shipping address" km="២. អាសយដ្ឋានដឹកជញ្ជូន" /></li>
          <li><LocaleText en="3. Delivery method" km="៣. វិធីដឹកជញ្ជូន" /></li>
          <li><LocaleText en="4. Payment method" km="៤. វិធីបង់ប្រាក់" /></li>
          <li><LocaleText en="5. Order summary" km="៥. សេចក្តីសង្ខេបការបញ្ជាទិញ" /></li>
        </ol>
        <Link
          href="/products"
          className="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <LocaleText en="Back to shop" km="ត្រឡប់ទៅទិញទំនិញ" />
        </Link>
      </div>
    </div>
  );
}
