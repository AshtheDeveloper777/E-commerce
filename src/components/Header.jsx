import React, { useEffect, useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { ShoppingBag, Sun, Moon, Sparkles, Heart, LogOut, User } from 'lucide-react';

export default function Header({ onCartClick, onWishlistClick, onAuthClick }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const totalItems = useCartStore((state) => state.getTotalItems());
  const wishlist = useCartStore((state) => state.wishlist);
  const { user, logout } = useAuthStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Get user initials for profile badge
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="main-header glass" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="main-header-inner">
        <a href="/" className="logo" onClick={(e) => e.preventDefault()}>
          <Sparkles className="logo-icon" size={24} style={{ color: 'var(--primary)' }} />
          <span>SYNTH.CO</span>
        </a>

        <div className="nav-actions">
          {/* Light/Dark mode switcher */}
          <button 
            className="btn-icon" 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Wishlist action trigger */}
          <button 
            className="btn btn-secondary btn-icon" 
            onClick={onWishlistClick}
            aria-label="Open wishlist"
            title="Open Wishlist"
            style={{ 
              borderColor: wishlist.length > 0 ? 'var(--destructive)' : 'var(--border)',
              color: wishlist.length > 0 ? 'var(--destructive)' : 'var(--foreground)'
            }}
          >
            <Heart size={20} fill={wishlist.length > 0 ? 'var(--destructive)' : 'none'} />
            {wishlist.length > 0 && (
              <span className="badge" style={{ backgroundColor: 'var(--destructive)' }}>{wishlist.length}</span>
            )}
          </button>

          {/* Cart action trigger */}
          <button 
            className="btn btn-secondary btn-icon" 
            onClick={onCartClick}
            aria-label="Open cart"
            title="Open Cart"
          >
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span className="badge">{totalItems}</span>
            )}
          </button>

          {/* Authenticated user interface */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                className="qty-btn"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  border: '2px solid var(--border)',
                  boxShadow: '0 0 10px hsl(var(--primary-hsl) / 0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                title="View Profile"
              >
                {getInitials(user.fullName)}
              </button>

              {/* Profile Tooltip/Dropdown Menu */}
              {showProfileDropdown && (
                <>
                  <div 
                    style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 98 }} 
                    onClick={() => setShowProfileDropdown(false)} 
                  />
                  <div
                    className="glass"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '52px',
                      width: '240px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      padding: '16px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      zIndex: 99
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--foreground)' }}>
                        {user.fullName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', wordBreak: 'break-all' }}>
                        {user.email}
                      </span>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          color: 'var(--destructive)',
                          borderColor: 'hsl(var(--destructive-hsl) / 0.2)'
                        }}
                        onClick={() => {
                          logout();
                          setShowProfileDropdown(false);
                        }}
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button 
              className="btn btn-primary" 
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              onClick={onAuthClick}
            >
              <User size={16} />
              Sign In
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
