import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Header, GameTab } from './components/Header';
import { SudokuGame } from './components/SudokuGame';
import { TangoGame } from './components/TangoGame';
import { QueensGame } from './components/QueensGame';
import { MinibridgeGame } from './components/MinibridgeGame';
import { MahjongGame } from './components/MahjongGame';
import { ZipGame } from './components/ZipGame';
import { SettingsModal } from './components/SettingsModal';
import { LearningGateModal } from './components/LearningGateModal';
import { HelpModal } from './components/HelpModal';
import {
  LearningGateProgress,
  LearningGateSettings,
  LearningTask,
  LearningTaskHistoryEntry,
} from './types/learningGate';
import {
  buildTaskHistoryEntry,
  getActiveLearningTasks,
  selectTasksForBreak,
} from './utils/learningTasks';
import {
  deleteLearningTaskFromHistory,
  loadLearningGateProgress,
  loadLearningGateSettings,
  loadLearningTaskHistory,
  saveLearningGateProgress,
  saveLearningGateSettings,
  saveLearningTaskToHistory,
} from './utils/storage';
import { sound } from './utils/audio';

const ACTIVE_TAB_KEY = 'logic_games_active_tab_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<GameTab>(() => {
    try {
      const saved = sessionStorage.getItem(ACTIVE_TAB_KEY);
      if (
        saved === 'sudoku' ||
        saved === 'tango' ||
        saved === 'queens' ||
        saved === 'minibridge' ||
        saved === 'mahjong' ||
        saved === 'zip'
      ) {
        return saved as GameTab;
      }
    } catch {
      // ignore
    }
    return 'sudoku';
  });

  const [realTimeCheck, setRealTimeCheck] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());

  // Learning Gate Settings & Progress
  const [gateSettings, setGateSettings] = useState<LearningGateSettings>(() =>
    loadLearningGateSettings()
  );
  const [gateProgress, setGateProgress] = useState<LearningGateProgress>(() =>
    loadLearningGateProgress()
  );
  const [taskHistory, setTaskHistory] = useState<LearningTaskHistoryEntry[]>(() =>
    loadLearningTaskHistory()
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isGateOpen, setIsGateOpen] = useState<boolean>(() => {
    const s = loadLearningGateSettings();
    const p = loadLearningGateProgress();
    return s.enabled && p.gatePending;
  });
  const [gateTriggerReason, setGateTriggerReason] = useState<'games' | 'minutes' | 'preview'>('games');
  const [previewTasks, setPreviewTasks] = useState<LearningTask[] | null>(null);

  const gateOpenDelayRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (gateOpenDelayRef.current !== null) {
        window.clearTimeout(gateOpenDelayRef.current);
      }
    };
  }, []);

  // Persist gate settings & progress
  useEffect(() => {
    saveLearningGateSettings(gateSettings);
  }, [gateSettings]);

  useEffect(() => {
    saveLearningGateProgress(gateProgress);
  }, [gateProgress]);

  // Minute-based trigger timer
  useEffect(() => {
    if (
      !gateSettings.enabled ||
      !gateSettings.triggerByMinutes ||
      isGateOpen ||
      isSettingsOpen ||
      isHelpOpen ||
      previewTasks !== null
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

      setGateProgress((prev) => {
        if (prev.gatePending) return prev;
        const nextSeconds = prev.secondsSinceLastGate + 1;
        if (nextSeconds >= gateSettings.minutesLimit * 60) {
          setGateTriggerReason('minutes');
          setIsGateOpen(true);
          return {
            ...prev,
            secondsSinceLastGate: nextSeconds,
            gatePending: true,
          };
        }
        return {
          ...prev,
          secondsSinceLastGate: nextSeconds,
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [
    gateSettings.enabled,
    gateSettings.triggerByMinutes,
    gateSettings.minutesLimit,
    isGateOpen,
    isSettingsOpen,
    isHelpOpen,
    previewTasks,
  ]);

  const handleGameCompleted = useCallback(() => {
    if (!gateSettings.enabled) return;

    setGateProgress((prev) => {
      const nextGames = prev.gamesSinceLastGate + 1;
      const reachedGamesLimit =
        gateSettings.triggerByGames && nextGames >= gateSettings.gamesLimit;

      if (reachedGamesLimit) {
        setGateTriggerReason('games');
        if (gateOpenDelayRef.current !== null) {
          window.clearTimeout(gateOpenDelayRef.current);
        }
        // Brief delay so the player sees their game victory feedback first
        gateOpenDelayRef.current = window.setTimeout(() => {
          setIsGateOpen(true);
          gateOpenDelayRef.current = null;
        }, 900);

        return {
          ...prev,
          gamesSinceLastGate: nextGames,
          gatePending: true,
        };
      }

      return {
        ...prev,
        gamesSinceLastGate: nextGames,
      };
    });
  }, [gateSettings.enabled, gateSettings.triggerByGames, gateSettings.gamesLimit]);

  const activeTaskBank = useMemo(() => getActiveLearningTasks(gateSettings), [gateSettings]);

  const currentBreakTasks = useMemo(() => {
    if (previewTasks) return previewTasks;
    return selectTasksForBreak(activeTaskBank, gateProgress.taskCursor, gateSettings.tasksPerBreak);
  }, [previewTasks, activeTaskBank, gateProgress.taskCursor, gateSettings.tasksPerBreak]);

  const handleCompleteGate = () => {
    if (previewTasks) {
      setPreviewTasks(null);
      return;
    }
    setIsGateOpen(false);
    setGateProgress((prev) => ({
      gamesSinceLastGate: 0,
      secondsSinceLastGate: 0,
      gatePending: false,
      taskCursor: (prev.taskCursor + gateSettings.tasksPerBreak) % Math.max(1, activeTaskBank.length),
    }));
  };

  const handleSaveTaskToHistory = useCallback((rawJson: string, setName?: string) => {
    const entry = buildTaskHistoryEntry(rawJson, setName);
    if (!entry) return;
    setTaskHistory(saveLearningTaskToHistory(entry));
  }, []);

  const handleDeleteTaskHistory = useCallback((id: string) => {
    setTaskHistory(deleteLearningTaskFromHistory(id));
  }, []);

  const handleSaveSettings = (next: LearningGateSettings, setName?: string) => {
    setGateSettings(next);
    const entry = buildTaskHistoryEntry(next.customJson, setName);
    if (entry) {
      const alreadyExists = taskHistory.some(
        (h) => h.json.trim() === entry.json && (!setName || h.name === setName)
      );
      if (!alreadyExists) {
        setTaskHistory(saveLearningTaskToHistory(entry));
      }
    }
    if (!next.enabled) {
      setIsGateOpen(false);
      setGateProgress((prev) => ({ ...prev, gatePending: false }));
    }
  };

  const handleResetGateProgress = () => {
    setIsGateOpen(false);
    setGateProgress((prev) => ({
      ...prev,
      gamesSinceLastGate: 0,
      secondsSinceLastGate: 0,
      gatePending: false,
    }));
  };

  const handleTabChange = (tab: GameTab) => {
    setActiveTab(tab);
    try {
      sessionStorage.setItem(ACTIVE_TAB_KEY, tab);
    } catch {
      // ignore
    }
  };

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const isWideTab = activeTab === 'minibridge' || activeTab === 'mahjong';
  const isGlobalModalOpen =
    isGateOpen || previewTasks !== null || isSettingsOpen || isHelpOpen;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col items-center justify-start p-2 sm:p-4 select-none">
      {/* Adaptive container: compact portrait for grid puzzles, spacious table for Minibridge & Mahjong */}
      <main
        className={`relative z-0 isolate w-full ${
          isWideTab ? 'max-w-4xl' : 'max-w-md'
        } bg-white/95 sm:bg-white sm:rounded-3xl sm:shadow-lg sm:border sm:border-slate-200/80 p-3 sm:p-4 flex flex-col gap-2 min-h-[92vh] sm:min-h-0 justify-between transition-[max-width] duration-200`}
      >
        {/* Global Header with 6 Game Tabs and Utilities */}
        <Header
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
          realTimeCheck={realTimeCheck}
          onToggleRealTimeCheck={() => setRealTimeCheck((prev) => !prev)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
        />

        {/* Tab 1: Mini Sudoku 6x6 */}
        {activeTab === 'sudoku' && (
          <SudokuGame
            realTimeCheck={realTimeCheck}
            onToggleRealTimeCheck={() => setRealTimeCheck((prev) => !prev)}
            isMuted={isMuted}
            onToggleSound={handleToggleSound}
            onGameCompleted={handleGameCompleted}
            onSelectGame={handleTabChange}
            externalPaused={isGlobalModalOpen}
          />
        )}

        {/* Tab 2: LinkedIn Tango (6x6) */}
        {activeTab === 'tango' && (
          <TangoGame
            realTimeCheck={realTimeCheck}
            onToggleRealTimeCheck={() => setRealTimeCheck((prev) => !prev)}
            isMuted={isMuted}
            onToggleSound={handleToggleSound}
            onRulesClick={() => {}}
            onGameCompleted={handleGameCompleted}
            onSelectGame={handleTabChange}
            externalPaused={isGlobalModalOpen}
          />
        )}

        {/* Tab 3: LinkedIn Queens (6x6..10x10) */}
        {activeTab === 'queens' && (
          <QueensGame
            realTimeCheck={realTimeCheck}
            onToggleRealTimeCheck={() => setRealTimeCheck((prev) => !prev)}
            isMuted={isMuted}
            onToggleSound={handleToggleSound}
            onGameCompleted={handleGameCompleted}
            onSelectGame={handleTabChange}
            externalPaused={isGlobalModalOpen}
          />
        )}

        {/* Tab 4: Minibridge */}
        {activeTab === 'minibridge' && (
          <MinibridgeGame
            realTimeCheck={realTimeCheck}
            onGameCompleted={handleGameCompleted}
            onSelectGame={handleTabChange}
          />
        )}

        {/* Tab 5: Mahjong */}
        {activeTab === 'mahjong' && (
          <MahjongGame
            realTimeCheck={realTimeCheck}
            onGameCompleted={handleGameCompleted}
            onSelectGame={handleTabChange}
            externalPaused={isGlobalModalOpen}
          />
        )}

        {/* Tab 6: Zip */}
        {activeTab === 'zip' && (
          <ZipGame
            realTimeCheck={realTimeCheck}
            onGameCompleted={handleGameCompleted}
            onSelectGame={handleTabChange}
            externalPaused={isGlobalModalOpen}
          />
        )}
      </main>

      {/* Settings Modal (Game/Minute limits + History + JSON editor + Download) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={gateSettings}
        progress={gateProgress}
        taskHistory={taskHistory}
        onSave={handleSaveSettings}
        onSaveToHistory={handleSaveTaskToHistory}
        onDeleteHistory={handleDeleteTaskHistory}
        onResetProgress={handleResetGateProgress}
        onPreviewTasks={(tasks, count) => {
          setGateTriggerReason('preview');
          setPreviewTasks(
            selectTasksForBreak(tasks, gateProgress.taskCursor, count)
          );
        }}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Help & Teacher Mode Guide Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        activeTab={activeTab}
        onClose={() => setIsHelpOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Learning Break Modal */}
      <LearningGateModal
        isOpen={isGateOpen || previewTasks !== null}
        tasks={currentBreakTasks}
        triggerReason={previewTasks ? 'preview' : gateTriggerReason}
        isPreview={previewTasks !== null}
        onComplete={handleCompleteGate}
        onClosePreview={() => setPreviewTasks(null)}
      />
    </div>
  );
}
