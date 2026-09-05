'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  FolderKanban,
  Calendar,
  Clock,
  DollarSign,
  Shield,
  Sliders,
  Play,
  Save,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Globe,
  Sparkles,
  ArrowRight,
  FileText,
  Award,
} from 'lucide-react';
import { InstrumentRegistry } from '@/lib/trading-engine/instrument-registry';
import { useSessionStore } from '@/store/session-store';
import { useChartStore } from '@/store/chart-store';
import { useTradingStore } from '@/store/trading-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import { TIMEFRAMES } from '@/config/constants';
import type { Timeframe } from '@/types/market-data';
import type { SessionMode, RiskMode } from '@/types/common';
import type { ExecutionAssumption } from '@/types/trading';
import { formatCurrency } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils';


function NewSessionContent() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');


  const { sessions, createSession, updateSession, setCurrentSession } = useSessionStore();
  const setActiveSymbol = useChartStore((s) => s.setActiveSymbol);
  const setActiveTimeframe = useChartStore((s) => s.setActiveTimeframe);
  const updateAccountSettings = useTradingStore((s) => s.updateAccountSettings);
  const resetAccount = useTradingStore((s) => s.resetAccount);

  // All instruments from InstrumentRegistry
  const allInstruments = useMemo(() => InstrumentRegistry.getAllInstruments(), []);

  // Form states
  const [selectedCategory, setSelectedCategory] = useState<string>('indices');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('ES');
  const [sessionName, setSessionName] = useState<string>('ES 5m — NY & London Session Replay');
  const [description, setDescription] = useState<string>('');
  const [strategyName, setStrategyName] = useState<string>('Opening Range Breakout (ORB)');
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');

  // Dates & Times
  const [startDate, setStartDate] = useState<string>('2024-09-16');
  const [endDate, setEndDate] = useState<string>('2024-09-20');
  const [startTime, setStartTime] = useState<string>('09:30');
  const [endTime, setEndTime] = useState<string>('16:15');
  const [timezone, setTimezone] = useState<string>('America/New_York');

  // Replay Start choice
  const [replayStartChoice, setReplayStartChoice] = useState<
    'start_of_period' | 'session_open' | 'london_open' | 'globex_open' | 'custom'
  >('session_open');
  const [customReplayDate, setCustomReplayDate] = useState<string>('2024-09-16');
  const [customReplayTime, setCustomReplayTime] = useState<string>('09:30');

  // Mode & Account
  const [sessionMode, setSessionMode] = useState<SessionMode>('manual');
  const [balance, setBalance] = useState<number>(100000);
  const [customBalanceInput, setCustomBalanceInput] = useState<string>('');
  const [isCustomBalance, setIsCustomBalance] = useState<boolean>(false);

  // Risk settings
  const [riskMode, setRiskMode] = useState<RiskMode>('contracts');
  const [riskValue, setRiskValue] = useState<number>(1);

  // Advanced execution
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
  const [commission, setCommission] = useState<number>(2.50);
  const [slippage, setSlippage] = useState<number>(0);
  const [sameCandlePolicy, setSameCandlePolicy] = useState<ExecutionAssumption>('conservative');
  const [includeETH, setIncludeETH] = useState<boolean>(true);

  // If editing an existing session, load its details
  useEffect(() => {
    if (editId) {
      const existing = sessions.find((s) => s.id === editId);
      if (existing) {
        setSessionName(existing.name);
        setSelectedSymbol(existing.symbol);
        setTimeframe(existing.timeframe);
        setBalance(existing.startingBalance);
        if (existing.description) setDescription(existing.description);
        if (existing.strategyName) setStrategyName(existing.strategyName);
        if (existing.mode) setSessionMode(existing.mode);
        if (existing.riskMode) setRiskMode(existing.riskMode);
        if (existing.riskValue !== undefined) setRiskValue(existing.riskValue);
        if (existing.commission !== undefined) setCommission(existing.commission);
        if (existing.slippage !== undefined) setSlippage(existing.slippage);
        if (existing.sameCandlePolicy) setSameCandlePolicy(existing.sameCandlePolicy);
        if (existing.includeETH !== undefined) setIncludeETH(existing.includeETH);
        if (existing.timezone) setTimezone(existing.timezone);

        const startIso = new Date(existing.startDate).toISOString().split('T')[0];
        const endIso = new Date(existing.endDate).toISOString().split('T')[0];
        setStartDate(startIso);
        setEndDate(endIso);
      }
    }
  }, [editId, sessions]);

  // Current instrument details
  const activeInstrument = useMemo(() => {
    return InstrumentRegistry.getInstrument(selectedSymbol) || allInstruments[0];
  }, [selectedSymbol, allInstruments]);

  // Update commission & slippage defaults when symbol changes
  useEffect(() => {
    if (!editId && activeInstrument) {
      setCommission(activeInstrument.commissionModel?.roundTurnPerContract ?? 2.50);
      setSlippage(activeInstrument.slippageModel?.defaultTicks ?? 0);
    }
  }, [selectedSymbol, activeInstrument, editId]);

  // Auto-suggest session name if user hasn't explicitly customized it heavily
  const handleSymbolChange = (sym: string) => {
    setSelectedSymbol(sym);
    if (!editId) {
      setSessionName(`${sym} ${timeframe} — Historical Replay`);
    }
  };

  const handleTimeframeChange = (tf: Timeframe) => {
    setTimeframe(tf);
    if (!editId) {
      setSessionName(`${selectedSymbol} ${tf} — Historical Replay`);
    }
  };

  // Preset date ranges
  const applyDatePreset = (preset: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y') => {
    const end = new Date('2024-09-20T23:59:59Z');
    const start = new Date(end);

    switch (preset) {
      case '1D':
        start.setUTCDate(end.getUTCDate() - 1);
        break;
      case '1W':
        start.setUTCDate(end.getUTCDate() - 5);
        break;
      case '1M':
        start.setUTCMonth(end.getUTCMonth() - 1);
        break;
      case '3M':
        start.setUTCMonth(end.getUTCMonth() - 3);
        break;
      case '6M':
        start.setUTCMonth(end.getUTCMonth() - 6);
        break;
      case '1Y':
        start.setUTCFullYear(end.getUTCFullYear() - 1);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Balance presets
  const handleBalancePreset = (amount: number) => {
    setBalance(amount);
    setIsCustomBalance(false);
  };

  const handleCustomBalanceChange = (val: string) => {
    setCustomBalanceInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setBalance(num);
    }
  };

  // Computed timestamps
  const { startTs, endTs, replayStartTs, validationError } = useMemo(() => {
    try {
      const s = new Date(`${startDate}T${startTime}:00Z`).getTime();
      const e = new Date(`${endDate}T${endTime}:00Z`).getTime();

      if (isNaN(s) || isNaN(e)) {
        return { startTs: 0, endTs: 0, replayStartTs: 0, validationError: 'Invalid date or time format.' };
      }
      if (s >= e) {
        return { startTs: s, endTs: e, replayStartTs: 0, validationError: 'Historical start date must be before end date.' };
      }

      let rTs = s;
      if (replayStartChoice === 'session_open') {
        rTs = new Date(`${startDate}T09:30:00Z`).getTime();
      } else if (replayStartChoice === 'london_open') {
        rTs = new Date(`${startDate}T03:00:00Z`).getTime();
      } else if (replayStartChoice === 'globex_open') {
        rTs = new Date(`${startDate}T18:00:00Z`).getTime();
      } else if (replayStartChoice === 'custom') {
        rTs = new Date(`${customReplayDate}T${customReplayTime}:00Z`).getTime();
      }

      if (rTs < s || rTs > e) {
        return {
          startTs: s,
          endTs: e,
          replayStartTs: rTs,
          validationError: 'Replay starting point must fall within the selected historical period.',
        };
      }

      return { startTs: s, endTs: e, replayStartTs: rTs, validationError: null };
    } catch {
      return { startTs: 0, endTs: 0, replayStartTs: 0, validationError: 'Error calculating session timestamps.' };
    }
  }, [startDate, startTime, endDate, endTime, replayStartChoice, customReplayDate, customReplayTime]);

  // Data availability validation
  const dataAvailability = useMemo(() => {
    if (validationError || !startTs || !endTs) {
      return { available: false, reason: validationError || 'Invalid configuration', isSimulated: false };
    }
    return marketDataService.validateDataAvailability(selectedSymbol, timeframe, startTs, endTs);
  }, [selectedSymbol, timeframe, startTs, endTs, validationError]);

  // Format Replay Start display string
  const replayStartDisplay = useMemo(() => {
    if (!replayStartTs) return 'Start of period';
    const d = new Date(replayStartTs);
    return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)} UTC (${timezone.split('/')[1]?.replace('_', ' ') || 'ET'})`;
  }, [replayStartTs, timezone]);

  // Handle Save Session without launch
  const handleSaveOnly = () => {
    if (validationError) return;

    if (editId) {
      updateSession(editId, {
        name: sessionName.trim() || `${selectedSymbol} Replay`,
        strategyName: strategyName.trim() || null,
        description: description.trim() || undefined,
        symbol: selectedSymbol,
        market: activeInstrument?.exchange || 'CME',
        timeframe,
        startingBalance: balance,
        mode: sessionMode,
        riskMode,
        riskValue,
        commission,
        slippage,
        sameCandlePolicy,
        includeETH,
        timezone,
        startDate: startTs,
        endDate: endTs,
        replayStartTime: replayStartTs,
        currentTimestamp: replayStartTs,
        currentIndex: 0,
      });
    } else {
      createSession({
        name: sessionName.trim() || `${selectedSymbol} Replay`,
        strategyName: strategyName.trim() || null,
        description: description.trim() || undefined,
        symbol: selectedSymbol,
        market: activeInstrument?.exchange || 'CME',
        timeframe,
        startingBalance: balance,
        mode: sessionMode,
        riskMode,
        riskValue,
        commission,
        slippage,
        sameCandlePolicy,
        includeETH,
        timezone,
        startDate: startTs,
        endDate: endTs,
        replayStartTime: replayStartTs,
      });
    }

    router.push('/sessions');
  };

  // Handle Launch Session: configures stores and routes directly to /platform
  const handleStartSession = async () => {
    if (validationError) return;

    let targetSession;
    if (editId) {
      updateSession(editId, {
        name: sessionName.trim() || `${selectedSymbol} Replay`,
        strategyName: strategyName.trim() || null,
        description: description.trim() || undefined,
        symbol: selectedSymbol,
        market: activeInstrument?.exchange || 'CME',
        timeframe,
        startingBalance: balance,
        mode: sessionMode,
        riskMode,
        riskValue,
        commission,
        slippage,
        sameCandlePolicy,
        includeETH,
        timezone,
        startDate: startTs,
        endDate: endTs,
        replayStartTime: replayStartTs,
        currentTimestamp: replayStartTs,
        currentIndex: 0,
      });
      targetSession = sessions.find((s) => s.id === editId);
    } else {
      targetSession = createSession({
        name: sessionName.trim() || `${selectedSymbol} Replay`,
        strategyName: strategyName.trim() || null,
        description: description.trim() || undefined,
        symbol: selectedSymbol,
        market: activeInstrument?.exchange || 'CME',
        timeframe,
        startingBalance: balance,
        mode: sessionMode,
        riskMode,
        riskValue,
        commission,
        slippage,
        sameCandlePolicy,
        includeETH,
        timezone,
        startDate: startTs,
        endDate: endTs,
        replayStartTime: replayStartTs,
      });
    }

    if (targetSession) {
      setCurrentSession(targetSession);
    }

    // Configure core platform stores
    setActiveSymbol(selectedSymbol);
    setActiveTimeframe(timeframe);

    updateAccountSettings({
      startingBalance: balance,
      commission,
      slippage,
      executionAssumption: sameCandlePolicy,
      riskPerTrade: riskMode === 'risk-pct' ? riskValue : 1,
      positionSizingMethod:
        riskMode === 'contracts'
          ? 'fixed-quantity'
          : riskMode === 'fixed-dollar'
          ? 'fixed-dollar'
          : 'percentage-risk',
    });

    // Reset account state for a clean run
    resetAccount();

    // Navigate to terminal
    router.push('/platform');
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-gray-200 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-[#162032] bg-[#0a0f1b]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-4">
          <Link href="/landing" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-white group-hover:text-blue-400 transition">
              TradeForge
            </span>
          </Link>
          <span className="text-gray-600 text-xs">/</span>
          <span className="text-xs font-mono font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            {editId ? 'EDIT SESSION' : 'NEW SESSION'}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/sessions"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#1e2a42] bg-[#101726] hover:bg-[#182338] text-gray-300 hover:text-white text-xs font-medium transition"
          >
            <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
            <span>My Sessions</span>
          </Link>
          <Link
            href="/platform"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#1e2a42] bg-[#101726] hover:bg-[#182338] text-gray-300 hover:text-white text-xs font-medium transition"
          >
            <span>Trading Terminal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-3">
            <span>{editId ? 'Edit Backtest Session' : 'Start New Backtest Session'}</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 uppercase">
              {sessionMode}
            </span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Configure your replay parameters, contract specifications, and risk controls before entering the workstation.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* =========================================================================
              LEFT / CENTER FORM (Col 1-8)
          ========================================================================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. SESSION DETAILS */}
            <div className="bg-[#0e1422] border border-[#1b263b] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#1a2438] pb-3">
                <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>1. Session Details</span>
                </div>
                <span className="text-[11px] font-mono text-gray-400">Metadata & Strategy</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300">Session Name</label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="e.g. NQ Opening Range Breakout Replay"
                    className="w-full px-3 py-2 bg-[#090d17] border border-[#202d44] focus:border-blue-500 rounded-lg text-xs font-mono text-white placeholder-gray-500 focus:outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300">Strategy / Playbook</label>
                  <input
                    type="text"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    placeholder="e.g. ICT Silver Bullet / Volume Profile POC"
                    className="w-full px-3 py-2 bg-[#090d17] border border-[#202d44] focus:border-blue-500 rounded-lg text-xs font-mono text-white placeholder-gray-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">Session Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Notes on the trading conditions, hypothesis, or rules being evaluated during this session..."
                  className="w-full px-3 py-2 bg-[#090d17] border border-[#202d44] focus:border-blue-500 rounded-lg text-xs font-mono text-white placeholder-gray-500 focus:outline-none transition resize-none"
                />
              </div>
            </div>

            {/* 2. MARKET & INSTRUMENT SELECTOR */}
            <div className="bg-[#0e1422] border border-[#1b263b] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#1a2438] pb-3">
                <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>2. Market & Futures Instrument</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {activeInstrument?.exchange || 'CME'} Exchange
                </span>
              </div>

              {/* Category tabs */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'indices', label: 'Equity Indices' },
                  { id: 'energies', label: 'Energies' },
                  { id: 'metals', label: 'Metals' },
                  { id: 'currencies', label: 'Currencies' },
                  { id: 'interest_rates', label: 'Rates' },
                  { id: 'agriculturals', label: 'Ag' },
                  { id: 'all', label: 'All Instruments' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-md font-medium text-[11px] whitespace-nowrap transition cursor-pointer',
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-gray-400 hover:text-white hover:bg-[#172235]'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Instrument Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {allInstruments
                  .filter((inst) => selectedCategory === 'all' || inst.category === selectedCategory)
                  .map((inst) => (
                    <button
                      key={inst.symbol}
                      onClick={() => handleSymbolChange(inst.symbol)}
                      className={cn(
                        'p-2.5 rounded-lg border text-left transition flex flex-col justify-between cursor-pointer',
                        selectedSymbol === inst.symbol
                          ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                          : 'bg-[#090d17] border-[#1e2a42] text-gray-300 hover:border-gray-600 hover:bg-[#121929]'
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold font-mono text-xs">{inst.symbol}</span>
                        <span className="text-[10px] font-mono text-gray-400 uppercase">{inst.exchange}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 truncate mt-1">{inst.name}</div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mt-2 pt-1 border-t border-[#182236]">
                        <span>${inst.tickValue}/tick</span>
                        <span>{inst.tickSize} pt</span>
                      </div>
                    </button>
                  ))}
              </div>

              {/* Active Contract Specification Card */}
              {activeInstrument && (
                <div className="bg-[#090d17] border border-[#1c273e] rounded-lg p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
                  <div>
                    <div className="text-[10px] text-gray-400 font-medium uppercase">Tick Size</div>
                    <div className="font-mono text-xs text-white font-bold mt-0.5">{activeInstrument.tickSize} pts</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-medium uppercase">Tick Value</div>
                    <div className="font-mono text-xs text-emerald-400 font-bold mt-0.5">
                      ${activeInstrument.tickValue.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-medium uppercase">Point Value</div>
                    <div className="font-mono text-xs text-white font-bold mt-0.5">
                      ${activeInstrument.pointValue.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-medium uppercase">Initial Margin</div>
                    <div className="font-mono text-xs text-amber-400 font-bold mt-0.5">
                      {formatCurrency(activeInstrument.initialMargin)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-medium uppercase">RTH Session</div>
                    <div className="font-mono text-xs text-gray-200 mt-0.5">
                      {activeInstrument.rthSession.start} - {activeInstrument.rthSession.end}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-medium uppercase">Currency</div>
                    <div className="font-mono text-xs text-blue-400 font-bold mt-0.5">
                      {activeInstrument.currency}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. TIMEFRAME */}
            <div className="bg-[#0e1422] border border-[#1b263b] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#1a2438] pb-3">
                <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>3. Execution Timeframe</span>
                </div>
                <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  Primary Chart
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => handleTimeframeChange(tf as Timeframe)}
                    className={cn(
                      'py-2.5 rounded-lg border font-mono text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer',
                      timeframe === tf
                        ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                        : 'bg-[#090d17] border-[#1e2a42] text-gray-400 hover:text-white hover:bg-[#121929]'
                    )}
                  >
                    <span>{tf}</span>
                    {tf === '5m' && <span className="text-[9px] font-sans text-blue-200 font-normal mt-0.5">Default</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. HISTORICAL PERIOD & TIMEZONE */}
            <div className="bg-[#0e1422] border border-[#1b263b] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#1a2438] pb-3">
                <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>4. Historical Period & Bounds</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Timezone:</span>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="bg-[#090d17] border border-[#202d44] text-xs font-mono text-gray-200 rounded px-2 py-0.5 focus:outline-none"
                  >
                    <option value="America/New_York">America/New_York (ET)</option>
                    <option value="UTC">UTC (Universal)</option>
                    <option value="America/Chicago">America/Chicago (CT)</option>
                  </select>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-gray-400 text-[11px] font-medium">Presets:</span>
                {(['1D', '1W', '1M', '3M', '6M', '1Y'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => applyDatePreset(preset)}
                    className="px-2.5 py-1 rounded bg-[#090d17] hover:bg-[#172235] border border-[#1e2a42] text-gray-300 hover:text-white font-mono text-xs transition cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Date pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-[#090d17] border border-[#1c273e] rounded-lg space-y-2">
                  <div className="text-xs font-medium text-gray-300 flex items-center justify-between">
                    <span>Start Date & Time</span>
                    <span className="text-[10px] text-gray-500 font-mono">Period Open</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#202d44] focus:border-blue-500 rounded text-xs font-mono text-white focus:outline-none"
                    />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#202d44] focus:border-blue-500 rounded text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#090d17] border border-[#1c273e] rounded-lg space-y-2">
                  <div className="text-xs font-medium text-gray-300 flex items-center justify-between">
                    <span>End Date & Time</span>
                    <span className="text-[10px] text-gray-500 font-mono">Period Close</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#202d44] focus:border-blue-500 rounded text-xs font-mono text-white focus:outline-none"
                    />
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#202d44] focus:border-blue-500 rounded text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. REPLAY START POSITION */}
            <div className="bg-[#0e1422] border border-[#1b263b] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#1a2438] pb-3">
                <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                  <Play className="w-4 h-4 text-amber-400" />
                  <span>5. Starting Replay Position</span>
                </div>
                <span className="text-[11px] font-mono text-gray-400">Zero Lookahead Bias</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'start_of_period', title: 'Start of Period', desc: 'First candle of selected historical range' },
                  { id: 'session_open', title: 'Session Open (09:30 ET)', desc: 'Pre-loads overnight action up to regular open' },
                  { id: 'london_open', title: 'London Open (03:00 ET)', desc: 'European volatility expansion opening' },
                  { id: 'globex_open', title: 'Globex Open (18:00 ET)', desc: 'Prior evening electronic session opening' },
                  { id: 'custom', title: 'Custom Timestamp', desc: 'Specify exact date and minute to begin replay' },
                ].map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => setReplayStartChoice(choice.id as any)}
                    className={cn(
                      'p-3 rounded-lg border text-left transition flex items-start space-x-3 cursor-pointer',
                      replayStartChoice === choice.id
                        ? 'bg-amber-500/10 border-amber-500 text-white ring-1 ring-amber-500/40'
                        : 'bg-[#090d17] border-[#1e2a42] text-gray-300 hover:border-gray-600 hover:bg-[#121929]'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center flex-shrink-0',
                        replayStartChoice === choice.id ? 'border-amber-400 bg-amber-400' : 'border-gray-500'
                      )}
                    >
                      {replayStartChoice === choice.id && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-white">{choice.title}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{choice.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {replayStartChoice === 'custom' && (
                <div className="p-3 bg-[#090d17] border border-[#1e2a42] rounded-lg grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-[11px] text-gray-400 font-medium">Custom Date</label>
                    <input
                      type="date"
                      value={customReplayDate}
                      onChange={(e) => setCustomReplayDate(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 bg-[#0e1422] border border-[#202d44] rounded text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-400 font-medium">Custom Time</label>
                    <input
                      type="time"
                      value={customReplayTime}
                      onChange={(e) => setCustomReplayTime(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 bg-[#0e1422] border border-[#202d44] rounded text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 6. SESSION MODE */}
            <div className="bg-[#0e1422] border border-[#1b263b] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#1a2438] pb-3">
                <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>6. Session Mode</span>
                </div>
                <span className="text-[11px] font-mono text-gray-400">Rules & Enforcement</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    id: 'manual',
                    title: 'Manual Backtest',
                    badge: 'Default',
                    desc: 'Full manual order entry, SL/TP execution, journaling, and P&L tracking without strict account constraints.',
                  },
                  {
                    id: 'prop-firm',
                    title: 'Prop Firm Simulator',
                    badge: 'Challenge',
                    desc: 'Enforce strict max drawdown limits (e.g. 5%), daily loss limits, and simulated evaluation profit targets.',
                  },
                  {
                    id: 'free-replay',
                    title: 'Free Replay',
                    badge: 'Study',
                    desc: 'Pure chart observation and price-action study without order submission or equity tracking.',
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSessionMode(mode.id as SessionMode)}
                    className={cn(
                      'p-4 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer',
                      sessionMode === mode.id
                        ? 'bg-cyan-500/10 border-cyan-500 text-white ring-1 ring-cyan-500/40 shadow-sm'
                        : 'bg-[#090d17] border-[#1e2a42] text-gray-300 hover:border-gray-600 hover:bg-[#121929]'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{mode.title}</span>
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                          {mode.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">{mode.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 7. ACCOUNT BALANCE & CAPITAL */}
            <div className="bg-[#0e1422] border border-[#1b263b] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#1a2438] pb-3">
                <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>7. Account Starting Balance</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">USD ($)</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[25000, 50000, 100000, 150000, 250000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => handleBalancePreset(amt)}
                    className={cn(
                      'py-2.5 rounded-lg border font-mono text-xs font-bold transition cursor-pointer',
                      !isCustomBalance && balance === amt
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                        : 'bg-[#090d17] border-[#1e2a42] text-gray-300 hover:text-white hover:bg-[#121929]'
                    )}
                  >
                    {formatCurrency(amt, 'USD')}
                  </button>

                ))}
                <button
                  onClick={() => setIsCustomBalance(true)}
                  className={cn(
                    'py-2.5 rounded-lg border font-mono text-xs font-bold transition cursor-pointer',
                    isCustomBalance
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                      : 'bg-[#090d17] border-[#1e2a42] text-gray-300 hover:text-white hover:bg-[#121929]'
                  )}
                >
                  Custom
                </button>
              </div>

              {isCustomBalance && (
                <div className="pt-2">
                  <label className="text-xs font-medium text-gray-300">Enter Custom Starting Capital ($)</label>
                  <input
                    type="number"
                    value={customBalanceInput}
                    onChange={(e) => handleCustomBalanceChange(e.target.value)}
                    placeholder="e.g. 500000"
                    className="w-full mt-1 px-3 py-2 bg-[#090d17] border border-[#202d44] focus:border-emerald-500 rounded-lg text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* 8. RISK SETTINGS */}
            <div className="bg-[#0e1422] border border-[#1b263b] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#1a2438] pb-3">
                <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>8. Risk Configuration & Position Sizing</span>
                </div>
                <span className="text-[11px] font-mono text-gray-400">Order Entry Rules</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'contracts', title: 'Fixed Contracts', suffix: 'Lots / Contracts', defaultVal: 1, step: 1 },
                  { id: 'risk-pct', title: '% Risk per Trade', suffix: '% of Equity', defaultVal: 1.0, step: 0.1 },
                  { id: 'fixed-dollar', title: 'Fixed Dollar Risk', suffix: '$ per Trade', defaultVal: 500, step: 50 },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setRiskMode(r.id as RiskMode);
                      setRiskValue(r.defaultVal);
                    }}
                    className={cn(
                      'p-3 rounded-lg border text-left transition cursor-pointer',
                      riskMode === r.id
                        ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500/40'
                        : 'bg-[#090d17] border-[#1e2a42] text-gray-300 hover:border-gray-600 hover:bg-[#121929]'
                    )}
                  >
                    <div className="font-semibold text-xs text-white">{r.title}</div>
                    <div className="text-[11px] text-gray-400 mt-1">{r.suffix}</div>
                  </button>
                ))}
              </div>

              <div className="p-3 bg-[#090d17] border border-[#1c273e] rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-gray-200">Default Risk Value</div>
                  <div className="text-[11px] text-gray-400">
                    {riskMode === 'contracts'
                      ? 'Number of contracts auto-populated on order ticket'
                      : riskMode === 'risk-pct'
                      ? 'Percentage of account equity risked based on stop distance'
                      : 'Exact dollar amount risked based on stop distance'}
                  </div>
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    value={riskValue}
                    onChange={(e) => setRiskValue(parseFloat(e.target.value) || 1)}
                    min={riskMode === 'contracts' ? 1 : 0.1}
                    step={riskMode === 'contracts' ? 1 : riskMode === 'risk-pct' ? 0.25 : 50}
                    className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#202d44] focus:border-blue-500 rounded text-xs font-mono text-white text-right focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 9. ADVANCED EXECUTION ASSUMPTIONS (Collapsible) */}
            <div className="bg-[#0e1422] border border-[#1b263b] rounded-xl p-5 shadow-sm space-y-4">
              <button
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="w-full flex items-center justify-between cursor-pointer group text-left"
              >
                <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>9. Advanced Execution & Market Hours</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400 group-hover:text-white">
                    {isAdvancedOpen ? 'Collapse' : 'Expand Settings'}
                  </span>
                  <ChevronDown
                    className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', isAdvancedOpen && 'rotate-180')}
                  />
                </div>
              </button>

              {isAdvancedOpen && (
                <div className="pt-3 border-t border-[#1a2438] space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Commission */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-300 flex items-center justify-between">
                        <span>Commission (Round-turn)</span>
                        <span className="text-[10px] font-mono text-gray-500">$/contract</span>
                      </label>
                      <input
                        type="number"
                        value={commission}
                        onChange={(e) => setCommission(parseFloat(e.target.value) || 0)}
                        step={0.25}
                        className="w-full px-3 py-1.5 bg-[#090d17] border border-[#202d44] rounded text-xs font-mono text-white focus:outline-none"
                      />
                    </div>

                    {/* Slippage */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-300 flex items-center justify-between">
                        <span>Simulated Slippage</span>
                        <span className="text-[10px] font-mono text-gray-500">ticks per fill</span>
                      </label>
                      <input
                        type="number"
                        value={slippage}
                        onChange={(e) => setSlippage(parseInt(e.target.value) || 0)}
                        min={0}
                        max={10}
                        className="w-full px-3 py-1.5 bg-[#090d17] border border-[#202d44] rounded text-xs font-mono text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Same-Candle Policy */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-300">
                      Same-Candle SL/TP Execution Policy
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'conservative', label: 'Conservative', hint: 'SL checked first' },
                        { id: 'stop-first', label: 'Stop First', hint: 'Worst-case fill' },
                        { id: 'target-first', label: 'Target First', hint: 'Optimistic fill' },
                        { id: 'path-aware', label: 'Path Aware', hint: 'Bar anatomy' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setSameCandlePolicy(p.id as ExecutionAssumption)}
                          className={cn(
                            'p-2 rounded border text-left text-xs transition cursor-pointer',
                            sameCandlePolicy === p.id
                              ? 'bg-amber-500/15 border-amber-500 text-white font-medium'
                              : 'bg-[#090d17] border-[#1e2a42] text-gray-400 hover:text-white'
                          )}
                        >
                          <div className="font-semibold text-[11px]">{p.label}</div>
                          <div className="text-[9px] text-gray-500">{p.hint}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Market Hours Toggle */}
                  <div className="p-3 bg-[#090d17] border border-[#1c273e] rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-gray-200">Session Hours Inclusion</div>
                      <div className="text-[11px] text-gray-400">
                        {includeETH
                          ? 'Electronic Trading Hours (ETH) 24/5 enabled — includes Asian & European sessions'
                          : 'Regular Trading Hours (RTH) only (09:30 - 16:15 ET)'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setIncludeETH(true)}
                        className={cn(
                          'px-2.5 py-1 rounded text-xs font-mono font-medium transition cursor-pointer',
                          includeETH ? 'bg-blue-600 text-white' : 'bg-[#121929] text-gray-400'
                        )}
                      >
                        ETH + RTH
                      </button>
                      <button
                        onClick={() => setIncludeETH(false)}
                        className={cn(
                          'px-2.5 py-1 rounded text-xs font-mono font-medium transition cursor-pointer',
                          !includeETH ? 'bg-blue-600 text-white' : 'bg-[#121929] text-gray-400'
                        )}
                      >
                        RTH Only
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
              RIGHT STICKY SESSION SUMMARY (Col 9-12)
          ========================================================================= */}
          <div className="lg:col-span-4 sticky top-20 space-y-4">
            <div className="bg-[#0e1422] border border-[#1b263b] rounded-xl p-5 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-[#1a2438] pb-3">
                <div className="flex items-center space-x-2 text-white font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Session Summary</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold uppercase">
                  Ready
                </span>
              </div>

              {/* Data Availability Badge */}
              <div
                className={cn(
                  'p-3 rounded-lg border text-xs font-mono flex items-start space-x-2.5',
                  dataAvailability.available
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/30 border-red-500/40 text-red-300'
                )}
              >
                {dataAvailability.available ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-[11px] leading-snug">
                  {dataAvailability.available ? (
                    <div>
                      <div className="font-bold">Historical Data Available</div>
                      <div className="text-[10px] text-emerald-400/80 mt-0.5">
                        Built-in Simulated CME High-Precision Tick Feed
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold">Data Unavailable</div>
                      <div className="text-[10px] text-red-400/80 mt-0.5">
                        {dataAvailability.reason || 'Invalid date bounds'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Specs List */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[#141e30]">
                  <span className="text-gray-400">Session Name:</span>
                  <span className="font-medium text-white truncate max-w-[170px]">{sessionName}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#141e30]">
                  <span className="text-gray-400">Instrument:</span>
                  <div className="flex items-center space-x-1.5 font-mono">
                    <span className="font-bold text-white">{selectedSymbol}</span>
                    <span className="text-[10px] text-gray-500">({activeInstrument?.exchange})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#141e30]">
                  <span className="text-gray-400">Timeframe:</span>
                  <span className="font-mono font-bold text-purple-400">{timeframe}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#141e30]">
                  <span className="text-gray-400">Date Range:</span>
                  <span className="font-mono text-[11px] text-gray-200">
                    {startDate} → {endDate}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#141e30]">
                  <span className="text-gray-400">Replay Start:</span>
                  <span className="font-mono text-[11px] text-amber-300">{replayStartDisplay}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#141e30]">
                  <span className="text-gray-400">Starting Balance:</span>
                  <span className="font-mono font-bold text-emerald-400">{formatCurrency(balance)}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#141e30]">
                  <span className="text-gray-400">Session Mode:</span>
                  <span className="font-mono font-bold text-cyan-400 uppercase text-[11px]">{sessionMode}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#141e30]">
                  <span className="text-gray-400">Risk Model:</span>
                  <span className="font-mono text-[11px] text-white">
                    {riskMode === 'contracts'
                      ? `${riskValue} Contract${riskValue > 1 ? 's' : ''}`
                      : riskMode === 'risk-pct'
                      ? `${riskValue}% of Equity`
                      : `$${riskValue} Fixed`}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#141e30]">
                  <span className="text-gray-400">Execution / Slippage:</span>
                  <span className="font-mono text-[10px] text-gray-300">
                    ${commission}/rt · {slippage} tick slippage
                  </span>
                </div>
              </div>

              {/* Validation Alert */}
              {validationError && (
                <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-lg text-red-300 text-xs flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  disabled={!dataAvailability.available || !!validationError}
                  onClick={handleStartSession}
                  className={cn(
                    'w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center space-x-2 shadow-lg transition cursor-pointer',
                    dataAvailability.available && !validationError
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 hover:shadow-blue-500/50'
                      : 'bg-[#182338] text-gray-500 cursor-not-allowed border border-[#202d44]'
                  )}
                >
                  <span>START SESSION</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={!!validationError}
                    onClick={handleSaveOnly}
                    className="py-2 px-3 rounded-lg border border-[#1e2a42] bg-[#101726] hover:bg-[#182338] text-gray-300 hover:text-white text-xs font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-blue-400" />
                    <span>Save Session</span>
                  </button>
                  <Link
                    href="/sessions"
                    className="py-2 px-3 rounded-lg border border-[#1e2a42] bg-[#101726] hover:bg-[#182338] text-gray-400 hover:text-white text-xs font-medium transition flex items-center justify-center cursor-pointer"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function NewSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070b13] flex items-center justify-center text-blue-400 font-mono text-sm">
          Loading TradeForge Session Setup...
        </div>
      }
    >
      <NewSessionContent />
    </Suspense>
  );
}

