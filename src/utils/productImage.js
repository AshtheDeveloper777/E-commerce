const PLACEHOLDER = '/products/placeholder.svg';

/** Product images are bundled in Vite's public/products folder. */
export function getProductImageUrl(product) {
  if (!product?.id) return PLACEHOLDER;
  return `/products/${product.id}.jpg`;
}

export { PLACEHOLDER };
