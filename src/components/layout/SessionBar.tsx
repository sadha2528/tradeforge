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
import { cn } from '@/lib/utils';
import type { Timeframe, Symbol } from '@/types/market-data';
import { TIMEFRAMES } from '@/config/constants';
import { formatCurrency } from '@/lib/utils/formatting';

export function SessionBar() {
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [currentSymbolObj, setCurrentSymbolObj] = useState<Symbol | null>(null);

  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const activeTimeframe = useChartStore((s) => s.activeTimeframe);
  const setActiveTimeframe = useChartStore((s) => s.setActiveTimeframe);
  const chartMode = useChartStore((s) => s.chartMode);
  const setChartMode = useChartStore((s) => s.setChartMode);

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

        {/* ── SESSION DATE DISPLAY ── */}
        <div className="flex items-center gap-1.5 h-7 px-2.5 bg-[#0c1018] border border-[#1e2535] rounded-lg font-mono text-[11px] text-gray-400 shrink-0 hidden md:flex">
          <span className="text-gray-500">📅</span>
          <span>{sessionDate}</span>
        </div>

        {/* ── MODE TOGGLE: Replay vs TradingView ── */}
        <div className="flex items-center gap-0.5 bg-[#0c1018] p-0.5 rounded-lg border border-[#1e2535] shrink-0">
          <button
            onClick={() => setChartMode('replay')}
            className={cn(
              'px-2 py-1 rounded-md text-[11px] font-mono font-bold transition cursor-pointer',
              chartMode === 'replay' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-gray-200'
            )}
            title="Replay Engine — tick-accurate historical backtesting"
          >
            Replay
          </button>
          <button
            onClick={() => setChartMode('tradingview')}
            className={cn(
              'px-2 py-1 rounded-md text-[11px] font-mono font-bold transition cursor-pointer',
              chartMode === 'tradingview' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
            )}
            title="TradingView Advanced Studio — live charts & Pine Script indicators"
          >
            Live Charts
          </button>
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
        <div className="flex items-center gap-1 shrink-0">
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
    </>
  );
}
