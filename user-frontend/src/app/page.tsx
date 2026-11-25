import { CategoryGrid } from "@/components/home/category-grid";
import { HeroSlider } from "@/components/home/hero-slider";
import { ProductSection } from "@/components/home/product-section";
import { PromoBanner } from "@/components/home/promo-banner";
import { TrustBar } from "@/components/home/trust-bar";
import { VideoBanner } from "@/components/home/video-banner";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { fetchProducts } from "@/lib/catalog-api";
import { fetchSiteBanners } from "@/lib/site-content-api";

export default async function HomePage() {
  const [featured, catalog, banners] = await Promise.all([
    fetchProducts({ featured: true, perPage: 20, sort: "latest" }),
    fetchProducts({ perPage: 50, sort: "latest" }),
    fetchSiteBanners(),
  ]);

  const featuredIds = new Set(featured.items.map((product) => product.id));
  const popularStyles = [
    ...featured.items,
    ...catalog.items.filter((product) => !featuredIds.has(product.id)),
  ].slice(0, 20);

  return (
    <>
      <HeroSlider banners={banners} />
      <CategoryGrid />
      <div className="bg-muted/40">
        <ProductSection
          title="ម៉ូដពេញនិយម"
          subtitle="ម៉ូដពិសេសដែលត្រូវពេញនិយម"
          products={catalog.error ? [] : popularStyles}
          error={catalog.error}
          href="/products?sort=offers"
          ctaLabel="Show more"
          staggerCards
        />
      </div>
      {catalog.error ? null : (
        <ProductSection
          title="ការរក្សាទុកម៉ូដ Abaya"
          subtitle={`${catalog.total.toLocaleString()} ម៉ូដសម្រាប់មើល និងបញ្ជាទិញ។`}
          products={catalog.items}
          href="/products"
          ctaLabel="Our top picks"
          staggerCards
        />
      )}
      <ScrollReveal>
        <PromoBanner />
      </ScrollReveal>
      <ScrollReveal>
        <VideoBanner />
      </ScrollReveal>
      <ScrollReveal>
        <TrustBar />
      </ScrollReveal>
    </>
  );
}
