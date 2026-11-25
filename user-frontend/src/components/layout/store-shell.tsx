import { CartDrawer } from "@/components/cart/cart-drawer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteSplash } from "@/components/layout/site-splash";
import { ScrollToTop } from "@/components/layout/scroll-to-top";

type StoreShellProps = {
  children: React.ReactNode;
};

export function StoreShell({ children }: StoreShellProps) {
  return (
    <>
      <SiteSplash />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <CartDrawer />
      <ScrollToTop />
    </>
  );
}
