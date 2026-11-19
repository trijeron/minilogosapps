import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  FileCode2,
  History,
  Trash2,
  Download,
  BookmarkPlus,
} from 'lucide-react';
import {
  LearningGateProgress,
  LearningGateSettings,
  LearningTask,
  LearningTaskHistoryEntry,
} from '../types/learningGate';
import {
  DEFAULT_ENGLISH_TASKS_JSON,
  parseLearningTasksJson,
} from '../utils/learningTasks';
import { formatTime } from '../utils/format';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsModalProps {
  isOpen: boolean;
  settings: LearningGateSettings;
  progress: LearningGateProgress;
  taskHistory: LearningTaskHistoryEntry[];
  onSave: (next: LearningGateSettings, setName?: string) => void;
  onSaveToHistory: (rawJson: string, setName?: string) => void;
  onDeleteHistory: (id: string) => void;
  onResetProgress: () => void;
  onPreviewTasks: (tasks: LearningTask[], count: number) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  progress,
  taskHistory,
  onSave,
  onSaveToHistory,
  onDeleteHistory,
  onResetProgress,
  onPreviewTasks,
  onClose,
}) => {
  const [draft, setDraft] = useState<LearningGateSettings>(settings);
  const [setName, setSetName] = useState<string>('');
  const [showSchemaHelp, setShowSchemaHelp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft(settings);
      setSetName('');
    }
  }, [isOpen, settings]);

  const jsonValidation = useMemo(
    () => parseLearningTasksJson(draft.customJson),
    [draft.customJson]
  );

  if (!isOpen) return null;

  const canSave = !draft.enabled || jsonValidation.ok;
  const noTriggerSelected =
    draft.enabled && !draft.triggerByGames && !draft.triggerByMinutes;
  const normalizedDraftJson = draft.customJson.trim();

  const handleSaveClick = () => {
    if (!canSave) return;
    onSave(
      {
        ...draft,
        gamesLimit: Math.max(1, Math.min(99, Number(draft.gamesLimit) || 1)),
        minutesLimit: Math.max(1, Math.min(240, Number(draft.minutesLimit) || 1)),
        tasksPerBreak: Math.max(1, Math.min(5, Number(draft.tasksPerBreak) || 1)),
      },
      setName.trim() || undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                Nastavení učitelského módu
              </h2>
              <p className="text-xs text-slate-500">
                Limity, historie úkolů v sessionStorage a offline stažení
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Zavřít"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Enable switch */}
        <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer">
          <div>
            <p className="text-sm font-bold text-slate-900">
              Aktivovat učící úkoly po limitu
            </p>
            <p className="text-xs text-slate-500">
              Po dosažení limitu se otevře okno s úkolem (např. angličtina)
            </p>
          </div>
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, enabled: e.target.checked }))
            }
            className="w-5 h-5 accent-indigo-600 rounded cursor-pointer shrink-0"
          />
        </label>

        {/* Triggers: Games count & Minutes */}
        <div className="flex flex-col gap-2.5">
          <p className="text-xs font-extrabold text-slate-700">
            Kdy se má okno zobrazit
          </p>

          {/* Games limit */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-white">
            <label className="flex items-center gap-2.5 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={draft.triggerByGames}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    triggerByGames: e.target.checked,
                  }))
                }
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  Počet odehraných her
                </span>
                <p className="text-[11px] text-slate-500">
                  Zobrazí se po dokončení zvoleného počtu her
                </p>
              </div>
            </label>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min={1}
                max={99}
                disabled={!draft.triggerByGames}
                value={draft.gamesLimit}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    gamesLimit: Math.max(
                      1,
                      Math.min(99, parseInt(e.target.value, 10) || 1)
                    ),
                  }))
                }
                className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-bold text-center tabular-nums disabled:opacity-45"
              />
              <span className="text-xs text-slate-600 font-medium">her</span>
            </div>
          </div>

          {/* Minutes limit */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-white">
            <label className="flex items-center gap-2.5 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={draft.triggerByMinutes}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    triggerByMinutes: e.target.checked,
                  }))
                }
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  Časový limit hraní
                </span>
                <p className="text-[11px] text-slate-500">
                  Zobrazí se po uplynutí nastavených minut hraní
                </p>
              </div>
            </label>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min={1}
                max={240}
                disabled={!draft.triggerByMinutes}
                value={draft.minutesLimit}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    minutesLimit: Math.max(
                      1,
                      Math.min(240, parseInt(e.target.value, 10) || 1)
                    ),
                  }))
                }
                className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-bold text-center tabular-nums disabled:opacity-45"
              />
              <span className="text-xs text-slate-600 font-medium">min</span>
            </div>
          </div>

          {noTriggerSelected && (
            <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Zaškrtněte alespoň jeden limit (počet her nebo minut), aby se
              přestávka spouštěla.
            </p>
          )}
        </div>

        {/* Tasks per break + Current counter status */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              Úkolů v jedné přestávce:
            </span>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
              {[1, 2, 3].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, tasksPerBreak: cnt }))
                  }
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                    draft.tasksPerBreak === cnt
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
            <span>
              Odehráno:{' '}
              <strong className="text-slate-800">
                {progress.gamesSinceLastGate}
              </strong>
              /{draft.gamesLimit}
              {' · '}
              Čas:{' '}
              <strong className="text-slate-800">
                {formatTime(progress.secondsSinceLastGate)}
              </strong>
            </span>
            <button
              type="button"
              onClick={onResetProgress}
              title="Vynulovat aktuální počítadlo her a času"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Previous Task Sets Picker (sessionStorage) */}
        <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span>Předchozí sady úkolů ({taskHistory.length})</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Uloženo v sessionStorage
            </span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-0.5">
            {taskHistory.map((entry) => {
              const isSelected = entry.json.trim() === normalizedDraftJson;
              const isDefault = entry.id === 'default_english_v1';
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-950'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setDraft((prev) => ({ ...prev, customJson: entry.json }));
                      setSetName(isDefault ? '' : entry.name);
                    }}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="text-xs font-bold truncate">{entry.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {entry.taskCount} úkolů · {entry.typesSummary}
                    </p>
                  </button>

                  {isSelected && (
                    <span className="text-[10px] font-bold text-indigo-700 shrink-0">
                      Vybráno
                    </span>
                  )}

                  {!isDefault && (
                    <button
                      type="button"
                      onClick={() => onDeleteHistory(entry.id)}
                      title="Odebrat sadu z historie"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* JSON Editor Section */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <FileCode2 className="w-4 h-4 text-indigo-600" />
              <span>Zadání úkolů (JSON)</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowSchemaHelp((prev) => !prev)}
                className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700"
              >
                {showSchemaHelp ? 'Skrýt nápovědu JSON' : 'Ukázka formátu'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    customJson: DEFAULT_ENGLISH_TASKS_JSON,
                  }))
                }
                className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-indigo-700"
              >
                Výchozí angličtina
              </button>
            </div>
          </div>

          {showSchemaHelp && (
            <pre className="p-2.5 rounded-xl bg-slate-900 text-slate-100 text-[10px] font-mono overflow-x-auto leading-relaxed">
{`[
  {
    "type": "match",
    "prompt": "Spoj slova",
    "pairs": [
      { "left": "Apple", "right": "Jablko" },
      { "left": "Dog", "right": "Pes" }
    ]
  },
  {
    "type": "fill",
    "prompt": "Doplň anglicky Kočka:",
    "answer": "cat",
    "hint": "3 písmena"
  },
  {
    "type": "choice",
    "prompt": "Jak se řekne modrá?",
    "options": ["Red", "Blue", "Green"],
    "correctIndex": 1
  }
]`}
            </pre>
          )}

          {/* Optional name + Save to history button */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              placeholder="Název sady pro historii (volitelné, např. Slovíčka lekce 4)"
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              disabled={!jsonValidation.ok}
              onClick={() => {
                if (!jsonValidation.ok) return;
                onSaveToHistory(draft.customJson, setName.trim() || undefined);
              }}
              title="Uložit aktuální JSON sadu do historie v sessionStorage"
              className="px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-45 text-indigo-800 text-[11px] font-bold flex items-center gap-1 shrink-0"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Do historie</span>
            </button>
          </div>

          <textarea
            value={draft.customJson}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, customJson: e.target.value }))
            }
            rows={7}
            spellCheck={false}
            className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-mono text-[11px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white leading-relaxed"
            placeholder="Vložte JSON pole úkolů..."
          />

          {/* Live Validation Status */}
          {jsonValidation.ok ? (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Platný JSON · Načteno {jsonValidation.tasks.length} úkolů
                </span>
              </span>
              <button
                type="button"
                onClick={() =>
                  onPreviewTasks(jsonValidation.tasks, draft.tasksPerBreak)
                }
                className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 shrink-0"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Vyzkoušet</span>
              </button>
            </div>
          ) : (
            <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{jsonValidation.error}</span>
            </div>
          )}
        </div>

        {/* Mobile App (PWA) Install Card */}
        <PWAInstallButton variant="card" />

        {/* Offline HTML Download Card (moved from Header into Settings) */}
        <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-indigo-950">
              Offline verze aplikace (6v1 HTML)
            </p>
            <p className="text-[11px] text-indigo-700">
              Stáhněte všech 6 her jako jeden samostatný HTML soubor do PC nebo mobilu.
            </p>
          </div>
          <a
            href="./minisudoku.html"
            download="logicke_hry_6v1.html"
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold whitespace-nowrap shadow-xs flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Stáhnout HTML</span>
          </a>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold"
          >
            Zrušit
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSaveClick}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-45 text-white text-xs font-bold shadow-xs"
          >
            Uložit nastavení
          </button>
        </div>
      </div>
    </div>
  );
};
