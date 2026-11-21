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
  RefreshCw,
  BookmarkPlus,
  Minus,
  Plus,
  Upload,
  FolderOpen,
  Globe,
  Loader2,
  Shuffle,
  Copy,
  Check,
  MessageSquareText,
  Wand2,
} from 'lucide-react';
import {
  LearningGateProgress,
  LearningGateSettings,
  LearningTask,
  LearningTaskHistoryEntry,
} from '../types/learningGate';
import {
  DEFAULT_ENGLISH_TASKS_JSON,
  DEFAULT_EN_QUIZ_TASKS_JSON,
  RemoteCatalogItem,
  buildTaskGeneratorPrompt,
  parseLearningTasksJson,
  parseRemoteTasksOrCatalog,
  validateTaskSourceUrl,
} from '../utils/learningTasks';
import {
  loadLastTaskSourceUrl,
  saveLastTaskSourceUrl,
} from '../utils/storage';
import { formatTime } from '../utils/format';
import {
  APP_BUILD_DATE,
  APP_VERSION,
  UpdateCheckResult,
  checkForAppUpdate,
} from '../utils/appVersion';
import { PWAInstallButton } from './PWAInstallButton';
import { useLanguage } from '../i18n/LanguageContext';

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
  const { lang, isEn, pick } = useLanguage();
  const [draft, setDraft] = useState<LearningGateSettings>(settings);
  const [setName, setSetName] = useState<string>('');
  const [showSchemaHelp, setShowSchemaHelp] = useState(false);
  const [showPromptBuilder, setShowPromptBuilder] = useState(false);
  const [promptTopic, setPromptTopic] = useState<string>('');
  const [promptCount, setPromptCount] = useState<number>(12);
  const [promptCopied, setPromptCopied] = useState<boolean>(false);
  const [webUrl, setWebUrl] = useState<string>(() => loadLastTaskSourceUrl());
  const [isLoadingWeb, setIsLoadingWeb] = useState<boolean>(false);
  const [webCatalog, setWebCatalog] = useState<RemoteCatalogItem[]>([]);
  const [importFeedback, setImportFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [geminiTopic, setGeminiTopic] = useState<string>('');
  const [geminiCount, setGeminiCount] = useState<number>(12);
  const [isGeneratingGemini, setIsGeneratingGemini] = useState<boolean>(false);
  const [geminiFeedback, setGeminiFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    tasks?: LearningTask[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(settings);
      setSetName('');
      setImportFeedback(null);
      setGeminiFeedback(null);
      setIsGeneratingGemini(false);
      setUpdateResult(null);
      setIsCheckingUpdate(false);
      setPromptCopied(false);
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
    () => parseLearningTasksJson(draft.customJson, lang),
    [draft.customJson, lang]
  );

  const generatedPrompt = useMemo(
    () => buildTaskGeneratorPrompt(promptTopic, lang, promptCount),
    [promptTopic, lang, promptCount]
  );

  if (!isOpen) return null;

  const handleCopyPrompt = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generatedPrompt);
      } else {
        const ta = document.createElement('textarea');
        ta.value = generatedPrompt;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setPromptCopied(true);
      window.setTimeout(() => setPromptCopied(false), 2200);
    } catch {
      setPromptCopied(false);
    }
  };

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
      message: isEn
        ? `Loaded set${importedName ? ` "${importedName}"` : ''} ${sourceLabel} (${taskCount} tasks).`
        : `Načtena sada${importedName ? ` „${importedName}“` : ''} ${sourceLabel} (${taskCount} úkolů).`,
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
        message: pick(
          'Ve vybrané složce nebyl nalezen žádný .json soubor.',
          'No .json file was found in the selected folder.'
        ),
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
        const res = parseRemoteTasksOrCatalog(text, file.name, lang);
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
            lastError = isEn
              ? `File ${file.name} only contains a remote URL catalog.`
              : `Soubor ${file.name} obsahuje pouze webový katalog odkazů.`;
          }
        } else {
          skipped++;
          lastError = `${file.name}: ${res.error}`;
        }
      } catch {
        skipped++;
        lastError = isEn
          ? `Could not read file ${file.name}.`
          : `Soubor ${file.name} se nepodařilo přečíst.`;
      }
    }

    if (importedSets.length === 0) {
      setImportFeedback({
        type: 'error',
        message:
          lastError ||
          pick(
            'Nepodařilo se načíst žádný platný JSON soubor s úkoly.',
            'Failed to load any valid JSON task file.'
          ),
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
        message: isEn
          ? `Loaded set${first.name ? ` "${first.name}"` : ''} from file (${first.taskCount} tasks)${skipped > 0 ? ` · skipped ${skipped}` : ''}.`
          : `Načtena sada${first.name ? ` „${first.name}“` : ''} ze souboru (${first.taskCount} úkolů)${skipped > 0 ? ` · přeskočeno ${skipped}` : ''}.`,
      });
    } else {
      setImportFeedback({
        type: 'success',
        message: isEn
          ? `Loaded ${importedSets.length} sets ${fromFolder ? 'from folder' : 'from files'} (active: "${first.name || 'Set 1'}")${skipped > 0 ? ` · skipped ${skipped}` : ''}.`
          : `Načteno ${importedSets.length} sad ${fromFolder ? 'ze složky' : 'ze souborů'} (aktivní: „${first.name || 'Sada 1'}“)${skipped > 0 ? ` · přeskočeno ${skipped}` : ''}.`,
      });
    }
  };

  const fetchJsonFromUrl = async (targetUrl: string, overrideName?: string) => {
    const validated = validateTaskSourceUrl(targetUrl, lang);
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
        throw new Error(
          isEn
            ? `Server returned HTTP ${response.status}.`
            : `Server vrátil chybu HTTP ${response.status}.`
        );
      }
      const text = await response.text();
      const parsed = parseRemoteTasksOrCatalog(text, validated.url, lang);

      if (parsed.kind === 'error') {
        setImportFeedback({ type: 'error', message: parsed.error });
        return;
      }

      if (parsed.kind === 'catalog') {
        setWebCatalog(parsed.items);
        setImportFeedback({
          type: 'success',
          message: isEn
            ? `Loaded web catalog (${parsed.items.length} sets) — pick a set below.`
            : `Načten webový katalog (${parsed.items.length} sad) — klikněte na sadu níže.`,
        });
        return;
      }

      const finalName = overrideName || parsed.name;
      applyImportedTaskSet(
        parsed.normalizedJson,
        finalName,
        parsed.tasks.length,
        pick('z webu', 'from web')
      );
    } catch (err) {
      const msg =
        err instanceof Error &&
        (err.message.startsWith('Server vrátil') || err.message.startsWith('Server returned'))
          ? err.message
          : pick(
              'Soubor se nepodařilo stáhnout. Zkontrolujte URL, připojení nebo CORS nastavení na serveru.',
              'Failed to download file. Check the URL, connection, or server CORS headers.'
            );
      setImportFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoadingWeb(false);
    }
  };

  const handleSelectCatalogItem = async (item: RemoteCatalogItem) => {
    if (item.inlineJson) {
      const check = parseLearningTasksJson(item.inlineJson, lang);
      if (check.ok) {
        applyImportedTaskSet(
          item.inlineJson,
          item.name,
          check.tasks.length,
          pick('z webového katalogu', 'from web catalog')
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
    if (count === 0) return pick('Nikdy (0)', 'Never (0)');
    if (isEn) return count === 1 ? '1 game' : `${count} games`;
    if (count === 1) return '1 hra';
    if (count >= 2 && count <= 4) return `${count} hry`;
    return `${count} her`;
  };

  const formatMinutesBadge = (mins: number) => {
    if (mins === 0) return pick('Nikdy (0)', 'Never (0)');
    return `${mins} min`;
  };

  const formatQuestionsBadge = (count: number) => {
    if (isEn) return count === 1 ? '1 question' : `${count} questions`;
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

  const handleCheckUpdates = async () => {
    if (isCheckingUpdate) return;
    setIsCheckingUpdate(true);
    setUpdateResult(null);
    const result = await checkForAppUpdate();
    setUpdateResult(result);
    setIsCheckingUpdate(false);
    if (result === 'updated') {
      window.setTimeout(() => {
        window.location.reload();
      }, 700);
    }
  };

  const handleGenerateWithGemini = async () => {
    const trimmedTopic = geminiTopic.trim();
    if (!trimmedTopic) {
      setGeminiFeedback({
        type: 'error',
        message: pick(
          'Zadejte prosím oblast nebo téma otázek (např. Angličtina 4. třída – zvířata).',
          'Please enter a topic or subject area (e.g. Grade 4 English – animals).'
        ),
      });
      return;
    }

    if (isGeneratingGemini) return;
    setIsGeneratingGemini(true);
    setGeminiFeedback(null);

    try {
      const response = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: trimmedTopic,
          count: geminiCount,
          lang,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { name?: string; tasks?: unknown; error?: string }
        | null;

      if (!response.ok || !payload) {
        throw new Error(
          payload?.error ||
            (isEn
              ? `Server returned HTTP ${response.status}.`
              : `Server vrátil chybu HTTP ${response.status}.`)
        );
      }

      const rawJson = JSON.stringify(payload.tasks ?? [], null, 2);
      const validated = parseLearningTasksJson(rawJson, lang);
      if (!validated.ok) {
        throw new Error(
          validated.error ||
            (isEn
              ? 'Generated tasks did not pass validation.'
              : 'Vygenerované úkoly neprošly kontrolou formátu.')
        );
      }

      const normalizedJson = JSON.stringify(validated.tasks, null, 2);
      const generatedName =
        typeof payload.name === 'string' && payload.name.trim().length > 0
          ? payload.name.trim()
          : trimmedTopic;

      setDraft((prev) => ({ ...prev, customJson: normalizedJson }));
      setSetName(generatedName);
      onSaveToHistory(normalizedJson, generatedName);
      setGeminiFeedback({
        type: 'success',
        message: isEn
          ? `Generated ${validated.tasks.length} tasks for "${generatedName}" and loaded them into the editor.`
          : `Vygenerováno ${validated.tasks.length} úkolů pro „${generatedName}“ a rovnou připraveno k použití.`,
        tasks: validated.tasks,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setGeminiFeedback({
        type: 'error',
        message:
          msg ||
          pick(
            'Nepodařilo se spojit se serverem pro generování úkolů přes Gemini.',
            'Could not reach the server to generate tasks with Gemini.'
          ),
      });
    } finally {
      setIsGeneratingGemini(false);
    }
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
                {pick('Nastavení učitelského módu', 'Teacher Mode Settings')}
              </h2>
              <p className="text-xs text-slate-500">
                {pick(
                  `Limity, historie úkolů v sessionStorage · Verze v${APP_VERSION}`,
                  `Limits, task history in sessionStorage · Version v${APP_VERSION}`
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label={pick('Zavřít', 'Close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Enable switch */}
        <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer">
          <div>
            <p className="text-sm font-bold text-slate-900">
              {pick('Aktivovat učící úkoly po limitu', 'Enable learning tasks after limit')}
            </p>
            <p className="text-xs text-slate-500">
              {pick(
                'Po dosažení limitu se otevře okno s úkolem (např. angličtina)',
                'Opens a learning break popup when a game or time limit is reached'
              )}
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
              {pick('Kdy se má okno zobrazit', 'When to trigger a break')}
            </p>
            <span className="text-[11px] text-slate-500">{pick('0 = nikdy', '0 = never')}</span>
          </div>

          {/* Games limit slider (0–10) */}
          <div className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {pick('Počet odehraných her', 'Completed games limit')}
                </span>
                <p className="text-[11px] text-slate-500">
                  {effectiveGamesLimit === 0
                    ? pick(
                        'Vypnuto — po dokončení her se okno neotevře',
                        'Off — break will not trigger after games'
                      )
                    : pick(
                        `Otevře se po každých ${formatGamesBadge(effectiveGamesLimit)}`,
                        `Triggers after every ${formatGamesBadge(effectiveGamesLimit)}`
                      )}
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
                aria-label={pick('Snížit počet her', 'Decrease games limit')}
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
                aria-label={pick('Limit počtu her (0 až 10)', 'Games limit (0 to 10)')}
                className="flex-1 h-2.5 accent-indigo-600 cursor-pointer touch-pan-x"
              />
              <button
                type="button"
                onClick={() => setGamesLimitValue(effectiveGamesLimit + 1)}
                disabled={effectiveGamesLimit >= 10}
                aria-label={pick('Zvýšit počet her', 'Increase games limit')}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-35 text-slate-700 flex items-center justify-center shrink-0 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-10">
              <span>{pick('0 (Nikdy)', '0 (Never)')}</span>
              <span>5</span>
              <span>{pick('10 her', '10 games')}</span>
            </div>
          </div>

          {/* Minutes limit slider (0–10) */}
          <div className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {pick('Časový limit hraní', 'Play time limit')}
                </span>
                <p className="text-[11px] text-slate-500">
                  {effectiveMinutesLimit === 0
                    ? pick(
                        'Vypnuto — časový limit je neaktivní',
                        'Off — timer break is disabled'
                      )
                    : pick(
                        `Otevře se každých ${effectiveMinutesLimit} min hraní`,
                        `Triggers every ${effectiveMinutesLimit} min of play`
                      )}
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
                aria-label={pick('Snížit časový limit', 'Decrease time limit')}
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
                aria-label={pick('Časový limit v minutách (0 až 10)', 'Time limit in minutes (0 to 10)')}
                className="flex-1 h-2.5 accent-indigo-600 cursor-pointer touch-pan-x"
              />
              <button
                type="button"
                onClick={() => setMinutesLimitValue(effectiveMinutesLimit + 1)}
                disabled={effectiveMinutesLimit >= 10}
                aria-label={pick('Zvýšit časový limit', 'Increase time limit')}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-35 text-slate-700 flex items-center justify-center shrink-0 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-10">
              <span>{pick('0 (Nikdy)', '0 (Never)')}</span>
              <span>5 min</span>
              <span>10 min</span>
            </div>
          </div>

          {noTriggerSelected && (
            <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              {pick(
                'Oba posuvníky jsou na 0 (Nikdy) — nastavte alespoň 1 hru nebo 1 minutu, aby se přestávka spouštěla.',
                'Both sliders are set to 0 (Never) — set at least 1 game or 1 minute for breaks to trigger.'
              )}
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
                  {pick('Počet otázek pro pokračování', 'Questions required to continue')}
                </span>
                <p className="text-[11px] text-slate-500">
                  {pick(
                    'Kolik otázek musí hráč správně vyřešit, aby mohl hrát dál',
                    'How many questions must be solved correctly to resume playing'
                  )}
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
                aria-label={pick('Snížit počet otázek pro pokračování', 'Decrease questions count')}
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
                aria-label={pick('Počet otázek pro pokračování (1 až 10)', 'Questions per break (1 to 10)')}
                className="flex-1 h-2.5 accent-indigo-600 cursor-pointer touch-pan-x"
              />
              <button
                type="button"
                onClick={() => setTasksPerBreakValue(effectiveTasksPerBreak + 1)}
                disabled={effectiveTasksPerBreak >= 10}
                aria-label={pick('Zvýšit počet otázek pro pokračování', 'Increase questions count')}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-35 text-slate-700 flex items-center justify-center shrink-0 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-10">
              <span>{pick('1 otázka', '1 question')}</span>
              <span>5</span>
              <span>{pick('10 otázek', '10 questions')}</span>
            </div>
          </div>

          {/* Random rotation switch */}
          <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer">
            <div className="flex items-start gap-2">
              <Shuffle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  {pick('Náhodné střídání otázek', 'Randomize question order')}
                </p>
                <p className="text-[11px] text-slate-500">
                  {draft.randomOrder
                    ? pick(
                        'Otázky se losují náhodně bez opakování, dokud se neprostřídají všechny',
                        'Questions are shuffled without repeats until all have been shown'
                      )
                    : pick(
                        'Otázky se zobrazují postupně v pořadí ze zadání',
                        'Questions appear sequentially in their original order'
                      )}
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
              {pick('Odehráno:', 'Played:')}{' '}
              <strong className="text-slate-800">
                {progress.gamesSinceLastGate}
              </strong>
              {effectiveGamesLimit > 0 ? `/${effectiveGamesLimit}` : ''}
              {' · '}
              {pick('Čas:', 'Time:')}{' '}
              <strong className="text-slate-800">
                {formatTime(progress.secondsSinceLastGate)}
              </strong>
              {effectiveMinutesLimit > 0 ? `/${effectiveMinutesLimit}:00` : ''}
            </span>
            <button
              type="button"
              onClick={onResetProgress}
              title={pick('Vynulovat aktuální počítadlo her a času', 'Reset current game & time counters')}
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
              <span>
                {pick(
                  `Předchozí sady úkolů (${taskHistory.length})`,
                  `Saved task sets (${taskHistory.length})`
                )}
              </span>
            </span>
            <span className="text-[11px] text-slate-500">
              {pick('Uloženo v sessionStorage', 'Stored in sessionStorage')}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-0.5">
            {taskHistory.map((entry) => {
              const isSelected = entry.json.trim() === normalizedDraftJson;
              const isDefault = entry.id === 'default_english_v1';
              const displayName =
                isDefault && isEn ? 'Default CZ-EN Vocabulary (12 tasks)' : entry.name;
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
                    <p className="text-xs font-bold truncate">{displayName}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {entry.taskCount} {pick('úkolů', 'tasks')} · {entry.typesSummary}
                    </p>
                  </button>

                  {isSelected && (
                    <span className="text-[10px] font-bold text-indigo-700 shrink-0">
                      {pick('Vybráno', 'Selected')}
                    </span>
                  )}

                  {!isDefault && (
                    <button
                      type="button"
                      onClick={() => onDeleteHistory(entry.id)}
                      title={pick('Odebrat sadu z historie', 'Remove set from history')}
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

        {/* Generate Tasks Directly with Gemini */}
        <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-sky-50 border border-indigo-200/90 shadow-2xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {pick('Vygenerovat úkoly pomocí Gemini', 'Generate Tasks with Gemini')}
                </span>
              </span>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {pick(
                  'Stačí zadat oblast otázek — Gemini vytvoří kompletní sadu (spojování, doplňování i výběr) a rovnou ji nahraje do hry.',
                  'Just enter a topic — Gemini creates a complete set (match, fill, and choice) and loads it straight into the game.'
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={geminiTopic}
              onChange={(e) => {
                setGeminiTopic(e.target.value);
                if (geminiFeedback?.type === 'error') setGeminiFeedback(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleGenerateWithGemini();
                }
              }}
              disabled={isGeneratingGemini}
              placeholder={pick(
                'Zadejte oblast (např. Angličtina 4. třída – jídlo, Násobilka, Evropa…)',
                'Enter topic (e.g. Grade 4 English – food, Multiplication, Europe…)'
              )}
              className="flex-1 min-h-[40px] px-3 py-2 rounded-xl border border-indigo-200 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            />
            <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0">
              <div className="flex items-center gap-1">
                {[6, 12, 20].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    disabled={isGeneratingGemini}
                    onClick={() => setGeminiCount(cnt)}
                    title={pick(`${cnt} úkolů`, `${cnt} tasks`)}
                    className={`px-2 py-2 rounded-xl text-[11px] font-bold border transition-colors ${
                      geminiCount === cnt
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-indigo-200 text-indigo-800 hover:bg-indigo-50'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={isGeneratingGemini}
                onClick={() => void handleGenerateWithGemini()}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs transition-colors active:scale-95"
              >
                {isGeneratingGemini ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{pick('Generuji…', 'Generating…')}</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>{pick('Vygenerovat', 'Generate')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {geminiFeedback && (
            <div
              className={`px-3 py-2 rounded-xl border text-[11px] font-semibold flex items-center justify-between gap-2 ${
                geminiFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <span className="flex items-start gap-1.5">
                {geminiFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{geminiFeedback.message}</span>
              </span>
              {geminiFeedback.type === 'success' && geminiFeedback.tasks && (
                <button
                  type="button"
                  onClick={() =>
                    onPreviewTasks(
                      geminiFeedback.tasks!,
                      effectiveTasksPerBreak,
                      draft.randomOrder
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 shrink-0"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{pick('Vyzkoušet', 'Preview')}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Import JSON Tasks from Phone (File / Folder) or Web URL */}
        <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-indigo-50/55 border border-indigo-200/70">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                {pick('Načíst úkoly z telefonu nebo z webu', 'Load tasks from device or web')}
              </span>
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
              <span>{pick('Soubor(y) JSON', 'JSON File(s)')}</span>
            </button>
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="px-3 py-2 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 active:bg-indigo-100 text-indigo-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>{pick('Složka v telefonu', 'Device Folder')}</span>
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
                placeholder={pick(
                  'https://ithonza.cz/games/ukoly.json nebo ./ukoly.json',
                  'https://example.com/tasks.json or ./tasks.json'
                )}
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
              <span>{pick('Načíst', 'Load')}</span>
            </button>
          </div>

          {/* Optional Web Catalog Picker */}
          {webCatalog.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1 border-t border-indigo-200/70">
              <p className="text-[11px] font-bold text-indigo-900">
                {pick(
                  `Vyberte sadu z webového katalogu (${webCatalog.length}):`,
                  `Choose a set from web catalog (${webCatalog.length}):`
                )}
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
                      {item.taskCount
                        ? `${item.taskCount} ${pick('úkolů', 'tasks')}`
                        : pick('Stáhnout', 'Download')}
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
              <span>{pick('Zadání úkolů (JSON)', 'Task Definition (JSON)')}</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setShowPromptBuilder((prev) => !prev);
                  setPromptCopied(false);
                }}
                className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-colors ${
                  showPromptBuilder
                    ? 'border-indigo-500 bg-indigo-600 text-white'
                    : 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800'
                }`}
              >
                <MessageSquareText className="w-3 h-3" />
                <span>{pick('Připravit prvotní prompt', 'Prepare prompt')}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSchemaHelp((prev) => !prev)}
                className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700"
              >
                {showSchemaHelp
                  ? pick('Skrýt nápovědu JSON', 'Hide JSON format')
                  : pick('Ukázka formátu', 'Format example')}
              </button>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    customJson: isEn ? DEFAULT_EN_QUIZ_TASKS_JSON : DEFAULT_ENGLISH_TASKS_JSON,
                  }))
                }
                className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-indigo-700"
              >
                {pick('Výchozí angličtina', 'Sample Quiz (EN)')}
              </button>
            </div>
          </div>

          {/* Initial Prompt Builder Panel */}
          {showPromptBuilder && (
            <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-xs font-extrabold text-indigo-950">
                    {pick('Prvotní prompt pro vygenerování JSON úkolů', 'Initial prompt for generating JSON tasks')}
                  </p>
                  <p className="text-[11px] text-indigo-700">
                    {pick(
                      'Zadejte oblast otázek (vloží se na konec promptu), zkopírujte prompt a výsledek vložte dolů do JSON pole.',
                      'Enter the question topic (placed at the end of the prompt), copy it, and paste the resulting JSON below.'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={promptTopic}
                  onChange={(e) => {
                    setPromptTopic(e.target.value);
                    if (promptCopied) setPromptCopied(false);
                  }}
                  placeholder={pick(
                    'Oblast otázek (např. Angličtina 4. třída – jídlo, Násobilka, Evropa…)',
                    'Topic / subject area (e.g. Grade 4 English – food, Multiplication, Europe…)'
                  )}
                  className="flex-1 px-3 py-2 rounded-xl border border-indigo-200 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[11px] font-semibold text-indigo-800 mr-0.5">
                    {pick('Počet:', 'Count:')}
                  </span>
                  {[6, 12, 20].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => {
                        setPromptCount(cnt);
                        if (promptCopied) setPromptCopied(false);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                        promptCount === cnt
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-indigo-200 text-indigo-800 hover:bg-indigo-100'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                readOnly
                value={generatedPrompt}
                rows={7}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full p-2.5 rounded-xl border border-indigo-200 bg-white font-mono text-[10.5px] text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-indigo-700 font-medium">
                  {promptTopic.trim()
                    ? pick('Oblast je doplněná na konci promptu.', 'Topic is filled in at the end of the prompt.')
                    : pick('Můžete doplnit oblast teď, nebo až po vložení na konec promptu.', 'Fill in the topic now or at the end after pasting.')}
                </span>
                <button
                  type="button"
                  onClick={() => void handleCopyPrompt()}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors active:scale-95 ${
                    promptCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {promptCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{pick('Zkopírováno!', 'Copied!')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{pick('Kopírovat prompt', 'Copy prompt')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {showSchemaHelp && (
            <pre className="p-2.5 rounded-xl bg-slate-900 text-slate-100 text-[10px] font-mono overflow-x-auto leading-relaxed">
              {isEn
                ? `[
  {
    "type": "match",
    "prompt": "Match countries and capitals",
    "pairs": [
      { "left": "France", "right": "Paris" },
      { "left": "Japan", "right": "Tokyo" }
    ]
  },
  {
    "type": "fill",
    "prompt": "Fill in the result: 6 × 7 = ____",
    "answer": "42",
    "hint": "Between 40 and 45"
  },
  {
    "type": "choice",
    "prompt": "Which planet is the Red Planet?",
    "options": ["Venus", "Mars", "Saturn"],
    "correctIndex": 1
  }
]

// Optional remote catalog of multiple sets:
// { "sets": [{ "name": "Lesson 1", "url": "./lesson1.json" }] }`
                : `[
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
              placeholder={pick(
                'Název sady pro historii (volitelné, např. Slovíčka lekce 4)',
                'Set name for history (optional, e.g. Lesson 4 Quiz)'
              )}
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              disabled={!jsonValidation.ok}
              onClick={() => {
                if (!jsonValidation.ok) return;
                onSaveToHistory(draft.customJson, setName.trim() || undefined);
              }}
              title={pick(
                'Uložit aktuální JSON sadu do historie v sessionStorage',
                'Save current JSON set to sessionStorage history'
              )}
              className="px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-45 text-indigo-800 text-[11px] font-bold flex items-center gap-1 shrink-0"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>{pick('Do historie', 'Save set')}</span>
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
            placeholder={pick('Vložte JSON pole úkolů...', 'Paste a JSON array of tasks...')}
          />

          {/* Live Validation Status */}
          {jsonValidation.ok ? (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {pick(
                    `Platný JSON · Načteno ${jsonValidation.tasks.length} úkolů`,
                    `Valid JSON · ${jsonValidation.tasks.length} tasks loaded`
                  )}
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
                <span>{pick('Vyzkoušet', 'Preview')}</span>
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

        {/* App Version & Check for Updates Card */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-bold text-indigo-950">
                  {pick('Verze aplikace', 'App Version')}
                </p>
                <span className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-[11px] font-mono font-bold text-indigo-800">
                  v{APP_VERSION}
                </span>
                {APP_BUILD_DATE && (
                  <span className="text-[11px] text-indigo-600/80 font-mono">
                    ({APP_BUILD_DATE})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                {pick(
                  'Zkontrolujte, zda je k dispozici novější verze aplikace.',
                  'Check whether a newer version of the app is available.'
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCheckUpdates}
              disabled={isCheckingUpdate}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold whitespace-nowrap shadow-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors active:scale-95"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`}
              />
              <span>
                {isCheckingUpdate
                  ? pick('Kontroluji…', 'Checking…')
                  : pick('Zkontrolovat aktualizace', 'Check for updates')}
              </span>
            </button>
          </div>

          {updateResult && (
            <div
              className={`px-3 py-2 rounded-xl text-[11px] font-semibold flex items-center justify-between gap-2 ${
                updateResult === 'updated' || updateResult === 'up-to-date'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : updateResult === 'no-sw'
                  ? 'bg-white border border-indigo-200 text-indigo-900'
                  : 'bg-amber-50 border border-amber-200 text-amber-900'
              }`}
            >
              <span>
                {updateResult === 'updated'
                  ? pick(
                      'Nalezena nová verze! Aplikace se právě aktualizuje…',
                      'New version found! Updating the app now…'
                    )
                  : updateResult === 'up-to-date'
                  ? pick(
                      `Máte nejnovější dostupnou verzi (v${APP_VERSION}).`,
                      `You already have the latest version (v${APP_VERSION}).`
                    )
                  : updateResult === 'no-sw'
                  ? pick(
                      `Aktuální verze: v${APP_VERSION}. Pro jistotu můžete aplikaci ručně obnovit.`,
                      `Current version: v${APP_VERSION}. You can reload manually to refresh.`
                    )
                  : updateResult === 'offline'
                  ? pick(
                      'Jste offline — pro kontrolu aktualizací se připojte k internetu.',
                      'You are offline — connect to the internet to check for updates.'
                    )
                  : pick(
                      'Kontrolu aktualizací se nepodařilo dokončit. Zkuste to prosím znovu.',
                      'Could not check for updates. Please try again.'
                    )}
              </span>
              {(updateResult === 'up-to-date' || updateResult === 'no-sw') && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold shrink-0"
                >
                  {pick('Obnovit', 'Reload')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold"
          >
            {pick('Zrušit', 'Cancel')}
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSaveClick}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-45 text-white text-xs font-bold shadow-xs"
          >
            {pick('Uložit nastavení', 'Save settings')}
          </button>
        </div>
      </div>
    </div>
  );
};
