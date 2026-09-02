'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ChevronDown,
  Square,
  Columns2,
  Rows2,
  Grid2X2,
  Activity,
  Cloud,
  Check,
  Volume2,
  VolumeX,
  Keyboard,
  Settings,
  Layers,
  Search,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  FolderKanban,
  Award,
} from 'lucide-react';
import { useChartStore } from '@/store/chart-store';
import { useReplayStore } from '@/store/replay-store';
import { useSessionStore } from '@/store/session-store';
import { useTradingStore } from '@/store/trading-store';
import { useIndicatorStore } from '@/store/indicator-store';
import { useUIStore } from '@/store/ui-store';
import { soundEngine } from '@/lib/audio/sound-engine';
import { syncService } from '@/lib/sync/sync-service';
import { ReplayControls } from '@/features/replay/ReplayControls';
import { TIMEFRAMES } from '@/config/constants';
import { marketDataService } from '@/lib/market-data/market-data-service';
import { SymbolSelectorModal } from '@/components/modals/SymbolSelectorModal';
import { ImportDataModal } from '@/components/modals/ImportDataModal';
import { SessionManagerModal } from '@/components/modals/SessionManagerModal';
import { IndicatorsModal } from '@/components/modals/IndicatorsModal';
import { KeyboardShortcutsModal } from '@/components/modals/KeyboardShortcutsModal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Timeframe, Symbol } from '@/types/market-data';

