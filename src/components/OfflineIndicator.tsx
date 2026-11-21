import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useLanguage } from '../i18n/LanguageContext';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { pick } = useLanguage();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[1050] px-3.5 py-2 rounded-2xl bg-slate-900/95 text-white border border-slate-700 shadow-lg flex items-center gap-2 text-xs font-semibold whitespace-nowrap backdrop-blur-xs"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>
        {pick(
          'Offline režim · Všech 6 her funguje bez internetu',
          'Offline mode · All 6 games work without internet'
        )}
      </span>
    </div>
  );
};
