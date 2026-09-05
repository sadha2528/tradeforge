'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ChevronDown,
  Activity,
  Settings,
  Keyboard,
  Search,
  Award,
  FolderKanban,
  DollarSign,
  HelpCircle,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  Zap,
  BarChart2,
  Square,
  Columns2,
  Rows2,
  Grid2X2,
  Camera,
  Scale,
  CandlestickChart,
  LineChart,
  Check,
} from 'lucide-react';
import { useChartStore } from '@/store/chart-store';
import { useReplayStore } from '@/store/replay-store';
import { useTradingStore } from '@/store/trading-store';
import { useIndicatorStore } from '@/store/indicator-store';
import { useSessionStore } from '@/store/session-store';
import { useUIStore } from '@/store/ui-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import { SymbolSelectorModal } from '@/components/modals/SymbolSelectorModal';
import { IndicatorsModal } from '@/components/modals/IndicatorsModal';
import { KeyboardShortcutsModal } from '@/components/modals/KeyboardShortcutsModal';
import { SessionManagerModal } from '@/components/modals/SessionManagerModal';
import { CompareModal } from '@/components/modals/CompareModal';
import { cn } from '@/lib/utils';
import type { Timeframe, Symbol } from '@/types/market-data';
import type { ChartStyle } from '@/types/chart';
import { TIMEFRAMES } from '@/config/constants';
import { formatCurrency } from '@/lib/utils/formatting';

