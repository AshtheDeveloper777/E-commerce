import React, { useState } from 'react';
import { getProductImageUrl, PLACEHOLDER } from '../utils/productImage';

export default function ProductImage({ product, alt, className, style }) {
  const [src, setSrc] = useState(() => getProductImageUrl(product));

  return (
    <img
      src={src}
      alt={alt ?? product?.name ?? 'Product'}
      className={className}
      style={style}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (src !== PLACEHOLDER) setSrc(PLACEHOLDER);
      }}
    />
  );
}
