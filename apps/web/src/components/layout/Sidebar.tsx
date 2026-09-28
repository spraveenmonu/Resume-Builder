import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Mail,
  Briefcase,
  Sliders,
  Settings,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store.js';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'My Resumes', to: '/editor', icon: FileText },
    { label: 'Cover Letters', to: '/cover-letters', icon: Mail },
    { label: 'Job Tracker', to: '/tracker', icon: Briefcase },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ label: 'Admin Panel', to: '/admin', icon: Shield });
  }

  return (
    <aside className="w-64 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0 hidden md:flex">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
        <p className="font-semibold text-slate-700 mb-0.5">CareerCraft Pro</p>
        <p>12 ATS templates, unlimited PDF exports & AI writing tools active.</p>
      </div>
    </aside>
  );
};