export function TopBar() {
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [currentSymbolObj, setCurrentSymbolObj] = useState<Symbol | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'saving' | 'synced'>('idle');
  const [isMuted, setIsMuted] = useState(false);

  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const activeTimeframe = useChartStore((s) => s.activeTimeframe);
  const setActiveTimeframe = useChartStore((s) => s.setActiveTimeframe);
  const layout = useChartStore((s) => s.layout);
  const setLayout = useChartStore((s) => s.setLayout);
  const drawings = useChartStore((s) => s.drawings);

  const currentSession = useSessionStore((s) => s.currentSession);
  const saveCurrentSessionSnapshot = useSessionStore((s) => s.saveCurrentSessionSnapshot);
  const activeIndicators = useIndicatorStore((s) => s.activeIndicators);

  const closedTrades = useTradingStore((s) => s.closedTrades);

  const allCandles = useReplayStore((s) => s.allCandles);
  const currentIndex = useReplayStore((s) => s.currentIndex);
  const preloadCount = useReplayStore((s) => s.preloadCount);

  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setChartSettingsOpen = useUIStore((s) => s.setChartSettingsOpen);
  const setObjectTreeOpen = useUIStore((s) => s.setObjectTreeOpen);
  const setPropFirmModalOpen = useUIStore((s) => s.setPropFirmModalOpen);
  const isFullscreen = useUIStore((s) => s.isFullscreen);
  const toggleFullscreen = useUIStore((s) => s.toggleFullscreen);

  useEffect(() => {
    marketDataService.getSymbol(activeSymbol).then(setCurrentSymbolObj);
    setIsMuted(soundEngine.isMuted());
  }, [activeSymbol]);

  const visibleEnd = preloadCount + currentIndex;
  const currentCandle = allCandles[visibleEnd] ?? null;
  const currentTs = currentCandle ? currentCandle.timestamp : Date.now();

  const handleQuickCloudSync = async () => {
    if (!currentSession) return;
    setCloudStatus('saving');
    saveCurrentSessionSnapshot(currentTs, currentIndex);
    await syncService.saveToCloud(currentSession, closedTrades, drawings, activeIndicators);
    setCloudStatus('synced');
    setTimeout(() => setCloudStatus('idle'), 2500);
  };

  const handleToggleSound = () => {
    const next = soundEngine.toggleMute();
    setIsMuted(next);
  };

  return (
    <>
      <header className="h-full w-full bg-[#0a0e17] border-b border-[#182338] text-gray-300 text-xs px-3 flex items-center justify-between font-sans select-none overflow-x-auto">
        {/* =========================================================================
            LEFT ZONE: Logo, Workspace, Symbol, Timeframes
        ========================================================================= */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2 mr-1 text-white font-bold tracking-tight">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent hidden xl:inline">
              TradeForge
            </span>
          </div>

          {/* Workspace / Backtest Session Pill */}
          <button
            onClick={() => setIsSessionModalOpen(true)}
            className="flex items-center space-x-1.5 px-2 py-1 bg-[#101726] hover:bg-[#182338] border border-[#1b253c] hover:border-blue-500/40 rounded-lg text-gray-300 hover:text-white transition cursor-pointer"
            title="Manage Backtest Sessions"
          >
            <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium font-mono text-[11px] max-w-[130px] truncate hidden md:inline">
              {currentSession ? currentSession.name : 'Default Session'}
            </span>
          </button>

          {/* Symbol Selector Pill */}
          <button
            onClick={() => setIsSymbolModalOpen(true)}
            className="flex items-center space-x-2 px-2.5 py-1 bg-[#151c2d] hover:bg-[#1c263c] border border-[#232f48] rounded-lg font-medium text-white transition shadow-xs group cursor-pointer"
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                currentSymbolObj?.assetClass === 'futures'
                  ? 'bg-amber-400'
                  : currentSymbolObj?.assetClass === 'forex'
                  ? 'bg-emerald-400'
                  : currentSymbolObj?.assetClass === 'crypto'
                  ? 'bg-purple-400'
                  : 'bg-blue-400'
              )}
            />
            <span className="font-bold font-mono text-xs">{activeSymbol}</span>
            <span className="text-gray-400 text-[11px] font-mono hidden 2xl:inline">
              {currentSymbolObj?.displayName || activeSymbol}
            </span>
            {currentSymbolObj?.assetClass === 'futures' && (
              <span className="bg-amber-500/20 text-amber-300 text-[9px] font-mono px-1 py-0.2 rounded hidden sm:inline">
                ${currentSymbolObj.tickValue}/t
              </span>
            )}
            <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-white transition" />
          </button>

          {/* Timeframe Selector Row */}
          <div className="flex items-center space-x-0.5 bg-[#101726] p-0.5 rounded-lg border border-[#1b253c]">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf as Timeframe)}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[11px] font-mono font-medium transition cursor-pointer',
                  activeTimeframe === tf
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1c263c]'
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* =========================================================================
            MIDDLE ZONE: Indicators, Chart Settings, Layout Grid, Object Tree
        ========================================================================= */}
        <div className="flex items-center space-x-1.5 flex-shrink-0 mx-2">
          {/* Indicators Modal Trigger */}
          <Tooltip>
            <TooltipTrigger
              onClick={() => setIsIndicatorsModalOpen(true)}
              className="flex items-center space-x-1 px-2 py-1 bg-[#101726] hover:bg-[#182338] border border-[#1b253c] hover:border-blue-500/40 rounded-lg text-gray-300 hover:text-white transition cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium hidden lg:inline">Indicators</span>
              <span className="bg-blue-600/30 text-blue-300 text-[10px] font-mono px-1 py-0.2 rounded font-bold">
                {activeIndicators.length}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-[#121828] border-[#1f2a40] text-gray-200 font-mono text-xs">
              <p>Technical Indicator Overlays (I)</p>
            </TooltipContent>
          </Tooltip>

          {/* Chart Settings Trigger */}
          <Tooltip>
            <TooltipTrigger
              onClick={() => setChartSettingsOpen(true)}
              className="p-1.5 bg-[#101726] hover:bg-[#182338] border border-[#1b253c] hover:border-blue-500/40 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-[#121828] border-[#1f2a40] text-gray-200 font-mono text-xs">
              <p>Chart &amp; Collision Settings</p>
            </TooltipContent>
          </Tooltip>

          {/* Object Tree Trigger */}
          <Tooltip>
            <TooltipTrigger
              onClick={() => setObjectTreeOpen(true)}
              className="p-1.5 bg-[#101726] hover:bg-[#182338] border border-[#1b253c] hover:border-blue-500/40 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-[#121828] border-[#1f2a40] text-gray-200 font-mono text-xs">
              <p>Object Tree &amp; Layers</p>
            </TooltipContent>
          </Tooltip>

          {/* Prop Firm Tracker Trigger */}
          <Tooltip>
            <TooltipTrigger
              onClick={() => setPropFirmModalOpen(true)}
              className="p-1.5 bg-[#101726] hover:bg-[#182338] border border-[#1b253c] hover:border-amber-500/40 rounded-lg text-amber-400 hover:text-amber-300 transition cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-[#121828] border-[#1f2a40] text-gray-200 font-mono text-xs">
              <p>Prop Firm Challenge Tracker</p>
            </TooltipContent>
          </Tooltip>

          {/* Layout Grid Switcher (1x1, 1x2, 2x1, 2x2) */}
          <div className="hidden sm:flex items-center space-x-0.5 bg-[#101726] p-0.5 rounded-lg border border-[#1b253c]">
            <button
              onClick={() => setLayout('1x1')}
              title="Single Chart (1x1)"
              className={cn(
                'p-1 rounded transition cursor-pointer',
                layout === '1x1' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-400 hover:text-gray-200'
              )}
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              onClick={() => setLayout('1x2')}
              title="2 Charts Horizontal Split (1x2)"
              className={cn(
                'p-1 rounded transition cursor-pointer',
                layout === '1x2' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-400 hover:text-gray-200'
              )}
            >
              <Columns2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => setLayout('2x1')}
              title="2 Charts Vertical Split (2x1)"
              className={cn(
                'p-1 rounded transition cursor-pointer',
                layout === '2x1' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-400 hover:text-gray-200'
              )}
            >
              <Rows2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => setLayout('2x2')}
              title="4 Charts Quad Grid (2x2)"
              className={cn(
                'p-1 rounded transition cursor-pointer',
                layout === '2x2' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-400 hover:text-gray-200'
              )}
            >
              <Grid2X2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            RIGHT ZONE: Replay Controls, Save, Audio, Hotkeys, Fullscreen, Command Palette
        ========================================================================= */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Replay Controls (Integrated Center-Right) */}
          <ReplayControls />

          {/* Cloud Save Snapshot Button */}
          <button
            onClick={handleQuickCloudSync}
            title="Save Snapshot &amp; Sync Cloud (Cmd+S)"
            className="flex items-center space-x-1 px-2 py-1 bg-[#101726] hover:bg-[#18233c] border border-[#1b253a] hover:border-cyan-500/40 rounded-lg text-[10px] font-mono transition cursor-pointer"
          >
            {cloudStatus === 'saving' ? (
              <span className="text-amber-400 font-bold animate-pulse">Syncing...</span>
            ) : cloudStatus === 'synced' ? (
              <span className="text-emerald-400 font-bold flex items-center space-x-0.5">
                <Check className="w-3 h-3" />
                <span>Saved</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-cyan-400 font-semibold">
                <Cloud className="w-3 h-3" />
                <span>Save</span>
              </span>
            )}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={isMuted ? 'Unmute Trading Sounds' : 'Mute Trading Sounds'}
            className={cn(
              'p-1.5 rounded-lg border transition cursor-pointer',
              isMuted
                ? 'bg-[#151c2d] border-[#1d273d] text-gray-500'
                : 'bg-[#151c2d] border-[#1d273d] text-blue-400 hover:text-white'
            )}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Command Palette Trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            title="Command Palette (Cmd+K)"
            className="p-1.5 rounded-lg bg-[#151c2d] hover:bg-[#1d273d] border border-[#1d273d] text-gray-400 hover:text-white transition cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen Chart (F)'}
            className="p-1.5 rounded-lg bg-[#151c2d] hover:bg-[#1d273d] border border-[#1d273d] text-gray-400 hover:text-white transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Keyboard Shortcuts Help */}
          <button
            onClick={() => setIsShortcutsModalOpen(true)}
            title="Keyboard Shortcuts Cheat Sheet (?)"
            className="p-1.5 rounded-lg bg-[#151c2d] hover:bg-[#1d273d] border border-[#1d273d] text-gray-400 hover:text-white transition cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Modals */}
      <SymbolSelectorModal
        isOpen={isSymbolModalOpen}
        onClose={() => setIsSymbolModalOpen(false)}
      />
      <ImportDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
      <SessionManagerModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
      />
      <IndicatorsModal
        isOpen={isIndicatorsModalOpen}
        onClose={() => setIsIndicatorsModalOpen(false)}
      />
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </>
  );
}
