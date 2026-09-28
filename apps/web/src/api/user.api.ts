import { apiClient } from './client.js';
import {
  ApiResponse,
  UserDto,
  SessionDto,
  OAuthAccountDto,
  UpdateProfileInput,
  ChangePasswordInput,
  ChangeEmailInput,
  DeleteAccountInput,
} from '@careercraft/shared';

export const userApi = {
  async getProfile() {
    const res = await apiClient.get<ApiResponse<{ user: UserDto }>>('/user/profile');
    return res.data;
  },

  async updateProfile(data: UpdateProfileInput) {
    const res = await apiClient.patch<ApiResponse<{ user: UserDto }>>('/user/profile', data);
    return res.data;
  },

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await apiClient.post<ApiResponse<{ avatarUrl: string }>>('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async deleteAvatar() {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>('/user/avatar');
    return res.data;
  },

  async changePassword(data: ChangePasswordInput) {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/user/change-password', data);
    return res.data;
  },

  async changeEmail(data: ChangeEmailInput) {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/user/change-email', data);
    return res.data;
  },

  async getSessions() {
    const res = await apiClient.get<ApiResponse<{ sessions: SessionDto[] }>>('/user/sessions');
    return res.data;
  },

  async revokeSession(id: string) {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(`/user/sessions/${id}`);
    return res.data;
  },

  async getOAuthAccounts() {
    const res = await apiClient.get<ApiResponse<{ accounts: OAuthAccountDto[] }>>('/user/oauth-accounts');
    return res.data;
  },

  async unlinkOAuthAccount(id: string) {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(`/user/oauth-accounts/${id}`);
    return res.data;
  },

  async exportData() {
    const res = await apiClient.get('/user/export-data', { responseType: 'blob' });
    return res.data;
  },

  async deleteAccount(data: DeleteAccountInput) {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/user/delete-account', data);
    return res.data;
  },
};
