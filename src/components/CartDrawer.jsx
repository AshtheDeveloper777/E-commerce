import React, { useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import { X, Trash2, Plus, Minus, Tag, CreditCard, ShoppingCart } from 'lucide-react';
import ProductImage from './ProductImage';

export default function CartDrawer({ isOpen, onClose, onCheckoutClick }) {
  const {
    cart,
    promoCode,
    promoDiscount,
    updateQuantity,
    removeProduct,
    applyPromoCode,
    removePromoCode,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getShippingCost,
    getGrandTotal
  } = useCartStore();

  const [promoInput, setPromoInput] = useState('');

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const success = applyPromoCode(promoInput);
    if (success) {
      setPromoInput('');
    }
  };

  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const tax = getTaxAmount();
  const shipping = getShippingCost();
  const total = getGrandTotal();

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`drawer-backdrop ${isOpen ? 'active' : ''}`} 
        onClick={onClose} 
      />

      {/* Slide-out Drawer */}
      <div className={`drawer glass ${isOpen ? 'active' : ''}`}>
        <div className="drawer-header">
          <h3>
            <ShoppingCart size={22} style={{ color: 'var(--primary)' }} />
            Your Cart
          </h3>
          <button 
            className="drawer-close" 
            onClick={onClose}
            aria-label="Close cart"
          >
            <X size={24} />
          </button>
        </div>

        <div className="drawer-body">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item-image">
                  <ProductImage
                    product={item}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
                
                <div className="cart-item-info">
                  <span className="cart-item-title">{item.name}</span>
                  <span className="cart-item-price">${item.price.toFixed(2)}</span>
                </div>

                <div className="cart-item-controls">
                  <button 
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="qty-val">{item.quantity}</span>
                  <button 
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <button 
                  className="remove-item-btn"
                  onClick={() => removeProduct(item.id)}
                  style={{ marginLeft: '12px' }}
                  title="Remove item"
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-cart-state">
              <ShoppingCart className="empty-cart-icon" />
              <h3>Your cart is empty</h3>
              <p>Explore our premium hardware collections to add items here!</p>
              <button 
                className="btn btn-primary" 
                onClick={onClose}
                style={{ marginTop: '8px' }}
              >
                Start Shopping
              </button>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="drawer-footer glass">
            {/* Promo Code Input */}
            {!promoCode ? (
              <form onSubmit={handleApplyPromo} className="promo-wrapper">
                <input
                  type="text"
                  className="promo-input"
                  placeholder="Promo Code (e.g. EPICDEAL)"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: '10px 14px' }}>
                  Apply
                </button>
              </form>
            ) : (
              <div 
                className="glass" 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '10px 14px', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--success)'
                }}
              >
                <div className="discount-tag">
                  <Tag size={16} />
                  <span>{promoCode} ({promoDiscount * 100}% OFF)</span>
                </div>
                <button 
                  onClick={removePromoCode} 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}
                >
                  Remove
                </button>
              </div>
            )}

            {/* Calculations Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="summary-row muted">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="summary-row muted" style={{ color: 'var(--success)' }}>
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row muted">
                <span>Estimated Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="summary-row muted">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* CTA to Checkout */}
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '8px' }}
              onClick={() => {
                onClose();
                onCheckoutClick();
              }}
            >
              <CreditCard size={18} />
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
