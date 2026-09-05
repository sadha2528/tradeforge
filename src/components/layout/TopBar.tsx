'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  PanelRightClose,
  PanelRightOpen,
  PanelBottomClose,
  PanelBottomOpen,
  Edit,
  Plus,
  Play,
  LogOut,
  Info,
  Save,
  CheckCircle2,
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
import { formatCurrency } from '@/lib/utils/formatting';

import { SymbolSelectorModal } from '@/components/modals/SymbolSelectorModal';
import { ImportDataModal } from '@/components/modals/ImportDataModal';
import { SessionManagerModal } from '@/components/modals/SessionManagerModal';
import { IndicatorsModal } from '@/components/modals/IndicatorsModal';
import { KeyboardShortcutsModal } from '@/components/modals/KeyboardShortcutsModal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Timeframe, Symbol } from '@/types/market-data';

export function TopBar() {
  const router = useRouter();
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
  const [isSessionDetailsModalOpen, setIsSessionDetailsModalOpen] = useState(false);

  const [currentSymbolObj, setCurrentSymbolObj] = useState<Symbol | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'saving' | 'synced'>('idle');
  const [isMuted, setIsMuted] = useState(false);

  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const activeTimeframe = useChartStore((s) => s.activeTimeframe);
  const setActiveTimeframe = useChartStore((s) => s.setActiveTimeframe);
  const layout = useChartStore((s) => s.layout);
  const setLayout = useChartStore((s) => s.setLayout);
  const drawings = useChartStore((s) => s.drawings);
  const chartMode = useChartStore((s) => s.chartMode);
  const setChartMode = useChartStore((s) => s.setChartMode);

  const currentSession = useSessionStore((s) => s.currentSession);
  const saveCurrentSessionSnapshot = useSessionStore((s) => s.saveCurrentSessionSnapshot);
  const restartSession = useSessionStore((s) => s.restartSession);
  const activeIndicators = useIndicatorStore((s) => s.activeIndicators);

  const closedTrades = useTradingStore((s) => s.closedTrades);
  const resetAccount = useTradingStore((s) => s.resetAccount);

  const allCandles = useReplayStore((s) => s.allCandles);
  const currentIndex = useReplayStore((s) => s.currentIndex);
  const preloadCount = useReplayStore((s) => s.preloadCount);

  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setChartSettingsOpen = useUIStore((s) => s.setChartSettingsOpen);
  const setObjectTreeOpen = useUIStore((s) => s.setObjectTreeOpen);
  const setPropFirmModalOpen = useUIStore((s) => s.setPropFirmModalOpen);
  const isFullscreen = useUIStore((s) => s.isFullscreen);
  const toggleFullscreen = useUIStore((s) => s.toggleFullscreen);
  const showRightSidebar = useUIStore((s) => s.showRightSidebar);
  const toggleRightSidebar = useUIStore((s) => s.toggleRightSidebar);
  const showBottomPanel = useUIStore((s) => s.showBottomPanel);
  const toggleBottomPanel = useUIStore((s) => s.toggleBottomPanel);

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

  const handleConfirmRestart = () => {
    if (currentSession) {
      restartSession(currentSession.id);
      resetAccount();
      useReplayStore.getState().reset();
    }
    setIsRestartModalOpen(false);
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

          {/* Workspace / Backtest Session Pill with Interactive Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
              className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#101726] hover:bg-[#182338] border border-[#1b253c] hover:border-blue-500/50 rounded-lg text-gray-300 hover:text-white transition cursor-pointer"
              title="Session Menu"
            >
              <FolderKanban className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span className="font-medium font-mono text-[11px] max-w-[140px] truncate hidden md:inline">
                {currentSession ? currentSession.name : 'Default Session'}
              </span>
              {currentSession?.mode && (
                <span className="text-[9px] font-mono font-bold uppercase px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 hidden lg:inline">
                  {currentSession.mode}
                </span>
              )}
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {/* Session Dropdown Menu */}
            {isSessionDropdownOpen && (
              <div
                className="absolute left-0 top-full mt-1.5 w-64 bg-[#0e1422] border border-[#212f4a] rounded-xl shadow-2xl py-1.5 z-50 text-xs font-sans animate-in fade-in-50 zoom-in-95"
                onMouseLeave={() => setIsSessionDropdownOpen(false)}
              >
                {currentSession && (
                  <div className="px-3 py-2 border-b border-[#1a253a]">
                    <div className="font-bold text-white text-xs truncate">{currentSession.name}</div>
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-400 mt-0.5">
                      <span className="text-blue-400 font-bold">{currentSession.symbol}</span>
                      <span>•</span>
                      <span>{currentSession.timeframe}</span>
                      <span>•</span>
                      <span className="text-emerald-400">{formatCurrency(currentSession.startingBalance)}</span>
                    </div>
                  </div>
                )}

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsSessionDropdownOpen(false);
                      setIsSessionDetailsModalOpen(true);
                    }}
                    className="w-full px-3 py-1.5 text-left text-gray-300 hover:bg-[#162136] hover:text-white flex items-center space-x-2 transition cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    <span>Session Details</span>
                  </button>

                  {currentSession && (
                    <button
                      onClick={() => {
                        setIsSessionDropdownOpen(false);
                        router.push(`/session/new?edit=${currentSession.id}`);
                      }}
                      className="w-full px-3 py-1.5 text-left text-gray-300 hover:bg-[#162136] hover:text-white flex items-center space-x-2 transition cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5 text-purple-400" />
                      <span>Edit Session Settings</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsSessionDropdownOpen(false);
                      setIsRestartModalOpen(true);
                    }}
                    className="w-full px-3 py-1.5 text-left text-amber-300 hover:bg-amber-950/30 hover:text-amber-200 flex items-center space-x-2 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Restart Session</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsSessionDropdownOpen(false);
                      handleQuickCloudSync();
                    }}
                    className="w-full px-3 py-1.5 text-left text-gray-300 hover:bg-[#162136] hover:text-white flex items-center space-x-2 transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Save Session Snapshot</span>
                  </button>
                </div>

                <div className="border-t border-[#1a253a] py-1">
                  <button
                    onClick={() => {
                      setIsSessionDropdownOpen(false);
                      router.push('/session/new');
                    }}
                    className="w-full px-3 py-1.5 text-left text-gray-300 hover:bg-[#162136] hover:text-white flex items-center space-x-2 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-400" />
                    <span>+ Start New Session</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsSessionDropdownOpen(false);
                      router.push('/sessions');
                    }}
                    className="w-full px-3 py-1.5 text-left text-gray-300 hover:bg-[#162136] hover:text-white flex items-center space-x-2 transition cursor-pointer"
                  >
                    <FolderKanban className="w-3.5 h-3.5 text-gray-400" />
                    <span>All Sessions Dashboard</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsSessionDropdownOpen(false);
                      router.push('/sessions');
                    }}
                    className="w-full px-3 py-1.5 text-left text-gray-400 hover:bg-red-950/30 hover:text-red-300 flex items-center space-x-2 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>Exit Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>


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
          {/* Chart Engine Switcher: Replay vs TradingView Live */}
          <div className="flex items-center space-x-0.5 bg-[#101726] p-0.5 rounded-lg border border-[#1b253c] text-[11px] font-mono">
            <button
              onClick={() => setChartMode('replay')}
              title="Replay Engine Mode (Tick-accurate backtesting & zero lookahead)"
              className={cn(
                'px-2 py-0.5 rounded transition cursor-pointer font-bold',
                chartMode === 'replay' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-400 hover:text-gray-200'
              )}
            >
              Replay
            </button>
            <button
              onClick={() => setChartMode('tradingview')}
              title="TradingView Studio Mode (Official TradingView live charts with Pine Script & indicators)"
              className={cn(
                'px-2 py-0.5 rounded transition cursor-pointer font-bold',
                chartMode === 'tradingview' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-400 hover:text-gray-200'
              )}
            >
              TradingView
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

          {/* Panel Toggles (Bottom Panel & Right Sidebar) */}
          <button
            onClick={toggleBottomPanel}
            title={showBottomPanel ? 'Hide Bottom Workspace Panel' : 'Show Bottom Workspace Panel'}
            className={cn(
              'p-1.5 rounded-lg border transition cursor-pointer',
              showBottomPanel
                ? 'bg-[#151c2d] border-[#1d273d] text-blue-400 hover:text-white'
                : 'bg-[#101726] border-[#182338] text-gray-500 hover:text-gray-300'
            )}
          >
            {showBottomPanel ? <PanelBottomClose className="w-3.5 h-3.5" /> : <PanelBottomOpen className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={toggleRightSidebar}
            title={showRightSidebar ? 'Hide Right Order Panel (Maximize Chart)' : 'Show Right Order Panel'}
            className={cn(
              'p-1.5 rounded-lg border transition cursor-pointer',
              showRightSidebar
                ? 'bg-[#151c2d] border-[#1d273d] text-blue-400 hover:text-white'
                : 'bg-[#101726] border-[#182338] text-gray-500 hover:text-gray-300'
            )}
          >
            {showRightSidebar ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
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

      {/* Restart Session Confirmation Modal */}
      {isRestartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="bg-[#0e1422] border border-[#263552] rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
              <RotateCcw className="w-4 h-4" />
              <span>Restart Backtest Session?</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              All simulated trades, positions, and replay candle progress for this session will be reset back to the starting timestamp (
              {currentSession?.replayStartTime
                ? new Date(currentSession.replayStartTime).toUTCString().slice(0, 22)
                : 'Session Start'}
              ).
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1a253a]">
              <button
                onClick={() => setIsRestartModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-[#141d2e] hover:bg-[#1a253a] text-gray-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestart}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/30 cursor-pointer"
              >
                Confirm Restart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {isSessionDetailsModalOpen && currentSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#0e1422] border border-[#263552] rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="p-4 border-b border-[#1a253a] flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white font-bold text-sm">
                <FolderKanban className="w-4 h-4 text-blue-400" />
                <span>Session Specification</span>
              </div>
              <button
                onClick={() => setIsSessionDetailsModalOpen(false)}
                className="text-gray-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-white text-sm">{currentSession.name}</h4>
                {currentSession.strategyName && (
                  <div className="text-[11px] font-mono text-blue-400 mt-0.5">{currentSession.strategyName}</div>
                )}
                {currentSession.description && (
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">{currentSession.description}</p>
                )}
              </div>

              <div className="bg-[#090d17] border border-[#1b263b] rounded-lg p-3 grid grid-cols-2 gap-2.5 font-mono">
                <div>
                  <span className="text-gray-500 text-[10px] uppercase block">Asset</span>
                  <span className="text-white font-bold">
                    {currentSession.symbol} ({currentSession.market || 'CME'})
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] uppercase block">Timeframe</span>
                  <span className="text-purple-400 font-bold">{currentSession.timeframe}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] uppercase block">Capital</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(currentSession.startingBalance)}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] uppercase block">Session Mode</span>
                  <span className="text-cyan-400 font-bold uppercase text-[11px]">{currentSession.mode || 'manual'}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] uppercase block">Risk Model</span>
                  <span className="text-white">
                    {currentSession.riskMode === 'risk-pct'
                      ? `${currentSession.riskValue ?? 1}% Equity`
                      : currentSession.riskMode === 'fixed-dollar'
                      ? `$${currentSession.riskValue ?? 500} Fixed`
                      : `${currentSession.riskValue ?? 1} Contract`}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] uppercase block">Execution / SL-TP</span>
                  <span className="text-white capitalize">{currentSession.sameCandlePolicy || 'Conservative'}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-[#131d2e]">
                  <span className="text-gray-500 text-[10px] uppercase block">Date Period</span>
                  <span className="text-gray-200">
                    {new Date(currentSession.startDate).toISOString().slice(0, 10)} →{' '}
                    {new Date(currentSession.endDate).toISOString().slice(0, 10)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#090d17] border-t border-[#1a253a] flex items-center justify-between">
              <button
                onClick={() => {
                  setIsSessionDetailsModalOpen(false);
                  router.push(`/session/new?edit=${currentSession.id}`);
                }}
                className="px-3 py-1.5 rounded-lg border border-[#202e48] hover:bg-[#141d2e] text-blue-400 text-xs font-semibold cursor-pointer"
              >
                Edit Configuration
              </button>
              <button
                onClick={() => setIsSessionDetailsModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

