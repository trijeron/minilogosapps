import React, { useState } from 'react';
import { Smartphone, Download, CheckCircle2, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../i18n/LanguageContext';

interface PWAInstallButtonProps {
  variant?: 'header' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const { pick } = useLanguage();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (variant === 'header') {
    if (isInstalled || (!isInstallable && !isIOS)) return null;

    return (
      <>
        <button
          type="button"
          onClick={() => {
            if (isInstallable) {
              void promptInstall();
            } else if (isIOS) {
              setShowIOSGuide(true);
            }
          }}
          title={pick(
            'Nainstalovat jako aplikaci na plochu (funguje i offline)',
            'Install as an app on your home screen (works offline)'
          )}
          className="px-2 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 transition-colors flex items-center justify-center gap-1 shadow-2xs text-xs font-bold"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">{pick('Aplikace', 'App')}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[1150] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900">
                    {pick('Instalace na iPhone / iPad', 'Install on iPhone / iPad')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  aria-label={pick('Zavřít', 'Close')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="text-xs text-slate-700 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <span>
                    {pick('Klepněte na tlačítko ', 'Tap the ')}
                    <strong className="inline-flex items-center gap-0.5 text-slate-900">
                      {pick('Sdílet', 'Share')} <Share className="w-3 h-3 inline" />
                    </strong>{' '}
                    {pick('v liště Safari.', 'button in Safari.')}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <span>
                    {pick('Vyberte ', 'Choose ')}
                    <strong className="inline-flex items-center gap-0.5 text-slate-900">
                      {pick('Přidat na plochu', 'Add to Home Screen')} <PlusSquare className="w-3 h-3 inline" />
                    </strong>{' '}
                    {pick('a potvrďte ', 'and tap ')}
                    <strong>{pick('Přidat', 'Add')}</strong>.
                  </span>
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
              >
                {pick('Rozumím', 'Got it')}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Settings modal card variant
  if (isInstalled) {
    return (
      <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <div>
          <p className="text-xs font-bold text-emerald-950">
            {pick('Nainstalováno jako mobilní aplikace (PWA)', 'Installed as a mobile app (PWA)')}
          </p>
          <p className="text-[11px] text-emerald-700">
            {pick(
              'Všech 6 her funguje na celou obrazovku i bez připojení k internetu.',
              'All 6 games work full-screen even without an internet connection.'
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-2xl bg-slate-900 text-white flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-bold text-white flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{pick('Instalace do mobilu (Android / iOS)', 'Install on Mobile (Android / iOS)')}</span>
        </p>
        {isInstallable ? (
          <p className="text-[11px] text-slate-300 mt-0.5">
            {pick(
              'Přidejte si Logické Hry na plochu jako nativní aplikaci s offline režimem.',
              'Add Logic Games to your home screen as an installable app with offline mode.'
            )}
          </p>
        ) : isIOS ? (
          <p className="text-[11px] text-slate-300 mt-0.5">
            {pick('V Safari klepněte na ', 'In Safari, tap ')}
            <strong>{pick('Sdílet', 'Share')}</strong> →{' '}
            <strong>{pick('Přidat na plochu', 'Add to Home Screen')}</strong>.
          </p>
        ) : (
          <p className="text-[11px] text-slate-300 mt-0.5">
            {pick('V Chrome na Androidu klepněte na menu ', 'In Chrome on Android, tap menu ')}
            <strong>⋮</strong> →{' '}
            <strong>{pick('Nainstalovat aplikaci', 'Install app')}</strong>{' '}
            {pick('(nebo ', '(or ')}
            <strong>{pick('Přidat na plochu', 'Add to Home screen')}</strong>).
          </p>
        )}
      </div>

      {isInstallable && (
        <button
          type="button"
          onClick={() => void promptInstall()}
          className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold whitespace-nowrap shadow-xs flex items-center gap-1.5 shrink-0 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{pick('Nainstalovat', 'Install')}</span>
        </button>
      )}
    </div>
  );
};
