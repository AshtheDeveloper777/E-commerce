import React from 'react';
import { useCartStore } from '../store/useCartStore';
import { X, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import ProductImage from './ProductImage';

export default function WishlistDrawer({ isOpen, onClose }) {
  const { wishlist, toggleWishlist, addProduct, stocks } = useCartStore();

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`drawer-backdrop ${isOpen ? 'active' : ''}`} 
        onClick={onClose} 
        style={{ zIndex: 110 }} // Higher than cart drawer
      />

      {/* Slide-out Drawer */}
      <div className={`drawer glass ${isOpen ? 'active' : ''}`} style={{ zIndex: 111 }}>
        <div className="drawer-header">
          <h3 style={{ color: 'var(--destructive)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={22} fill="var(--destructive)" stroke="none" />
            Your Wishlist
          </h3>
          <button 
            className="drawer-close" 
            onClick={onClose}
            aria-label="Close wishlist"
          >
            <X size={24} />
          </button>
        </div>

        <div className="drawer-body">
          {wishlist.length > 0 ? (
            wishlist.map((item) => {
              const currentStock = stocks[item.id] ?? 0;
              return (
                <div className="cart-item" key={item.id}>
                  <ProductImage
                    product={item}
                    style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                  />
                  
                  <div className="cart-item-info">
                    <span className="cart-item-title">{item.name}</span>
                    <span className="cart-item-price" style={{ color: 'var(--primary)' }}>
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: currentStock > 0 ? 'var(--success)' : 'var(--destructive)', fontWeight: 600 }}>
                      {currentStock > 0 ? 'In Stock' : 'Sold Out'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      className="qty-btn"
                      onClick={() => addProduct(item)}
                      disabled={currentStock <= 0}
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: currentStock <= 0 ? 'var(--secondary)' : 'var(--primary)',
                        borderColor: currentStock <= 0 ? 'var(--border)' : 'var(--primary)',
                        color: 'white',
                        cursor: currentStock <= 0 ? 'not-allowed' : 'pointer'
                      }}
                      title="Add to Cart"
                      aria-label="Add to Cart"
                    >
                      <ShoppingCart size={14} />
                    </button>
                    
                    <button 
                      className="remove-item-btn"
                      onClick={() => toggleWishlist(item)}
                      title="Remove from Wishlist"
                      aria-label="Remove from Wishlist"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-cart-state">
              <Heart className="empty-cart-icon" style={{ color: 'var(--border)' }} />
              <h3>Your wishlist is empty</h3>
              <p>Tap the ❤️ icon on premium products to save them in this list!</p>
              <button 
                className="btn btn-primary" 
                onClick={onClose}
                style={{ marginTop: '8px' }}
              >
                Explore Workspace Gear
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
