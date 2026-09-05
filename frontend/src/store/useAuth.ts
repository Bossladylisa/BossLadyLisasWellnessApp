import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'byb_session_token';
const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

export interface AppUser {
  user_id: string;
  email: string;
  name?: string;
  picture?: string;
  is_admin: boolean;
  subscription_tier: 'free' | 'blossom' | 'grove' | 'premium';
}

interface AuthState {
  user: AppUser | null;
  token: string | null;
  loading: boolean;
  setUser: (user: AppUser | null) => void;
  setToken: (token: string | null) => void;
  loadSession: () => Promise<void>;
  processSessionToken: (sessionToken: string) => Promise<AppUser | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

async function saveToken(token: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_KEY, token);
    }
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
}

async function loadToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
  }
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

async function deleteToken() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: true,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),

  loadSession: async () => {
    set({ loading: true });
    try {
      const token = await loadToken();
      if (!token) {
        set({ user: null, token: null, loading: false });
        return;
      }

      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        await deleteToken();
        set({ user: null, token: null, loading: false });
        return;
      }

      const user = await res.json();
      set({ user, token, loading: false });
    } catch (e) {
      console.error('Load session error:', e);
      set({ user: null, token: null, loading: false });
    }
  },

  processSessionToken: async (sessionToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken }),
      });

      if (!res.ok) {
        console.error('Session creation failed:', res.status);
        return null;
      }

      const data = await res.json();
      const newToken = data.session_token;
      await saveToken(newToken);
      set({ user: data.user, token: newToken, loading: false });
      return data.user;
    } catch (e) {
      console.error('Process session error:', e);
      return null;
    }
  },

  logout: async () => {
    const { token } = get();
    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        console.error('Logout API error:', e);
      }
    }
    await deleteToken();
    set({ user: null, token: null });
  },

  refreshUser: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        set({ user });
      }
    } catch (e) {
      console.error('Refresh user error:', e);
    }
  },
}));

export const useAuth = () => {
  const { user, token, loading } = useAuthStore();
  return { user, token, loading };
};

// Helper to make authenticated API calls
export async function authFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = useAuthStore.getState().token;
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Session expired
    await useAuthStore.getState().logout();
  }

  return res;
}
