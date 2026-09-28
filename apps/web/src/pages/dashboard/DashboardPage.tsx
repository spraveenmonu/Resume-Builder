import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard.api.js';
import { DashboardSummaryDto } from '@careercraft/shared';
import { DashboardShell } from '../../components/layout/DashboardShell.js';
import { Button } from '../../components/ui/Button.js';
import {
  FileText,
  Mail,
  Download,
  Briefcase,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardApi
      .getSummary()
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.error?.message || 'Failed to load dashboard metrics');
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error?.message || 'Failed to load dashboard');
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 bg-slate-200 rounded-xl"></div>
            <div className="h-72 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error || !data) {
    return (
      <DashboardShell>
        <div className="p-8 bg-white rounded-2xl border border-rose-200 text-center space-y-3">
          <p className="text-sm font-medium text-rose-700">{error || 'Could not load data'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </DashboardShell>
    );
  }

  const checklistItems = [
    { label: 'Complete profile name and avatar', done: data.onboardingChecklist.profileCompleted, link: '/settings' },
    { label: 'Create your first resume with an ATS template', done: data.onboardingChecklist.firstResumeCreated, link: '/editor' },
    { label: 'Export a PDF or DOCX resume copy', done: data.onboardingChecklist.firstDownloadCompleted, link: '/editor' },
    { label: 'Enable Two-Factor Authentication (2FA)', done: data.onboardingChecklist.twoFactorEnabled, link: '/settings' },
  ];

  const completedCount = checklistItems.filter((item) => item.done).length;

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, {data.user.name}! 👋
            </h1>
            <p className="text-sm text-slate-500">
              Here's a summary of your resume activity and job application progress.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/editor">
              <Button variant="primary" size="md">
                <Plus className="w-4 h-4 mr-1.5" /> Create Resume
              </Button>
            </Link>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resumes</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{data.resumesCount}</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cover Letters</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{data.savedLettersCount}</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Downloads</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{data.downloadsCount}</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Applications</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{data.applicationsSummary.total}</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Main Content Split: Resumes + Onboarding / Reminders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Recent Resumes & Job Tracker Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Resumes */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-800">Recent Resumes</h2>
                </div>
                <Link to="/editor" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {data.recentResumes.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm text-slate-600 font-medium">No resumes created yet.</p>
                  <p className="text-xs text-slate-400">Choose from 12 ATS-safe and modern templates to start.</p>
                  <Link to="/editor">
                    <Button size="sm">Create My First Resume</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.recentResumes.map((resume) => (
                    <div key={resume.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">{resume.title}</h4>
                        <p className="text-xs text-slate-400">
                          Template: <span className="capitalize">{resume.templateId.replace('-', ' ')}</span> • Updated {new Date(resume.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <span>{resume.completionPercentage}%</span>
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${resume.completionPercentage}%` }}
                            />
                          </div>
                        </div>
                        <Link to={`/editor/${resume.id}`}>
                          <Button size="sm" variant="outline">Edit</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Application Pipeline Overview */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-800">Application Pipeline</h2>
                </div>
                <Link to="/tracker" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  Open Kanban <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span className="text-xs text-slate-500 font-medium">Applied</span>
                  <p className="text-lg font-bold text-slate-800">{data.applicationsSummary.applied}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                  <span className="text-xs text-blue-600 font-medium">Interview</span>
                  <p className="text-lg font-bold text-blue-800">{data.applicationsSummary.interview}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                  <span className="text-xs text-emerald-600 font-medium">Offer</span>
                  <p className="text-lg font-bold text-emerald-800">{data.applicationsSummary.offer}</p>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-center">
                  <span className="text-xs text-rose-600 font-medium">Rejected</span>
                  <p className="text-lg font-bold text-rose-800">{data.applicationsSummary.rejected}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Onboarding Checklist & Upcoming Reminders */}
          <div className="space-y-6">
            {/* Onboarding Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800">Onboarding Checklist</h2>
                <span className="text-xs font-semibold text-slate-500">
                  {completedCount}/{checklistItems.length} Done
                </span>
              </div>

              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / checklistItems.length) * 100}%` }}
                />
              </div>

              <div className="space-y-2.5 pt-1">
                {checklistItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.link}
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    {item.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0 group-hover:text-blue-500" />
                    )}
                    <span
                      className={`text-xs ${
                        item.done ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Upcoming Interviews & Reminders */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-800">Upcoming Interviews</h2>
              </div>

              {data.upcomingInterviews.length === 0 ? (
                <p className="text-xs text-slate-500">No interviews scheduled yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.upcomingInterviews.map((iv) => (
                    <div key={iv.id} className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-indigo-900">{iv.company}</p>
                        <p className="text-[11px] text-indigo-700">{iv.type} • {iv.title}</p>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {new Date(iv.scheduledAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Follow-Up Reminders</h3>
                </div>
                {data.followUpReminders.length === 0 ? (
                  <p className="text-xs text-slate-400">All caught up! No pending reminders.</p>
                ) : (
                  <div className="space-y-1.5">
                    {data.followUpReminders.map((rem) => (
                      <div key={rem.id} className="text-xs text-slate-600 flex items-center justify-between">
                        <span>{rem.title}</span>
                        <span className="text-[11px] text-amber-600 font-semibold">
                          Due {new Date(rem.dueAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};
