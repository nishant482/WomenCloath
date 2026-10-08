export function productImages(product) {
  return [...new Set([product.imageUrl, ...(product.imageUrls || [])].filter(Boolean))];
}
