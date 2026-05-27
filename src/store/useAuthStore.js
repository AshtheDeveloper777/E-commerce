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

const LOCAL_USERS_KEY = 'synth_local_users';

const createLocalToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };
  return `local.${btoa(JSON.stringify(payload))}.session`;
};

const getLocalUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveLocalUsers = (users) => {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
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
      const localUser = getLocalUsers().find(
        (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password
      );

      if (!localUser) {
        set({ error: err.message || 'Incorrect email or password.', loading: false });
        return false;
      }

      const user = {
        id: localUser.id,
        fullName: localUser.fullName,
        email: localUser.email,
      };
      const token = createLocalToken(user);
      localStorage.setItem('synth_token', token);
      localStorage.setItem('synth_user_name', user.fullName);
      set({ token, user, loading: false });
      useCartStore.getState().addToast(`Welcome back, ${user.fullName}!`);
      return true;
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
    } catch {
      const users = getLocalUsers();
      const existingUser = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        set({ error: 'User with this email already exists.', loading: false });
        return false;
      }

      const user = {
        id: `local_${Date.now()}`,
        fullName,
        email,
      };
      saveLocalUsers([...users, { ...user, password }]);

      const token = createLocalToken(user);
      localStorage.setItem('synth_token', token);
      localStorage.setItem('synth_user_name', user.fullName);
      set({ token, user, loading: false });
      useCartStore.getState().addToast(`Account created! Welcome, ${user.fullName}.`);
      return true;
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
