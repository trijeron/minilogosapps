import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Minus,
  Plus,
  Upload,
  FolderOpen,
  Globe,
  Loader2,
  Shuffle,
} from 'lucide-react';
import {
  LearningGateProgress,
  LearningGateSettings,
  LearningTask,
  LearningTaskHistoryEntry,
} from '../types/learningGate';
import {
  DEFAULT_ENGLISH_TASKS_JSON,
  RemoteCatalogItem,
  parseLearningTasksJson,
  parseRemoteTasksOrCatalog,
  validateTaskSourceUrl,
} from '../utils/learningTasks';
import {
  loadLastTaskSourceUrl,
  saveLastTaskSourceUrl,
} from '../utils/storage';
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
  onPreviewTasks: (tasks: LearningTask[], count: number, randomOrder: boolean) => void;
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
  const [webUrl, setWebUrl] = useState<string>(() => loadLastTaskSourceUrl());
  const [isLoadingWeb, setIsLoadingWeb] = useState<boolean>(false);
  const [webCatalog, setWebCatalog] = useState<RemoteCatalogItem[]>([]);
  const [importFeedback, setImportFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(settings);
      setSetName('');
      setImportFeedback(null);
      setWebUrl(loadLastTaskSourceUrl());
    }
  }, [isOpen, settings]);

  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '');
      folderInputRef.current.setAttribute('directory', '');
    }
  }, [isOpen]);

  const jsonValidation = useMemo(
    () => parseLearningTasksJson(draft.customJson),
    [draft.customJson]
  );

  if (!isOpen) return null;

  const applyImportedTaskSet = (
    normalizedJson: string,
    importedName: string | undefined,
    taskCount: number,
    sourceLabel: string
  ) => {
    setDraft((prev) => ({ ...prev, customJson: normalizedJson }));
    if (importedName) {
      setSetName(importedName);
    }
    onSaveToHistory(normalizedJson, importedName);
    setImportFeedback({
      type: 'success',
      message: `Načtena sada${importedName ? ` „${importedName}“` : ''} ${sourceLabel} (${taskCount} úkolů).`,
    });
  };

  const handleFilesSelected = async (
    fileList: FileList | null,
    fromFolder: boolean
  ) => {
    if (!fileList || fileList.length === 0) return;
    setImportFeedback(null);

    const allFiles = Array.from(fileList);
    const jsonCandidates = fromFolder
      ? allFiles.filter((f) => /\.(json|txt)$/i.test(f.name))
      : allFiles;

    if (jsonCandidates.length === 0) {
      setImportFeedback({
        type: 'error',
        message: 'Ve vybrané složce nebyl nalezen žádný .json soubor.',
      });
      return;
    }

    const importedSets: Array<{
      name?: string;
      json: string;
      taskCount: number;
    }> = [];
    let skipped = 0;
    let lastError = '';

    for (const file of jsonCandidates) {
      try {
        const text = await file.text();
        const res = parseRemoteTasksOrCatalog(text, file.name);
        if (res.kind === 'tasks') {
          importedSets.push({
            name: res.name,
            json: res.normalizedJson,
            taskCount: res.tasks.length,
          });
        } else if (res.kind === 'catalog') {
          const inlineItems = res.items.filter((it) => it.inlineJson);
          if (inlineItems.length > 0) {
            for (const item of inlineItems) {
              importedSets.push({
                name: item.name,
                json: item.inlineJson!,
                taskCount: item.taskCount || 1,
              });
            }
          } else {
            skipped++;
            lastError = `Soubor ${file.name} obsahuje pouze webový katalog odkazů.`;
          }
        } else {
          skipped++;
          lastError = `${file.name}: ${res.error}`;
        }
      } catch {
        skipped++;
        lastError = `Soubor ${file.name} se nepodařilo přečíst.`;
      }
    }

    if (importedSets.length === 0) {
      setImportFeedback({
        type: 'error',
        message: lastError || 'Nepodařilo se načíst žádný platný JSON soubor s úkoly.',
      });
      return;
    }

    // Save in reverse order so the first file appears at the top of the list
    for (let i = importedSets.length - 1; i >= 0; i--) {
      onSaveToHistory(importedSets[i].json, importedSets[i].name);
    }

    const first = importedSets[0];
    setDraft((prev) => ({ ...prev, customJson: first.json }));
    setSetName(first.name || '');
    setWebCatalog([]);

    if (importedSets.length === 1) {
      setImportFeedback({
        type: 'success',
        message: `Načtena sada${first.name ? ` „${first.name}“` : ''} ze souboru (${first.taskCount} úkolů)${skipped > 0 ? ` · přeskočeno ${skipped}` : ''}.`,
      });
    } else {
      setImportFeedback({
        type: 'success',
        message: `Načteno ${importedSets.length} sad ${fromFolder ? 'ze složky' : 'ze souborů'} (aktivní: „${first.name || 'Sada 1'}“)${skipped > 0 ? ` · přeskočeno ${skipped}` : ''}.`,
      });
    }
  };

  const fetchJsonFromUrl = async (targetUrl: string, overrideName?: string) => {
    const validated = validateTaskSourceUrl(targetUrl);
    if (!validated.ok) {
      setImportFeedback({ type: 'error', message: validated.error });
      return;
    }

    setIsLoadingWeb(true);
    setImportFeedback(null);
    saveLastTaskSourceUrl(targetUrl);

    try {
      const response = await fetch(validated.url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Server vrátil chybu HTTP ${response.status}.`);
      }
      const text = await response.text();
      const parsed = parseRemoteTasksOrCatalog(text, validated.url);

      if (parsed.kind === 'error') {
        setImportFeedback({ type: 'error', message: parsed.error });
        return;
      }

      if (parsed.kind === 'catalog') {
        setWebCatalog(parsed.items);
        setImportFeedback({
          type: 'success',
          message: `Načten webový katalog (${parsed.items.length} sad) — klikněte na sadu níže.`,
        });
        return;
      }

      const finalName = overrideName || parsed.name;
      applyImportedTaskSet(
        parsed.normalizedJson,
        finalName,
        parsed.tasks.length,
        'z webu'
      );
    } catch (err) {
      const msg =
        err instanceof Error && err.message.startsWith('Server vrátil')
          ? err.message
          : 'Soubor se nepodařilo stáhnout. Zkontrolujte URL, připojení nebo CORS nastavení na serveru.';
      setImportFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoadingWeb(false);
    }
  };

  const handleSelectCatalogItem = async (item: RemoteCatalogItem) => {
    if (item.inlineJson) {
      const check = parseLearningTasksJson(item.inlineJson);
      if (check.ok) {
        applyImportedTaskSet(
          item.inlineJson,
          item.name,
          check.tasks.length,
          'z webového katalogu'
        );
      }
      return;
    }
    if (item.url) {
      await fetchJsonFromUrl(item.url, item.name);
    }
  };

  const canSave = !draft.enabled || jsonValidation.ok;
  const effectiveGamesLimit = Math.max(0, Math.min(10, Math.round(Number(draft.gamesLimit) || 0)));
  const effectiveMinutesLimit = Math.max(0, Math.min(10, Math.round(Number(draft.minutesLimit) || 0)));
  const effectiveTasksPerBreak = Math.max(1, Math.min(10, Math.round(Number(draft.tasksPerBreak) || 1)));
  const noTriggerSelected =
    draft.enabled && effectiveGamesLimit === 0 && effectiveMinutesLimit === 0;
  const normalizedDraftJson = draft.customJson.trim();

  const formatGamesBadge = (count: number) => {
    if (count === 0) return 'Nikdy (0)';
    if (count === 1) return '1 hra';
    if (count >= 2 && count <= 4) return `${count} hry`;
    return `${count} her`;
  };

  const formatMinutesBadge = (mins: number) => {
    if (mins === 0) return 'Nikdy (0)';
    return `${mins} min`;
  };

  const formatQuestionsBadge = (count: number) => {
    if (count === 1) return '1 otázka';
    if (count >= 2 && count <= 4) return `${count} otázky`;
    return `${count} otázek`;
  };

  const setGamesLimitValue = (val: number) => {
    const clamped = Math.max(0, Math.min(10, Math.round(val)));
    setDraft((prev) => ({
      ...prev,
      gamesLimit: clamped,
      triggerByGames: clamped > 0,
    }));
  };

  const setMinutesLimitValue = (val: number) => {
    const clamped = Math.max(0, Math.min(10, Math.round(val)));
    setDraft((prev) => ({
      ...prev,
      minutesLimit: clamped,
      triggerByMinutes: clamped > 0,
    }));
  };

  const setTasksPerBreakValue = (val: number) => {
    const clamped = Math.max(1, Math.min(10, Math.round(val)));
    setDraft((prev) => ({
      ...prev,
      tasksPerBreak: clamped,
    }));
  };

  const handleSaveClick = () => {
    if (!canSave) return;
    onSave(
      {
        ...draft,
        triggerByGames: effectiveGamesLimit > 0,
        gamesLimit: effectiveGamesLimit,
        triggerByMinutes: effectiveMinutesLimit > 0,
        minutesLimit: effectiveMinutesLimit,
        tasksPerBreak: effectiveTasksPerBreak,
        randomOrder: Boolean(draft.randomOrder),
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

        {/* Triggers: Touch-friendly Sliders (0–10, 0 = never) */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold text-slate-700">
              Kdy se má okno zobrazit
            </p>
            <span className="text-[11px] text-slate-500">0 = nikdy</span>
          </div>

          {/* Games limit slider (0–10) */}
          <div className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  Počet odehraných her
                </span>
                <p className="text-[11px] text-slate-500">
                  {effectiveGamesLimit === 0
                    ? 'Vypnuto — po dokončení her se okno neotevře'
                    : `Otevře se po každých ${formatGamesBadge(effectiveGamesLimit)}`}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold tabular-nums shrink-0 ${
                  effectiveGamesLimit === 0
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-indigo-100 text-indigo-800'
                }`}
              >
                {formatGamesBadge(effectiveGamesLimit)}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setGamesLimitValue(effectiveGamesLimit - 1)}
                disabled={effectiveGamesLimit <= 0}
                aria-label="Snížit počet her"
                className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-35 text-slate-700 flex items-center justify-center shrink-0 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={effectiveGamesLimit}
                onChange={(e) => setGamesLimitValue(Number(e.target.value))}
                aria-label="Limit počtu her (0 až 10)"
                className="flex-1 h-2.5 accent-indigo-600 cursor-pointer touch-pan-x"
              />
              <button
                type="button"
                onClick={() => setGamesLimitValue(effectiveGamesLimit + 1)}
                disabled={effectiveGamesLimit >= 10}
                aria-label="Zvýšit počet her"
                className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-35 text-slate-700 flex items-center justify-center shrink-0 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-10">
              <span>0 (Nikdy)</span>
              <span>5</span>
              <span>10 her</span>
            </div>
          </div>

          {/* Minutes limit slider (0–10) */}
          <div className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  Časový limit hraní
                </span>
                <p className="text-[11px] text-slate-500">
                  {effectiveMinutesLimit === 0
                    ? 'Vypnuto — časový limit je neaktivní'
                    : `Otevře se každých ${effectiveMinutesLimit} min hraní`}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold tabular-nums shrink-0 ${
                  effectiveMinutesLimit === 0
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-indigo-100 text-indigo-800'
                }`}
              >
                {formatMinutesBadge(effectiveMinutesLimit)}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMinutesLimitValue(effectiveMinutesLimit - 1)}
                disabled={effectiveMinutesLimit <= 0}
                aria-label="Snížit časový limit"
                className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-35 text-slate-700 flex items-center justify-center shrink-0 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={effectiveMinutesLimit}
                onChange={(e) => setMinutesLimitValue(Number(e.target.value))}
                aria-label="Časový limit v minutách (0 až 10)"
                className="flex-1 h-2.5 accent-indigo-600 cursor-pointer touch-pan-x"
              />
              <button
                type="button"
                onClick={() => setMinutesLimitValue(effectiveMinutesLimit + 1)}
                disabled={effectiveMinutesLimit >= 10}
                aria-label="Zvýšit časový limit"
                className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-35 text-slate-700 flex items-center justify-center shrink-0 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-10">
              <span>0 (Nikdy)</span>
              <span>5 min</span>
              <span>10 min</span>
            </div>
          </div>

          {noTriggerSelected && (
            <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Oba posuvníky jsou na 0 (Nikdy) — nastavte alespoň 1 hru nebo 1
              minutu, aby se přestávka spouštěla.
            </p>
          )}
        </div>

        {/* Questions per break (1–10 slider) + Random order toggle */}
        <div className="flex flex-col gap-2.5">
          {/* Questions count slider (1–10) */}
          <div className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  Počet otázek pro pokračování
                </span>
                <p className="text-[11px] text-slate-500">
                  Kolik otázek musí hráč správně vyřešit, aby mohl hrát dál
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold tabular-nums shrink-0 bg-indigo-100 text-indigo-800">
                {formatQuestionsBadge(effectiveTasksPerBreak)}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setTasksPerBreakValue(effectiveTasksPerBreak - 1)}
                disabled={effectiveTasksPerBreak <= 1}
                aria-label="Snížit počet otázek pro pokračování"
                className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-35 text-slate-700 flex items-center justify-center shrink-0 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={effectiveTasksPerBreak}
                onChange={(e) => setTasksPerBreakValue(Number(e.target.value))}
                aria-label="Počet otázek pro pokračování (1 až 10)"
                className="flex-1 h-2.5 accent-indigo-600 cursor-pointer touch-pan-x"
              />
              <button
                type="button"
                onClick={() => setTasksPerBreakValue(effectiveTasksPerBreak + 1)}
                disabled={effectiveTasksPerBreak >= 10}
                aria-label="Zvýšit počet otázek pro pokračování"
                className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-35 text-slate-700 flex items-center justify-center shrink-0 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-10">
              <span>1 otázka</span>
              <span>5</span>
              <span>10 otázek</span>
            </div>
          </div>

          {/* Random rotation switch */}
          <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer">
            <div className="flex items-start gap-2">
              <Shuffle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  Náhodné střídání otázek
                </p>
                <p className="text-[11px] text-slate-500">
                  {draft.randomOrder
                    ? 'Otázky se losují náhodně bez opakování, dokud se neprostřídají všechny'
                    : 'Otázky se zobrazují postupně v pořadí ze zadání'}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={draft.randomOrder}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, randomOrder: e.target.checked }))
              }
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer shrink-0"
            />
          </label>

          {/* Current counter status */}
          <div className="flex items-center justify-end gap-2 px-1 text-xs text-slate-500 tabular-nums">
            <span>
              Odehráno:{' '}
              <strong className="text-slate-800">
                {progress.gamesSinceLastGate}
              </strong>
              {effectiveGamesLimit > 0 ? `/${effectiveGamesLimit}` : ''}
              {' · '}
              Čas:{' '}
              <strong className="text-slate-800">
                {formatTime(progress.secondsSinceLastGate)}
              </strong>
              {effectiveMinutesLimit > 0 ? `/${effectiveMinutesLimit}:00` : ''}
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

        {/* Import JSON Tasks from Phone (File / Folder) or Web URL */}
        <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-indigo-50/55 border border-indigo-200/70">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Načíst úkoly z telefonu nebo z webu</span>
            </span>
            <span className="text-[10px] text-indigo-700 font-semibold">
              .json
            </span>
          </div>

          {/* Hidden native pickers */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json,.txt,text/plain"
            multiple
            className="hidden"
            onChange={(e) => {
              void handleFilesSelected(e.target.files, false);
              e.target.value = '';
            }}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              void handleFilesSelected(e.target.files, true);
              e.target.value = '';
            }}
          />

          {/* Device / Phone file & folder buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 active:bg-indigo-100 text-indigo-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Soubor(y) JSON</span>
            </button>
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="px-3 py-2 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 active:bg-indigo-100 text-indigo-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Složka v telefonu</span>
            </button>
          </div>

          {/* Web URL loader */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1 min-w-0">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="url"
                value={webUrl}
                onChange={(e) => setWebUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void fetchJsonFromUrl(webUrl);
                  }
                }}
                placeholder="https://ithonza.cz/games/ukoly.json nebo ./ukoly.json"
                className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="button"
              disabled={isLoadingWeb || !webUrl.trim()}
              onClick={() => void fetchJsonFromUrl(webUrl)}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
            >
              {isLoadingWeb ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Globe className="w-3.5 h-3.5" />
              )}
              <span>Načíst</span>
            </button>
          </div>

          {/* Optional Web Catalog Picker */}
          {webCatalog.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1 border-t border-indigo-200/70">
              <p className="text-[11px] font-bold text-indigo-900">
                Vyberte sadu z webového katalogu ({webCatalog.length}):
              </p>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {webCatalog.map((item, idx) => (
                  <button
                    key={`${item.name}_${idx}`}
                    type="button"
                    disabled={isLoadingWeb}
                    onClick={() => void handleSelectCatalogItem(item)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-100/70 text-left flex items-center justify-between gap-2 text-xs font-bold text-indigo-950 transition-colors disabled:opacity-50"
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="text-[10px] font-semibold text-indigo-600 shrink-0">
                      {item.taskCount ? `${item.taskCount} úkolů` : 'Stáhnout'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Import Feedback Banner */}
          {importFeedback && (
            <div
              className={`px-2.5 py-2 rounded-xl border text-[11px] font-semibold flex items-start gap-1.5 ${
                importFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {importFeedback.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{importFeedback.message}</span>
            </div>
          )}
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
]

// Volitelný webový katalog více sad:
// { "sets": [{ "name": "Lekce 1", "url": "./lekce1.json" }] }`}
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
                  onPreviewTasks(
                    jsonValidation.tasks,
                    effectiveTasksPerBreak,
                    draft.randomOrder
                  )
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
