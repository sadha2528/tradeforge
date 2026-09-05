'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  FolderKanban,
  Plus,
  Play,
  RotateCcw,
  Copy,
  Trash2,
  Edit,
  Calendar,
  DollarSign,
  Award,
  Search,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Shield,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useSessionStore } from '@/store/session-store';
import { useChartStore } from '@/store/chart-store';
import { useTradingStore } from '@/store/trading-store';
import { formatCurrency, formatTimestamp } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils';
import type { BacktestSession, SessionMode } from '@/types/common';

export default function SessionsPage() {
  const router = useRouter();
  const {
    sessions,
    currentSession,
    setCurrentSession,
    duplicateSession,
    deleteSession,
    restartSession,
  } = useSessionStore();

  const setActiveSymbol = useChartStore((s) => s.setActiveSymbol);
  const setActiveTimeframe = useChartStore((s) => s.setActiveTimeframe);
  const updateAccountSettings = useTradingStore((s) => s.updateAccountSettings);
  const resetAccount = useTradingStore((s) => s.resetAccount);

  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | SessionMode>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [restartConfirmId, setRestartConfirmId] = useState<string | null>(null);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.strategyName && s.strategyName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesMode = modeFilter === 'all' || s.mode === modeFilter;
      return matchesSearch && matchesMode;
    });
  }, [sessions, searchQuery, modeFilter]);

  // Aggregate stats
  const totalTrades = useMemo(() => {
    return sessions.reduce((acc, s) => acc + (s.tradesCount || 0), 0);
  }, [sessions]);

  const avgWinRate = useMemo(() => {
    const sessionsWithTrades = sessions.filter((s) => (s.tradesCount || 0) > 0);
    if (sessionsWithTrades.length === 0) return 0;
    const totalWr = sessionsWithTrades.reduce((acc, s) => acc + (s.winRate || 0), 0);
    return Math.round(totalWr / sessionsWithTrades.length);
  }, [sessions]);

  // Launch / Resume session handler
  const handleResumeSession = (session: BacktestSession) => {
    setCurrentSession(session);
    setActiveSymbol(session.symbol);
    setActiveTimeframe(session.timeframe);

    updateAccountSettings({
      startingBalance: session.startingBalance,
      commission: session.commission ?? 2.50,
      slippage: session.slippage ?? 0,
      executionAssumption: session.sameCandlePolicy ?? 'conservative',
      riskPerTrade: session.riskMode === 'risk-pct' ? (session.riskValue ?? 1) : 1,
      positionSizingMethod:
        session.riskMode === 'contracts'
          ? 'fixed-quantity'
          : session.riskMode === 'fixed-dollar'
          ? 'fixed-dollar'
          : 'percentage-risk',
    });

    router.push('/platform');
  };

  // Restart session handler
  const handleRestartSession = (id: string) => {
    const restarted = restartSession(id);
    setRestartConfirmId(null);
    if (restarted && currentSession?.id === id) {
      resetAccount();
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-gray-200 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Header */}
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
          <span className="text-xs font-mono font-medium text-gray-300">
            SESSIONS DASHBOARD
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/session/new"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Session</span>
          </Link>
          <Link
            href="/platform"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#1e2a42] bg-[#101726] hover:bg-[#182338] text-gray-300 hover:text-white text-xs font-medium transition"
          >
            <span>Launch Terminal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Title & Overview Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-3">
              <span>Saved Backtest Sessions</span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#152033] border border-[#20304c] text-blue-400">
                {sessions.length} TOTAL
              </span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Resume where you left off, review simulated trade performance, or spin up new replay scenarios.
            </p>
          </div>

          <Link
            href="/session/new"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 transition self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Session</span>
          </Link>
        </div>

        {/* Stats Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#0e1422] border border-[#1b263b] rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Active Workspace</div>
            <div className="text-lg font-bold font-mono text-white mt-1 truncate">
              {currentSession ? currentSession.symbol : 'None'}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 truncate">
              {currentSession ? currentSession.name : 'Select or start a session'}
            </div>
          </div>

          <div className="bg-[#0e1422] border border-[#1b263b] rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Total Sessions</div>
            <div className="text-lg font-bold font-mono text-blue-400 mt-1">{sessions.length}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Stored locally & synchronized</div>
          </div>

          <div className="bg-[#0e1422] border border-[#1b263b] rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Simulated Trades</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">{totalTrades}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Across all saved sessions</div>
          </div>

          <div className="bg-[#0e1422] border border-[#1b263b] rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Aggregate Win Rate</div>
            <div className="text-lg font-bold font-mono text-purple-400 mt-1">
              {avgWinRate > 0 ? `${avgWinRate}%` : 'N/A'}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">Tested strategy executions</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0e1422] border border-[#1b263b] rounded-xl p-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by session name, symbol, strategy..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#090d17] border border-[#202d44] focus:border-blue-500 rounded-lg text-xs font-mono text-white placeholder-gray-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-1.5 self-end sm:self-auto overflow-x-auto text-xs">
            {[
              { id: 'all', label: 'All Modes' },
              { id: 'manual', label: 'Manual' },
              { id: 'prop-firm', label: 'Prop Firm' },
              { id: 'free-replay', label: 'Free Replay' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setModeFilter(tab.id as any)}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-medium text-xs transition cursor-pointer',
                  modeFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-400 hover:text-white hover:bg-[#141d2e]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions Grid */}
        {filteredSessions.length === 0 ? (
          <div className="bg-[#0e1422] border border-[#1b263b] rounded-2xl p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#162136] flex items-center justify-center text-blue-400 mx-auto">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">No sessions found</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                {searchQuery || modeFilter !== 'all'
                  ? 'No backtesting sessions matched your search filters.'
                  : 'You have not created any historical replay sessions yet. Start your first session now!'}
              </p>
            </div>
            <Link
              href="/session/new"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Session</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSessions.map((session) => {
              const isActive = currentSession?.id === session.id;
              const startDateStr = new Date(session.startDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const endDateStr = new Date(session.endDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={session.id}
                  className={cn(
                    'bg-[#0e1422] border rounded-xl p-5 shadow-md flex flex-col justify-between transition hover:border-[#2a3a5c]',
                    isActive
                      ? 'border-blue-500/80 ring-1 ring-blue-500/40 bg-gradient-to-b from-[#10192e] to-[#0e1422]'
                      : 'border-[#1b263b]'
                  )}
                >
                  <div className="space-y-3">
                    {/* Header Row: Symbol + Mode + Active badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm text-white bg-[#152033] px-2 py-0.5 rounded border border-[#21304b]">
                          {session.symbol}
                        </span>
                        <span className="font-mono font-bold text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                          {session.timeframe}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/20">
                          {session.mode || 'manual'}
                        </span>
                      </div>

                      {isActive && (
                        <span className="flex items-center space-x-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" />
                          <span>ACTIVE</span>
                        </span>
                      )}
                    </div>

                    {/* Session Name & Strategy */}
                    <div>
                      <h3 className="font-bold text-sm text-white leading-snug line-clamp-1">{session.name}</h3>
                      {session.strategyName && (
                        <div className="text-[11px] text-blue-400 font-mono mt-0.5 truncate">
                          {session.strategyName}
                        </div>
                      )}
                      {session.description && (
                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                          {session.description}
                        </p>
                      )}
                    </div>

                    {/* Metadata Specs Grid */}
                    <div className="bg-[#090d17] border border-[#182337] rounded-lg p-2.5 grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-gray-500 text-[10px] uppercase block">Capital</span>
                        <span className="text-emerald-400 font-bold">{formatCurrency(session.startingBalance)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[10px] uppercase block">Risk Model</span>
                        <span className="text-gray-300">
                          {session.riskMode === 'risk-pct'
                            ? `${session.riskValue ?? 1}% eq`
                            : session.riskMode === 'fixed-dollar'
                            ? `$${session.riskValue ?? 500}`
                            : `${session.riskValue ?? 1} ct`}
                        </span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-[#131c2d] flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">Dates:</span>
                        <span className="text-gray-300">
                          {startDateStr} → {endDateStr}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">Trades / Win Rate:</span>
                        <span className="text-gray-300">
                          {session.tradesCount || 0} trades ·{' '}
                          <span className="text-purple-400 font-bold">{session.winRate || 0}%</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-4 border-t border-[#162134] mt-4 space-y-2">
                    {/* Confirmation Modals / Alerts if triggered */}
                    {restartConfirmId === session.id && (
                      <div className="p-2.5 bg-amber-950/40 border border-amber-500/50 rounded-lg text-xs space-y-2 mb-2">
                        <p className="text-amber-300 text-[11px]">
                          Reset session progress back to replay start position? All simulated trades will be reset.
                        </p>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleRestartSession(session.id)}
                            className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-[10px]"
                          >
                            Yes, Reset
                          </button>
                          <button
                            onClick={() => setRestartConfirmId(null)}
                            className="px-2 py-1 bg-[#1a2336] text-gray-300 rounded text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {deleteConfirmId === session.id && (
                      <div className="p-2.5 bg-red-950/40 border border-red-500/50 rounded-lg text-xs space-y-2 mb-2">
                        <p className="text-red-300 text-[11px]">
                          Are you sure you want to permanently delete this session?
                        </p>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              deleteSession(session.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-[10px]"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 bg-[#1a2336] text-gray-300 rounded text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleResumeSession(session)}
                        className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/20 transition cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume</span>
                      </button>

                      <button
                        onClick={() => setRestartConfirmId(session.id)}
                        title="Restart Session"
                        className="p-2 rounded-lg border border-[#1e2a42] bg-[#101726] hover:bg-[#182338] text-gray-400 hover:text-white transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => router.push(`/session/new?edit=${session.id}`)}
                        title="Edit Session Settings"
                        className="p-2 rounded-lg border border-[#1e2a42] bg-[#101726] hover:bg-[#182338] text-gray-400 hover:text-white transition cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => duplicateSession(session.id)}
                        title="Duplicate Session"
                        className="p-2 rounded-lg border border-[#1e2a42] bg-[#101726] hover:bg-[#182338] text-gray-400 hover:text-white transition cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(session.id)}
                        title="Delete Session"
                        className="p-2 rounded-lg border border-[#1e2a42] bg-[#101726] hover:bg-red-950/40 text-gray-400 hover:text-red-400 hover:border-red-500/40 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
