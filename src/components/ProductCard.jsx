import React from 'react';
import { useCartStore } from '../store/useCartStore';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import ProductImage from './ProductImage';

export default function ProductCard({ product, onCardClick }) {
  const { addProduct, toggleWishlist, wishlist, stocks } = useCartStore();

  const isFavorited = wishlist.some((item) => item.id === product.id);
  const currentStock = stocks[product.id] ?? 0;

  return (
    <article className="product-card" style={{ cursor: 'pointer' }} onClick={() => onCardClick(product)}>
      {/* Product Image Area */}
      <div className="product-image-container">
        {product.tag && (
          <span className="product-badge glass" style={{ zIndex: 2 }}>
            {product.tag}
          </span>
        )}
        
        {/* Floating Heart Button */}
        <button
          className="btn-icon"
          onClick={(e) => {
            e.stopPropagation(); // Avoid opening detail modal
            toggleWishlist(product);
          }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 3,
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--glass-bg)',
            backdropFilter: 'blur(8px)',
            borderColor: isFavorited ? 'var(--destructive)' : 'var(--glass-border)',
            color: isFavorited ? 'var(--destructive)' : 'var(--foreground)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isFavorited ? '0 0 10px rgba(239,68,68,0.3)' : 'none'
          }}
          aria-label="Toggle wishlist"
        >
          <Heart size={16} fill={isFavorited ? 'var(--destructive)' : 'none'} />
        </button>

        <ProductImage
          product={product}
          className="product-card-img"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform var(--transition-slow) ease',
            filter: 'brightness(0.95)',
          }}
        />
      </div>

      {/* Product Details info */}
      <div className="product-details">
        <div className="product-header">
          <h3 className="product-title" style={{ transition: 'color var(--transition-fast)' }}>
            {product.name}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="product-rating">
            <Star size={14} fill="#fbbf24" stroke="none" />
            <span>{product.rating}</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
            ({product.reviewsCount} reviews)
          </span>
        </div>

        <p className="product-desc">{product.description}</p>

        {/* Stock Alert Label */}
        <div style={{ fontSize: '0.8rem', marginTop: 'auto', paddingTop: '8px' }}>
          {currentStock > 5 ? (
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>In Stock</span>
          ) : currentStock > 0 ? (
            <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Only {currentStock} left!</span>
          ) : (
            <span style={{ color: 'var(--destructive)', fontWeight: 600 }}>Sold Out</span>
          )}
        </div>

        <div className="product-footer">
          <span className="product-price">₹{product.price.toLocaleString('en-IN')}</span>
          <button 
            className="btn btn-primary"
            onClick={(e) => {
              e.stopPropagation(); // Avoid triggering card click modal
              addProduct(product);
            }}
            disabled={currentStock <= 0}
            style={{ 
              padding: '8px 14px', 
              fontSize: '0.85rem',
              backgroundColor: currentStock <= 0 ? 'var(--secondary)' : 'var(--primary)',
              borderColor: currentStock <= 0 ? 'var(--border)' : 'var(--primary)',
              color: currentStock <= 0 ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
              cursor: currentStock <= 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <ShoppingCart size={16} />
            {currentStock <= 0 ? 'Sold Out' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
