import React from 'react';
import { useCartStore } from '../store/useCartStore';
import { X, Star, ShoppingCart, Heart, ShieldAlert, Award, PackageCheck } from 'lucide-react';
import ProductImage from './ProductImage';

export default function ProductDetailModal({ product, onClose }) {
  const { addProduct, toggleWishlist, wishlist, stocks } = useCartStore();

  const isFavorited = wishlist.some((item) => item.id === product.id);
  const currentStock = stocks[product.id] ?? 0;

  // Custom glows based on color setting
  const getGlowColor = (color) => {
    switch (color) {
      case 'purple': return 'rgba(138, 43, 226, 0.4)';
      case 'pink': return 'rgba(236, 72, 153, 0.4)';
      case 'blue': return 'rgba(59, 130, 246, 0.4)';
      case 'cyan': return 'rgba(6, 182, 212, 0.4)';
      case 'amber': return 'rgba(245, 158, 11, 0.4)';
      case 'red': return 'rgba(239, 68, 68, 0.4)';
      default: return 'rgba(138, 43, 226, 0.4)';
    }
  };

  const getStockBadge = (stock) => {
    if (stock > 5) {
      return (
        <span style={{ color: 'var(--success)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
          <PackageCheck size={16} /> In Stock ({stock} available)
        </span>
      );
    } else if (stock > 0) {
      return (
        <span style={{ color: 'var(--warning)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
          <ShieldAlert size={16} /> Low Stock (only {stock} remaining!)
        </span>
      );
    } else {
      return (
        <span style={{ color: 'var(--destructive)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
          <X size={16} /> Out of Stock
        </span>
      );
    }
  };

  return (
    <div 
      className="drawer-backdrop active" 
      onClick={onClose} 
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
    >
      <div 
        className="glass" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '1fr',
          position: 'relative',
          boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 40px ${getGlowColor(product.color)}`,
          border: '1px solid var(--border)'
        }}
      >
        {/* Responsive dual-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', width: '100%' }}>
          
          {/* Left Column: Image Area */}
          <div 
            style={{ 
              position: 'relative', 
              height: '350px', 
              background: `radial-gradient(circle at center, ${getGlowColor(product.color)}, transparent), var(--secondary)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            <ProductImage
              product={product}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'brightness(0.95) contrast(1.05)',
              }}
            />
            {product.tag && (
              <span className="product-badge glass" style={{ top: '20px', left: '20px', fontSize: '0.8rem', padding: '6px 14px' }}>
                {product.tag}
              </span>
            )}
          </div>

          {/* Right Column: Detailed info */}
          <div 
            style={{ 
              padding: '32px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '20px', 
              overflowY: 'auto', 
              height: 'auto',
              maxHeight: '500px',
              backgroundColor: 'var(--card)'
            }}
          >
            {/* Header / Category */}
            <div>
              <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.1em' }}>
                {product.category}
              </span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', lineHeight: '1.2' }}>{product.name}</h2>
            </div>

            {/* Price & Rating */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', fontFamily: 'var(--font-heading)' }}>
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', fontWeight: 700 }}>
                  <Star size={16} fill="#fbbf24" stroke="none" />
                  <span>{product.rating}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  ({product.reviewsCount} reviews)
                </span>
              </div>
            </div>

            {/* Description */}
            <p style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', lineHeight: '1.6' }}>{product.description}</p>

            {/* Specifications Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={16} style={{ color: 'var(--primary)' }} /> Product Specifications
              </span>
              <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {product.specs.map((spec, i) => (
                  <li 
                    key={i} 
                    style={{ 
                      fontSize: '0.85rem', 
                      color: 'var(--foreground)', 
                      padding: '8px 12px', 
                      backgroundColor: 'var(--background)', 
                      borderRadius: 'var(--radius-sm)', 
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px' 
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></span>
                    {spec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Stock Level Indicator */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '4px' }}>
              {getStockBadge(currentStock)}
            </div>

            {/* CTA action buttons */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              <button 
                className="btn btn-primary"
                style={{ flex: 1, padding: '14px', fontSize: '0.95rem' }}
                onClick={() => addProduct(product)}
                disabled={currentStock <= 0}
              >
                <ShoppingCart size={18} />
                Add to Cart
              </button>
              
              <button 
                className={`btn btn-secondary ${isFavorited ? 'active' : ''}`}
                style={{ 
                  padding: '14px', 
                  borderRadius: 'var(--radius-md)', 
                  borderColor: isFavorited ? 'var(--destructive)' : 'var(--border)',
                  color: isFavorited ? 'var(--destructive)' : 'var(--foreground)'
                }}
                onClick={() => toggleWishlist(product)}
                aria-label="Add to wishlist"
              >
                <Heart size={18} fill={isFavorited ? 'var(--destructive)' : 'none'} />
              </button>
            </div>

          </div>
        </div>

        {/* Close Button top-right */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.1)',
            zIndex: 10
          }}
          aria-label="Close details"
        >
          <X size={18} />
        </button>

      </div>
    </div>
  );
}
