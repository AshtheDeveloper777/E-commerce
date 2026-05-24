const PLACEHOLDER = '/products/placeholder.svg';

/** Product images via API so they work on Vercel production. */
export function getProductImageUrl(product) {
  if (!product?.id) return PLACEHOLDER;
  return `/api/products/${product.id}/image`;
}

export { PLACEHOLDER };
