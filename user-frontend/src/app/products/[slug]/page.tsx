import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogErrorMessage } from "@/components/catalog/catalog-error-message";
import { ProductDetailView } from "@/components/product/product-detail-view";
import { fetchProductBySlug } from "@/lib/catalog-api";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const result = await fetchProductBySlug(slug);
    if (!result) {
      return { title: "Product not found" };
    }
    if ("error" in result) return { title: "Product" };

    return {
      title: result.product.name,
      description: result.product.shortDescription ?? result.product.description,
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;

  let result: Awaited<ReturnType<typeof fetchProductBySlug>> = null;

  try {
    result = await fetchProductBySlug(slug);
  } catch {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <CatalogErrorMessage />
      </div>
    );
  }

  if (!result) {
    notFound();
  }

  if ("error" in result) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <CatalogErrorMessage />
      </div>
    );
  }

  return <ProductDetailView product={result.product} related={result.related} />;
}
