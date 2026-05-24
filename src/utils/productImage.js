const PLACEHOLDER = '/products/placeholder.svg';

/** Local image path — served from public/products (no external CDN). */
export function getProductImageUrl(product) {
  if (!product?.id) return PLACEHOLDER;
  return `/products/${product.id}.jpg`;
}

export { PLACEHOLDER };