export function SessionBar() {
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isOrderFlowMenuOpen, setIsOrderFlowMenuOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [currentSymbolObj, setCurrentSymbolObj] = useState<Symbol | null>(null);

  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const activeTimeframe = useChartStore((s) => s.activeTimeframe);
  const setActiveTimeframe = useChartStore((s) => s.setActiveTimeframe);
  const layout = useChartStore((s) => s.layout);
  const setLayout = useChartStore((s) => s.setLayout);
  const chartStyle = useChartStore((s) => s.chartStyle);
  const setChartStyle = useChartStore((s) => s.setChartStyle);
  const compareSymbol = useChartStore((s) => s.compareSymbol);

  const showFootprint = useChartStore((s) => s.showFootprint);
  const showVolumeProfile = useChartStore((s) => s.showVolumeProfile);
  const showDOM = useChartStore((s) => s.showDOM);
  const toggleFootprint = useChartStore((s) => s.toggleFootprint);
  const toggleVolumeProfile = useChartStore((s) => s.toggleVolumeProfile);
  const toggleDOM = useChartStore((s) => s.toggleDOM);

  const activeIndicators = useIndicatorStore((s) => s.activeIndicators);
  const currentSession = useSessionStore((s) => s.currentSession);

  const balance = useTradingStore((s) => s.balance);
  const equity = useTradingStore((s) => s.equity);
  const openPnL = useTradingStore((s) => s.openPnL);

  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setChartSettingsOpen = useUIStore((s) => s.setChartSettingsOpen);
  const setPropFirmModalOpen = useUIStore((s) => s.setPropFirmModalOpen);
  const isFullscreen = useUIStore((s) => s.isFullscreen);
  const toggleFullscreen = useUIStore((s) => s.toggleFullscreen);
  const showRightSidebar = useUIStore((s) => s.showRightSidebar);
  const toggleRightSidebar = useUIStore((s) => s.toggleRightSidebar);

  const allCandles = useReplayStore((s) => s.allCandles);
  const currentIndex = useReplayStore((s) => s.currentIndex);
  const preloadCount = useReplayStore((s) => s.preloadCount);

  useEffect(() => {
    marketDataService.getSymbol(activeSymbol).then(setCurrentSymbolObj);
  }, [activeSymbol]);

  const currentCandle = allCandles[preloadCount + currentIndex] ?? null;

  // Format current date for session bar display
  const sessionDate = currentCandle
    ? new Date(currentCandle.timestamp).toLocaleDateString('en-US', {
        timeZone: 'America/New_York',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })
    : '—';

  const pnlColor = openPnL >= 0 ? 'text-emerald-400' : 'text-rose-400';
  const equityColor = equity >= balance ? 'text-emerald-400' : 'text-rose-400';

  return (
    <>
      <header className="h-full w-full bg-[#0f1117] border-b border-[#1e2333] flex items-center px-3 gap-2 select-none text-xs overflow-hidden">
        {/* ── LOGO ── */}
        <Link href="/landing" className="flex items-center gap-1.5 mr-2 shrink-0 cursor-pointer">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-500/30">
            <TrendingUp className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight hidden lg:inline text-[13px]">TradeForge</span>
        </Link>

        <div className="w-px h-5 bg-[#252d40] shrink-0" />

        {/* ── SYMBOL SELECTOR ── */}
        <button
          onClick={() => setIsSymbolModalOpen(true)}
          className="flex items-center gap-1.5 h-7 px-2.5 bg-[#161c2b] hover:bg-[#1c253c] border border-[#252d42] hover:border-blue-500/40 rounded-lg font-mono transition cursor-pointer shrink-0 group"
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              currentSymbolObj?.assetClass === 'futures' ? 'bg-amber-400' :
              currentSymbolObj?.assetClass === 'forex' ? 'bg-emerald-400' :
              'bg-blue-400'
            )}
          />
          <span className="font-bold text-white text-[12px]">{activeSymbol}</span>
          {currentSymbolObj?.assetClass === 'futures' && (
            <span className="text-amber-400/80 text-[10px] hidden xl:inline">${currentSymbolObj.tickValue}/t</span>
          )}
          <ChevronDown className="w-3 h-3 text-gray-500 group-hover:text-gray-300 transition" />
        </button>

        {/* ── TIMEFRAME PILLS ── */}
        <div className="flex items-center gap-0.5 bg-[#0c1018] p-0.5 rounded-lg border border-[#1e2535] shrink-0">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setActiveTimeframe(tf as Timeframe)}
              className={cn(
                'px-2 py-1 rounded-md text-[11px] font-mono font-semibold transition cursor-pointer',
                activeTimeframe === tf
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#161c2b]'
              )}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* ── CHART STYLE SELECTOR ── */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
            title="Chart Type (Candlesticks, Bars, Line, Area, Heikin-Ashi)"
            className="flex items-center gap-1 h-7 px-2 bg-[#0c1018] border border-[#1e2535] rounded-lg text-[11px] font-mono font-semibold text-gray-300 hover:text-white hover:border-[#252d42] transition cursor-pointer"
          >
            <CandlestickChart className="w-3.5 h-3.5 text-blue-400" />
            <span className="capitalize hidden xl:inline">{chartStyle.replace('-', ' ')}</span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>

          {isStyleMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-[#0f1422] border border-[#202d48] rounded-xl shadow-2xl p-1.5 z-50 text-xs font-mono space-y-1">
              {[
                { id: 'candlestick', label: 'Candlesticks' },
                { id: 'bar', label: 'Bars (OHLC)' },
                { id: 'line', label: 'Line' },
                { id: 'area', label: 'Area' },
                { id: 'heikin-ashi', label: 'Heikin-Ashi' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    setChartStyle(st.id as ChartStyle);
                    setIsStyleMenuOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition cursor-pointer text-[11px]',
                    chartStyle === st.id
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-bold'
                      : 'text-gray-300 hover:bg-[#161f33]'
                  )}
                >
                  <span>{st.label}</span>
                  {chartStyle === st.id && <Check className="w-3 h-3 text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── COMPARE BENCHMARK BUTTON ── */}
        <button
          onClick={() => setIsCompareModalOpen(true)}
          title="Compare with another benchmark"
          className={cn(
            'flex items-center gap-1 h-7 px-2 rounded-lg border text-[11px] font-mono font-semibold transition cursor-pointer shrink-0',
            compareSymbol
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 font-bold'
              : 'bg-[#0c1018] border-[#1e2535] text-gray-400 hover:text-white hover:border-[#252d42]'
          )}
        >
          <Scale className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden xl:inline">{compareSymbol ? `vs ${compareSymbol}` : 'Compare'}</span>
        </button>

        {/* ── SESSION DATE DISPLAY ── */}
        <div className="flex items-center gap-1.5 h-7 px-2.5 bg-[#0c1018] border border-[#1e2535] rounded-lg font-mono text-[11px] text-gray-400 shrink-0 hidden md:flex">
          <span className="text-gray-500">📅</span>
          <span>{sessionDate}</span>
        </div>

        {/* ── TRADINGVIEW LIGHTWEIGHT CHARTS BADGE & MULTI-CHART GRID ── */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 h-7 px-2 bg-[#0c1018] border border-[#1e2535] rounded-lg text-[10px] font-mono font-bold text-gray-300">
            <span className="text-blue-400 font-black">TV</span>
            <span className="text-gray-400 hidden lg:inline">Lightweight Charts</span>
          </div>

          <div className="flex items-center gap-0.5 bg-[#0c1018] p-0.5 rounded-lg border border-[#1e2535]">
            <button
              onClick={() => setLayout('1x1')}
              title="Single Chart (1x1)"
              className={cn(
                'p-1 rounded cursor-pointer transition',
                layout === '1x1' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayout('2x1')}
              title="Dual Vertical (2x1)"
              className={cn(
                'p-1 rounded cursor-pointer transition',
                layout === '2x1' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              <Columns2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayout('1x2')}
              title="Dual Horizontal (1x2)"
              className={cn(
                'p-1 rounded cursor-pointer transition',
                layout === '1x2' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              <Rows2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayout('2x2')}
              title="Quad Grid (2x2)"
              className={cn(
                'p-1 rounded cursor-pointer transition',
                layout === '2x2' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              <Grid2X2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── SPACER ── */}
        <div className="flex-1" />

        {/* ── ACCOUNT SUMMARY ── */}
        <div className="hidden md:flex items-center gap-3 font-mono shrink-0">
          <div className="flex items-center gap-1.5 h-7 px-2.5 bg-[#0c1018] border border-[#1e2535] rounded-lg">
            <DollarSign className="w-3 h-3 text-gray-500 shrink-0" />
            <div className="text-[11px]">
              <span className="text-gray-400">Balance </span>
              <span className="font-bold text-white">{formatCurrency(balance)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 h-7 px-2.5 bg-[#0c1018] border border-[#1e2535] rounded-lg">
            <span className="text-[11px]">
              <span className="text-gray-400 hidden xl:inline">P&L </span>
              <span className={cn('font-bold', pnlColor)}>
                {openPnL >= 0 ? '+' : ''}{formatCurrency(openPnL)}
              </span>
            </span>
          </div>
        </div>

        <div className="w-px h-5 bg-[#252d40] shrink-0" />

        {/* ── ICON CONTROLS ── */}
        <div className="flex items-center gap-1 shrink-0 relative">
          {/* Order Flow Suite Toggle Button */}
          <div className="relative">
            <button
              onClick={() => setIsOrderFlowMenuOpen(!isOrderFlowMenuOpen)}
              title="Order Flow Suite (Footprint, Volume Profile, DOM Ladder)"
              className={cn(
                'flex items-center gap-1 h-7 px-2 rounded-lg border transition cursor-pointer',
                showFootprint || showVolumeProfile || showDOM
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-xs shadow-amber-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-[#161c2b] border-transparent hover:border-[#252d42]'
              )}
            >
              <Zap className={cn('w-3.5 h-3.5', showFootprint || showVolumeProfile || showDOM ? 'text-amber-400' : 'text-gray-400')} />
              <span className="font-bold text-[11px] hidden sm:inline">Order Flow</span>
              {(showFootprint || showVolumeProfile || showDOM) && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            {/* Order Flow Dropdown Popover */}
            {isOrderFlowMenuOpen && (
              <div className="absolute top-full right-0 mt-1 w-56 bg-[#0f1422] border border-[#202d48] rounded-xl shadow-2xl p-2 z-50 text-xs font-mono space-y-1.5">
                <div className="px-2 py-1 text-[10px] text-gray-500 uppercase tracking-wider font-bold border-b border-[#1b253c]">
                  Order Flow Tools
                </div>

                {/* Footprint Toggle */}
                <button
                  onClick={() => toggleFootprint()}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition cursor-pointer',
                    showFootprint
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : 'text-gray-300 hover:bg-[#161f33]'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>Footprint (Bid/Ask)</span>
                  </div>
                  <span className="text-[10px] font-bold">{showFootprint ? 'ON' : 'OFF'}</span>
                </button>

                {/* Volume Profile Toggle */}
                <button
                  onClick={() => toggleVolumeProfile()}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition cursor-pointer',
                    showVolumeProfile
                      ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                      : 'text-gray-300 hover:bg-[#161f33]'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Volume Profile (VP)</span>
                  </div>
                  <span className="text-[10px] font-bold">{showVolumeProfile ? 'ON' : 'OFF'}</span>
                </button>

                {/* DOM Ladder Toggle */}
                <button
                  onClick={() => toggleDOM()}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition cursor-pointer',
                    showDOM
                      ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-gray-300 hover:bg-[#161f33]'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>DOM Price Ladder</span>
                  </div>
                  <span className="text-[10px] font-bold">{showDOM ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Indicators */}
          <button
            onClick={() => setIsIndicatorsModalOpen(true)}
            title="Indicators (I)"
            className="flex items-center gap-1 h-7 px-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#161c2b] border border-transparent hover:border-[#252d42] transition cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            {activeIndicators.length > 0 && (
              <span className="text-[10px] font-mono font-bold text-blue-400">{activeIndicators.length}</span>
            )}
          </button>

          {/* Chart Settings */}
          <button
            onClick={() => setChartSettingsOpen(true)}
            title="Chart & Execution Settings"
            className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#161c2b] transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Prop Firm */}
          <button
            onClick={() => setPropFirmModalOpen(true)}
            title="Prop Firm Challenge Tracker"
            className="h-7 w-7 flex items-center justify-center rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
          </button>

          {/* Search / Command Palette */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            title="Command Palette (Cmd+K)"
            className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#161c2b] transition cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Right Panel Toggle */}
          <button
            onClick={toggleRightSidebar}
            title={showRightSidebar ? 'Hide Execution Panel' : 'Show Execution Panel'}
            className={cn(
              'h-7 w-7 flex items-center justify-center rounded-lg border transition cursor-pointer',
              showRightSidebar
                ? 'text-blue-400 bg-blue-500/10 border-blue-500/30'
                : 'text-gray-500 border-transparent hover:bg-[#161c2b] hover:text-gray-300'
            )}
          >
            {showRightSidebar ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
          </button>

          {/* Save Snapshot / Camera */}
          <button
            onClick={() => {
              const canvas = document.querySelector('canvas') as HTMLCanvasElement;
              if (canvas) {
                const a = document.createElement('a');
                a.href = canvas.toDataURL('image/png');
                a.download = `tradeforge-${activeSymbol}-${Date.now()}.png`;
                a.click();
              }
            }}
            title="Save Chart Snapshot (PNG)"
            className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen (F)'}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#161c2b] transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Keyboard Shortcuts */}
          <button
            onClick={() => setIsShortcutsModalOpen(true)}
            title="Keyboard Shortcuts (?)"
            className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#161c2b] transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Modals */}
      <SymbolSelectorModal isOpen={isSymbolModalOpen} onClose={() => setIsSymbolModalOpen(false)} />
      <IndicatorsModal isOpen={isIndicatorsModalOpen} onClose={() => setIsIndicatorsModalOpen(false)} />
      <KeyboardShortcutsModal isOpen={isShortcutsModalOpen} onClose={() => setIsShortcutsModalOpen(false)} />
      <SessionManagerModal isOpen={isSessionModalOpen} onClose={() => setIsSessionModalOpen(false)} />
      <CompareModal isOpen={isCompareModalOpen} onClose={() => setIsCompareModalOpen(false)} />
    </>
  );
}
