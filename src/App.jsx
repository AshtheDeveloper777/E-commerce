import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProductGrid from './components/ProductGrid';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import ProductDetailModal from './components/ProductDetailModal';
import CheckoutForm from './components/CheckoutForm';
import OrderSuccess from './components/OrderSuccess';
import AuthModal from './components/AuthModal';
import { useCartStore } from './store/useCartStore';
import { useAuthStore } from './store/useAuthStore';
import { X, Sparkles } from 'lucide-react';

export default function App() {
  const [view, setView] = useState('shop'); // 'shop' | 'checkout' | 'success'
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [customerData, setCustomerData] = useState(null);

  const toasts = useCartStore((state) => state.toasts);
  const removeToast = useCartStore((state) => state.removeToast);
  const cart = useCartStore((state) => state.cart);
  
  const initAuth = useAuthStore((state) => state.initAuth);

  // Restore authenticated session on page load
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const handleCheckoutSuccess = (data) => {
    setCustomerData(data);
    setView('success');
  };

  return (
    <div className="app-container">
      {/* Toast Notifications System */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <Sparkles size={16} style={{ color: 'var(--primary)' }} />
            <span>{t.message}</span>
            <button 
              onClick={() => removeToast(t.id)} 
              style={{ background: 'transparent', cursor: 'pointer', color: 'var(--primary-foreground)', opacity: 0.7, marginLeft: '8px' }}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Dynamic Navbar */}
      <Header 
        onCartClick={() => setIsCartOpen(true)} 
        onWishlistClick={() => setIsWishlistOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
      />

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onCheckoutClick={() => {
          if (cart.length === 0) {
            useCartStore.getState().addToast("Your cart is empty. Add products to checkout!");
            return;
          }
          setView('checkout');
        }}
      />

      {/* Wishlist Drawer */}
      <WishlistDrawer 
        isOpen={isWishlistOpen} 
        onClose={() => setIsWishlistOpen(false)} 
      />

      {/* Login / Registration Modal overlay */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />

      {/* Specifications Product Detail Modal */}
      {activeProduct && (
        <ProductDetailModal 
          product={activeProduct} 
          onClose={() => setActiveProduct(null)} 
        />
      )}

      {/* Main Page Layout Canvas */}
      <main className="main-content">
        {view === 'shop' && (
          <>
            {/* Ambient Welcome Banner */}
            <section className="hero-banner glass">
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Elevate Your Workspace</h2>
              <p style={{ marginTop: '10px', color: 'var(--muted-foreground)', fontSize: '1.05rem', lineHeight: '1.6' }}>
                Curated high-performance gear built for developers, designers, and creators who demand absolute perfection in their daily craft.
              </p>
              
              <div 
                style={{ 
                  marginTop: '20px', 
                  display: 'flex', 
                  gap: '12px', 
                  flexWrap: 'wrap',
                  alignItems: 'center' 
                }}
              >
                <span 
                  className="glass" 
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: 'var(--radius-sm)', 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold', 
                    border: '1px dashed var(--primary)',
                    color: 'var(--primary)'
                  }}
                >
                  ⚡ Promo Applied: Use EPICDEAL (15% Off) or DEVPOWER (20% Off)
                </span>
                
                <span 
                  style={{ 
                    fontSize: '0.85rem', 
                    color: 'var(--muted-foreground)' 
                  }}
                >
                  🚚 Free local delivery on orders above ₹10,000!
                </span>
              </div>
            </section>

            {/* Filterable Products grid */}
            <ProductGrid onCardClick={(product) => setActiveProduct(product)} />
          </>
        )}

        {view === 'checkout' && (
          <CheckoutForm 
            onBack={() => setView('shop')}
            onSuccess={handleCheckoutSuccess}
            onAuthClick={() => setIsAuthOpen(true)}
          />
        )}

        {view === 'success' && (
          <OrderSuccess 
            customerData={customerData}
            onContinue={() => setView('shop')}
          />
        )}
      </main>

      {/* Modern custom footer */}
      <footer className="main-footer">
        <p>© 2026 SYNTH.CO Gear. All rights reserved. Handcrafted premium workspaces.</p>
      </footer>
    </div>
  );
}
