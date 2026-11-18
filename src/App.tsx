import { useState } from 'react';
import { Header, GameTab } from './components/Header';
import { SudokuGame } from './components/SudokuGame';
import { TangoGame } from './components/TangoGame';
import { QueensGame } from './components/QueensGame';
import { MinibridgeGame } from './components/MinibridgeGame';
import { MahjongGame } from './components/MahjongGame';
import { ZipGame } from './components/ZipGame';
import { sound } from './utils/audio';

const ACTIVE_TAB_KEY = 'logic_games_active_tab_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<GameTab>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_TAB_KEY);
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

  const handleTabChange = (tab: GameTab) => {
    setActiveTab(tab);
    try {
      localStorage.setItem(ACTIVE_TAB_KEY, tab);
    } catch {
      // ignore
    }
  };

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const isWideTab = activeTab === 'minibridge' || activeTab === 'mahjong';

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col items-center justify-start p-2 sm:p-4 select-none">
      {/* Adaptive container: compact portrait for grid puzzles, spacious table for Minibridge & Mahjong */}
      <main
        className={`w-full ${
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
        />

        {/* Tab 1: Mini Sudoku 6x6 */}
        {activeTab === 'sudoku' && (
          <SudokuGame
            realTimeCheck={realTimeCheck}
            onToggleRealTimeCheck={() => setRealTimeCheck((prev) => !prev)}
            isMuted={isMuted}
            onToggleSound={handleToggleSound}
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
          />
        )}

        {/* Tab 3: LinkedIn Queens (6x6..10x10) */}
        {activeTab === 'queens' && (
          <QueensGame
            realTimeCheck={realTimeCheck}
            onToggleRealTimeCheck={() => setRealTimeCheck((prev) => !prev)}
            isMuted={isMuted}
            onToggleSound={handleToggleSound}
          />
        )}

        {/* Tab 4: Minibridge */}
        {activeTab === 'minibridge' && (
          <MinibridgeGame realTimeCheck={realTimeCheck} />
        )}

        {/* Tab 5: Mahjong */}
        {activeTab === 'mahjong' && (
          <MahjongGame realTimeCheck={realTimeCheck} />
        )}

        {/* Tab 6: Zip */}
        {activeTab === 'zip' && (
          <ZipGame realTimeCheck={realTimeCheck} />
        )}
      </main>
    </div>
  );
}
