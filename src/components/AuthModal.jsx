import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { X, Lock, Mail, User, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { z } from 'zod';

// Simple validation schemas inside AuthModal for self-containment
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const registerSchema = z.object({
  fullName: z.string().min(3, 'Name must be at least 3 characters').regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, error, loading, set } = useAuthStore();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  
  const [fieldErrors, setFieldErrors] = useState({});

  // Reset errors when changing tabs or opening modal
  useEffect(() => {
    setFieldErrors({});
    if (useAuthStore.getState().error) {
      useAuthStore.setState({ error: null });
    }
  }, [tab, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation error when typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    if (tab === 'login') {
      const result = loginSchema.safeParse({
        email: formData.email,
        password: formData.password
      });

      if (!result.success) {
        const errs = {};
        result.error.issues.forEach((err) => {
          errs[err.path[0]] = err.message;
        });
        setFieldErrors(errs);
        return;
      }

      const success = await login(formData.email, formData.password);
      if (success) onClose();
    } else {
      const result = registerSchema.safeParse(formData);

      if (!result.success) {
        const errs = {};
        result.error.issues.forEach((err) => {
          errs[err.path[0]] = err.message;
        });
        setFieldErrors(errs);
        return;
      }

      const success = await register(formData.fullName, formData.email, formData.password);
      if (success) onClose();
    }
  };

  return (
    <div 
      className="drawer-backdrop active" 
      onClick={onClose} 
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 150 }}
    >
      <div 
        className="glass" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 45px rgba(0,0,0,0.5), var(--shadow-glow)',
          position: 'relative'
        }}
      >
        {/* Top Header / Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 16px 24px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
            <Sparkles size={18} style={{ color: 'var(--primary)' }} />
            {tab === 'login' ? 'Sign In' : 'Create Account'}
          </h3>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', cursor: 'pointer', color: 'var(--muted-foreground)' }}
            aria-label="Close authentication"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => setTab('login')}
            style={{
              padding: '14px',
              background: 'transparent',
              borderBottom: tab === 'login' ? '2px solid var(--primary)' : 'none',
              color: tab === 'login' ? 'var(--primary)' : 'var(--muted-foreground)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('register')}
            style={{
              padding: '14px',
              background: 'transparent',
              borderBottom: tab === 'register' ? '2px solid var(--primary)' : 'none',
              color: tab === 'register' ? 'var(--primary)' : 'var(--muted-foreground)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Register
          </button>
        </div>

        {/* Auth Forms */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>
          
          {/* Server Error Alerts */}
          {error && (
            <div 
              style={{ 
                padding: '10px 14px', 
                backgroundColor: 'hsl(var(--destructive-hsl) / 0.1)', 
                border: '1px solid var(--destructive)', 
                borderRadius: 'var(--radius-md)', 
                color: 'var(--destructive)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name Field (Register only) */}
          {tab === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
                  className={`form-input ${fieldErrors.fullName ? 'has-error' : ''}`}
                  style={{ paddingLeft: '40px' }}
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
              </div>
              {fieldErrors.fullName && (
                <span className="error-text">
                  <AlertCircle size={14} /> {fieldErrors.fullName}
                </span>
              )}
            </div>
          )}

          {/* Email Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="john.doe@example.com"
                className={`form-input ${fieldErrors.email ? 'has-error' : ''}`}
                style={{ paddingLeft: '40px' }}
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            </div>
            {fieldErrors.email && (
              <span className="error-text">
                <AlertCircle size={14} /> {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                className={`form-input ${fieldErrors.password ? 'has-error' : ''}`}
                style={{ paddingLeft: '40px' }}
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            </div>
            {fieldErrors.password && (
              <span className="error-text">
                <AlertCircle size={14} /> {fieldErrors.password}
              </span>
            )}
          </div>

          {/* Submit Action */}
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem', display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '4px' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" style={{ animation: 'float 1s linear infinite' }} />
                Authenticating...
              </>
            ) : (
              tab === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
          
        </form>
      </div>
    </div>
  );
}
