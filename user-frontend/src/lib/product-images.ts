type ProductImageSource = {
  image?: string | null;
  images?: Array<string | null | undefined> | null;
};

export function getProductImageUrls(product: ProductImageSource): string[] {
  const candidates = [
    product.image,
    ...(Array.isArray(product.images) ? product.images : []),
  ];

  return [
    ...new Set(
      candidates
        .filter((image): image is string => typeof image === "string")
        .map((image) => image.trim())
        .filter(Boolean)
    ),
  ];
}
