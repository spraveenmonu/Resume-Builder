import { create } from 'zustand';
import { UserDto } from '@careercraft/shared';
import { authApi } from '../api/auth.api.js';
import { userApi } from '../api/user.api.js';
import { setAccessToken } from '../api/client.js';

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserDto | null) => void;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: Boolean(user), isLoading: false }),

  initialize: async () => {
    try {
      // Attempt silent refresh
      const refreshRes = await authApi.refresh();
      if (refreshRes.success && refreshRes.data?.accessToken) {
        const profileRes = await userApi.getProfile();
        if (profileRes.success && profileRes.data?.user) {
          set({ user: profileRes.data.user, isAuthenticated: true, isLoading: false });
          return;
        }
      }
    } catch {
      // Not authenticated or expired
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
