import { create } from 'zustand';
import { useCartStore } from './useCartStore';
import { parseApiResponse } from '../utils/api';

// Safe client-side base64 JWT payload decoder
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('synth_token') || null,
  loading: false,
  error: null,

  // Restore authenticated session on mount
  initAuth: () => {
    const token = get().token;
    if (token) {
      const payload = parseJwt(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        // Token is valid! Restore user session
        set({
          user: {
            id: payload.id,
            email: payload.email,
            fullName: payload.fullName || localStorage.getItem('synth_user_name') || 'Customer'
          }
        });
      } else {
        get().logout(); // Token expired
      }
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.error || 'Incorrect email or password.');
      }

      localStorage.setItem('synth_token', data.token);
      localStorage.setItem('synth_user_name', data.user.fullName);
      
      set({
        token: data.token,
        user: data.user,
        loading: false
      });

      useCartStore.getState().addToast(`Welcome back, ${data.user.fullName}!`);
      return true;
    } catch (err) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  register: async (fullName, email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password })
      });

      const data = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(data.error || 'Could not register user account.');
      }

      localStorage.setItem('synth_token', data.token);
      localStorage.setItem('synth_user_name', data.user.fullName);

      set({
        token: data.token,
        user: data.user,
        loading: false
      });

      useCartStore.getState().addToast(`Account created! Welcome, ${data.user.fullName}.`);
      return true;
    } catch (err) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('synth_token');
    localStorage.removeItem('synth_user_name');
    set({ token: null, user: null, error: null });
    useCartStore.getState().clearCart();
    useCartStore.getState().addToast('Logged out successfully.');
  }
}));
