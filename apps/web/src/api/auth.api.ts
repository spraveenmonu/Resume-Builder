import { apiClient, setAccessToken } from './client.js';
import {
  ApiResponse,
  SignupInput,
  LoginInput,
  ResetPasswordInput,
  UserDto,
} from '@careercraft/shared';

export const authApi = {
  async signup(data: SignupInput) {
    const res = await apiClient.post<ApiResponse<{ message: string; email: string }>>('/auth/signup', data);
    return res.data;
  },

  async verifyEmail(token: string) {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/verify-email', { token });
    return res.data;
  },

  async resendVerification(email: string) {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/resend-verification', { email });
    return res.data;
  },

  async login(data: LoginInput) {
    const res = await apiClient.post<
      ApiResponse<{ requires2FA?: boolean; accessToken?: string; user?: UserDto }>
    >('/auth/login', data);
    if (res.data?.data?.accessToken) {
      setAccessToken(res.data.data.accessToken);
    }
    return res.data;
  },

  async refresh() {
    const res = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
    if (res.data?.data?.accessToken) {
      setAccessToken(res.data.data.accessToken);
    }
    return res.data;
  },

  async logout() {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/logout');
    setAccessToken(null);
    return res.data;
  },

  async logoutAll() {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/logout-all');
    setAccessToken(null);
    return res.data;
  },

  async forgotPassword(email: string) {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(data: ResetPasswordInput) {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', data);
    return res.data;
  },

  async setup2FA() {
    const res = await apiClient.post<ApiResponse<{ secret: string; qrCodeUrl: string }>>('/auth/2fa/setup');
    return res.data;
  },

  async verify2FA(code: string) {
    const res = await apiClient.post<ApiResponse<{ message: string; backupCodes: string[] }>>('/auth/2fa/verify', { code });
    return res.data;
  },

  async disable2FA(password: string, code: string) {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/2fa/disable', { password, code });
    return res.data;
  },
};
