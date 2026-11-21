import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface ErrorAlertBannerProps {
  hasError: boolean;
  message: string;
  detail?: string;
}

export const ErrorAlertBanner: React.FC<ErrorAlertBannerProps> = ({
  hasError,
  message,
  detail,
}) => {
  const { pick } = useLanguage();
  if (!hasError) return null;

  return (
    <div className="w-full bg-rose-50 border-2 border-rose-400 rounded-xl p-2.5 flex items-start gap-2 text-rose-900 shadow-sm animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="w-6 h-6 rounded-lg bg-rose-200 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
        <AlertTriangle className="w-4 h-4 fill-rose-500 text-white animate-pulse" />
      </div>
      <div className="flex-1 flex flex-col">
        <span className="text-xs font-bold leading-tight flex items-center gap-1 text-rose-800">
          <span>{pick('Pozor: Zjištěna chyba v pravidlech!', 'Warning: Rule violation detected!')}</span>
        </span>
        <span className="text-[11px] text-rose-700 font-medium leading-snug mt-0.5">
          {message}
        </span>
        {detail && (
          <span className="text-[10px] text-rose-600 font-normal leading-tight mt-0.5">
            {detail}
          </span>
        )}
      </div>
    </div>
  );
};
