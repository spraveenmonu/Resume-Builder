export type UserRole = 'USER' | 'ADMIN';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  totpEnabled: boolean;
  createdAt: string;
}

export interface SessionDto {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  isCurrent: boolean;
}

export interface OAuthAccountDto {
  id: string;
  provider: 'GOOGLE' | 'GITHUB';
  email: string;
  createdAt: string;
}

export interface DashboardSummaryDto {
  user: UserDto;
  resumesCount: number;
  recentResumes: Array<{
    id: string;
    title: string;
    slug: string;
    templateId: string;
    updatedAt: string;
    completionPercentage: number;
  }>;
  savedLettersCount: number;
  downloadsCount: number;
  applicationsSummary: {
    total: number;
    saved: number;
    applied: number;
    underReview: number;
    interview: number;
    offer: number;
    rejected: number;
    withdrawn: number;
  };
  upcomingInterviews: Array<{
    id: string;
    applicationId: string;
    company: string;
    title: string;
    type: string;
    scheduledAt: string;
  }>;
  followUpReminders: Array<{
    id: string;
    title: string;
    dueAt: string;
    isCompleted: boolean;
  }>;
  onboardingChecklist: {
    profileCompleted: boolean;
    firstResumeCreated: boolean;
    firstDownloadCompleted: boolean;
    twoFactorEnabled: boolean;
  };
}
