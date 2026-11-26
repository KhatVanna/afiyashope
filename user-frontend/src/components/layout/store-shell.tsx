import { CartDrawer } from "@/components/cart/cart-drawer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteSplash } from "@/components/layout/site-splash";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { ContactChatButton } from "@/components/layout/contact-chat-button";
import type { CatalogCategory } from "@/data/demo-catalog.types";

type StoreShellProps = {
  categories: CatalogCategory[];
  children: React.ReactNode;
};

export function StoreShell({ categories, children }: StoreShellProps) {
  return (
    <>
      <SiteSplash />
      <SiteHeader categories={categories} />
      <main className="flex-1">{children}</main>
      <CartDrawer />
      <ContactChatButton />
      <ScrollToTop />
    </>
  );
}
