import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const criteria = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special symbol (!@#$%^&*)', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = criteria.filter((c) => c.met).length;

  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = [
    'bg-rose-500',
    'bg-rose-400',
    'bg-amber-400',
    'bg-blue-500',
    'bg-emerald-500',
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Strength:</span>
        <span className="font-semibold text-slate-700">
          {score > 0 ? strengthLabels[score - 1] : 'Too weak'}
        </span>
      </div>

      <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`h-full flex-1 transition-all duration-300 ${
              index < score ? strengthColors[score - 1] : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {criteria.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            {c.met ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            )}
            <span className={c.met ? 'text-slate-700 font-medium' : 'text-slate-400'}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
