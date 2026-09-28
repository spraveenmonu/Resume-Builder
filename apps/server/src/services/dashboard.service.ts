import { prisma } from '../config/prisma.js';
import { DashboardSummaryDto } from '@careercraft/shared';

export class DashboardService {
  /**
   * Calculates dashboard metrics, completion percentages, reminders, and checklist items.
   */
  static async getSummary(userId: string): Promise<DashboardSummaryDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        isEmailVerified: true,
        totpEnabled: true,
        createdAt: true,
      },
    });

    if (!user) throw new Error('User not found');

    const [
      resumes,
      resumesCount,
      savedLettersCount,
      downloadsCount,
      applications,
      reminders,
      events,
    ] = await Promise.all([
      prisma.resume.findMany({
        where: { userId, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          templateId: true,
          updatedAt: true,
          data: true,
        },
      }),
      prisma.resume.count({ where: { userId, deletedAt: null } }),
      prisma.coverLetter.count({ where: { userId, deletedAt: null } }),
      prisma.download.count({ where: { userId } }),
      prisma.jobApplication.findMany({
        where: { userId },
        select: { status: true },
      }),
      prisma.reminder.findMany({
        where: { userId, isCompleted: false },
        orderBy: { dueAt: 'asc' },
        take: 5,
      }),
      prisma.applicationEvent.findMany({
        where: {
          application: { userId },
          scheduledAt: { gte: new Date() },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
        include: {
          application: {
            select: { id: true, company: true, title: true },
          },
        },
      }),
    ]);

    // Calculate completion percentage for each resume
    const recentResumes = resumes.map((r) => {
      let score = 0;
      const data = r.data as any;
      if (data?.personal?.name) score += 20;
      if (data?.personal?.email) score += 10;
      if (data?.personal?.phone) score += 10;
      if (data?.summary && data.summary.length > 30) score += 20;
      if (Array.isArray(data?.sections)) {
        const hasExp = data.sections.some((s: any) => s.type === 'experience' && s.items?.length > 0);
        const hasEdu = data.sections.some((s: any) => s.type === 'education' && s.items?.length > 0);
        const hasSkills = data.sections.some((s: any) => s.type === 'skills' && s.items?.length > 0);
        if (hasExp) score += 20;
        if (hasEdu) score += 10;
        if (hasSkills) score += 10;
      }
      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        templateId: r.templateId,
        updatedAt: r.updatedAt.toISOString(),
        completionPercentage: Math.min(score, 100),
      };
    });

    const applicationsSummary = {
      total: applications.length,
      saved: applications.filter((a) => a.status === 'SAVED').length,
      applied: applications.filter((a) => a.status === 'APPLIED').length,
      underReview: applications.filter((a) => a.status === 'UNDER_REVIEW').length,
      interview: applications.filter((a) => a.status === 'INTERVIEW').length,
      offer: applications.filter((a) => a.status === 'OFFER').length,
      rejected: applications.filter((a) => a.status === 'REJECTED').length,
      withdrawn: applications.filter((a) => a.status === 'WITHDRAWN').length,
    };

    return {
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
      },
      resumesCount,
      recentResumes,
      savedLettersCount,
      downloadsCount,
      applicationsSummary,
      upcomingInterviews: events.map((e) => ({
        id: e.id,
        applicationId: e.application.id,
        company: e.application.company,
        title: e.application.title,
        type: e.type,
        scheduledAt: e.scheduledAt.toISOString(),
      })),
      followUpReminders: reminders.map((rem) => ({
        id: rem.id,
        title: rem.title,
        dueAt: rem.dueAt.toISOString(),
        isCompleted: rem.isCompleted,
      })),
      onboardingChecklist: {
        profileCompleted: Boolean(user.name && user.avatarUrl),
        firstResumeCreated: resumesCount > 0,
        firstDownloadCompleted: downloadsCount > 0,
        twoFactorEnabled: user.totpEnabled,
      },
    };
  }
}
