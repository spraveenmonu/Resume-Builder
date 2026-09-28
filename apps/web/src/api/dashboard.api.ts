import { apiClient } from './client.js';
import { ApiResponse, DashboardSummaryDto } from '@careercraft/shared';

export const dashboardApi = {
  async getSummary() {
    const res = await apiClient.get<ApiResponse<DashboardSummaryDto>>('/dashboard/summary');
    return res.data;
  },
};
