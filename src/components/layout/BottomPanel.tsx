'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUIStore } from '@/store/ui-store';
import { useTradingStore } from '@/store/trading-store';
import { useReplayStore } from '@/store/replay-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import { calculatePerformanceMetrics } from '@/lib/analytics/metrics-engine';
import { exportTradesToCSV, exportPerformanceReportToJSON } from '@/lib/analytics/export-service';
import { getRevealedEconomicEvents, type EconomicEvent } from '@/lib/calendar/economic-calendar';
import { EquityCurveChart } from '@/components/analytics/EquityCurveChart';
import { DrawdownChart } from '@/components/analytics/DrawdownChart';
import { PerformanceBreakdowns } from '@/components/analytics/PerformanceBreakdowns';
import { TradingCalendar } from '@/components/analytics/TradingCalendar';
import { OrderFlowTab } from '@/components/orderflow/OrderFlowTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatPnL, formatDuration } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils';
import type { PanelTab } from '@/types/common';
import type { Symbol } from '@/types/market-data';
import type { Trade } from '@/types/trading';
import {
  Briefcase,
  ListOrdered,
  Layers,
  BarChart2,
  BookOpen,
  Calendar,
  Globe,
  Download,
  Flame,
  Award,
  Shield,
  Star,
  Tag,
  Smile,
  Save,
  Clock,
  ArrowRight,
  Filter,
  Play,
  CheckCircle,
  AlertCircle,
  Zap,
} from 'lucide-react';

export function BottomPanel() {
  const bottomPanelTab = useUIStore((s) => s.bottomPanelTab);
  const setBottomPanelTab = useUIStore((s) => s.setBottomPanelTab);

  const balance = useTradingStore((s) => s.balance);
  const accountSettings = useTradingStore((s) => s.accountSettings);
  const positions = useTradingStore((s) => s.positions);
  const orders = useTradingStore((s) => s.orders);
  const closedTrades = useTradingStore((s) => s.closedTrades);
  const closePosition = useTradingStore((s) => s.closePosition);
  const cancelOrder = useTradingStore((s) => s.cancelOrder);

  const allCandles = useReplayStore((s) => s.allCandles);
  const currentIndex = useReplayStore((s) => s.currentIndex);
  const preloadCount = useReplayStore((s) => s.preloadCount);
  const jumpToTimestamp = useReplayStore((s) => s.jumpToTimestamp);
  const togglePlayPause = useReplayStore((s) => s.togglePlayPause);

  const [symbolMap, setSymbolMap] = useState<Map<string, Symbol>>(new Map());
  const [tradeFilter, setTradeFilter] = useState<'all' | 'winners' | 'losers' | 'long' | 'short'>('all');
  const [journalNotes, setJournalNotes] = useState<Record<string, { setup?: string; emotion?: string; mistake?: string; rating?: number; note?: string }>>({});

  useEffect(() => {
    marketDataService.getAllSymbols().then((list) => {
      const map = new Map<string, Symbol>();
      list.forEach((s) => map.set(s.id, s));
      setSymbolMap(map);
    });
  }, []);

  const currentCandle = allCandles[preloadCount + currentIndex] ?? null;
  const currentPrice = currentCandle ? currentCandle.close : 0;
  const currentTs = currentCandle ? currentCandle.timestamp : Date.now();

  const pendingOrders = orders.filter((o) => o.status === 'pending');

  // Quantitative Analytics Engine
  const metrics = calculatePerformanceMetrics(closedTrades, accountSettings.startingBalance);

  // Economic Events strictly filtered up to current replay timestamp (Zero Lookahead)
  const revealedEconomicEvents = useMemo(() => {
    return getRevealedEconomicEvents(currentTs);
  }, [currentTs]);

  const handleManualClose = (positionId: string, symbolId: string) => {
    const symObj = symbolMap.get(symbolId);
    if (!symObj || !currentCandle) return;
    closePosition(positionId, currentPrice, currentTs, symObj);
  };

  // Filtered trades list
  const filteredTrades = useMemo(() => {
    return closedTrades.filter((t) => {
      if (tradeFilter === 'winners') return t.netPnL > 0;
      if (tradeFilter === 'losers') return t.netPnL <= 0;
      if (tradeFilter === 'long') return t.side === 'long';
      if (tradeFilter === 'short') return t.side === 'short';
      return true;
    });
  }, [closedTrades, tradeFilter]);

  const handleJumpToTrade = (trade: Trade) => {
    jumpToTimestamp(trade.entryTime, 60);
  };

  // Time-based Analytics by Session
  const sessionBreakdown = useMemo(() => {
    let nyTrades = 0;
    let nyPnL = 0;
    let londonTrades = 0;
    let londonPnL = 0;
    let asiaTrades = 0;
    let asiaPnL = 0;

    closedTrades.forEach((t) => {
      const d = new Date(t.entryTime);
      const hourUTC = d.getUTCHours();

      if (hourUTC >= 13 && hourUTC <= 21) {
        // NY Session
        nyTrades++;
        nyPnL += t.netPnL;
      } else if (hourUTC >= 7 && hourUTC < 13) {
        // London Session
        londonTrades++;
        londonPnL += t.netPnL;
      } else {
        // Asia / Other
        asiaTrades++;
        asiaPnL += t.netPnL;
      }
    });

    return { nyTrades, nyPnL, londonTrades, londonPnL, asiaTrades, asiaPnL };
  }, [closedTrades]);

  return (
    <div className="h-full w-full bg-[#0a0e17] border-t border-[#182338] flex flex-col overflow-hidden font-mono text-xs select-none">
      <Tabs
        value={bottomPanelTab || 'positions'}
        onValueChange={(val) => setBottomPanelTab(val as PanelTab)}
        className="w-full h-full flex flex-col"
      >
        {/* Tab Headers */}
        <div className="bg-[#0c101b] border-b border-[#182338] px-3 flex items-center justify-between flex-shrink-0 h-9">
          <TabsList className="h-full bg-transparent p-0 space-x-1">
            <TabsTrigger
              value="positions"
              className="text-xs data-[state=active]:bg-[#141b2c] data-[state=active]:text-white text-gray-400 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-3 h-full flex items-center space-x-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Positions ({positions.length})</span>
            </TabsTrigger>

            <TabsTrigger
              value="orders"
              className="text-xs data-[state=active]:bg-[#141b2c] data-[state=active]:text-white text-gray-400 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-3 h-full flex items-center space-x-1.5 cursor-pointer"
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Orders ({pendingOrders.length})</span>
            </TabsTrigger>

            <TabsTrigger
              value="trades"
              className="text-xs data-[state=active]:bg-[#141b2c] data-[state=active]:text-white text-gray-400 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-3 h-full flex items-center space-x-1.5 cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Trades ({closedTrades.length})</span>
            </TabsTrigger>

            <TabsTrigger
              value="statistics"
              className="text-xs data-[state=active]:bg-[#141b2c] data-[state=active]:text-white text-gray-400 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-3 h-full flex items-center space-x-1.5 cursor-pointer"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Analytics &amp; EV</span>
            </TabsTrigger>

            <TabsTrigger
              value="calendar"
              className="text-xs data-[state=active]:bg-[#141b2c] data-[state=active]:text-white text-gray-400 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-3 h-full flex items-center space-x-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>P&amp;L Calendar</span>
            </TabsTrigger>

            <TabsTrigger
              value="economic"
              className="text-xs data-[state=active]:bg-[#141b2c] data-[state=active]:text-white text-gray-400 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-3 h-full flex items-center space-x-1.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>Economic Releases ({revealedEconomicEvents.length})</span>
            </TabsTrigger>

            <TabsTrigger
              value="journal"
              className="text-xs data-[state=active]:bg-[#141b2c] data-[state=active]:text-white text-gray-400 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 px-3 h-full flex items-center space-x-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Journal</span>
            </TabsTrigger>

            <TabsTrigger
              value="orderflow"
              className="text-xs data-[state=active]:bg-[#141b2c] data-[state=active]:text-white text-gray-400 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 px-3 h-full flex items-center space-x-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Order Flow</span>
            </TabsTrigger>
          </TabsList>

          {/* Quick Export Controls */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => exportTradesToCSV(closedTrades, 'tradeforge-trades.csv')}
              className="px-2 py-1 bg-[#141b2c] hover:bg-[#1f2b44] border border-[#202d48] text-gray-300 hover:text-white rounded text-[10px] flex items-center space-x-1 transition cursor-pointer"
            >
              <Download className="w-3 h-3 text-blue-400" />
              <span className="hidden sm:inline">CSV Log</span>
            </button>
          </div>
        </div>

        {/* 1. POSITIONS TAB */}
        <TabsContent value="positions" className="flex-1 overflow-auto p-0 m-0">
          {positions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-6">
              <Layers className="w-7 h-7 text-gray-600 mb-1.5 opacity-50" />
              <p className="text-xs font-semibold text-gray-300">NO OPEN POSITIONS</p>
              <p className="text-[11px] text-gray-500 mb-2">Execute a Market or Limit order to start a backtest trade.</p>
              <button
                onClick={togglePlayPause}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center space-x-1 cursor-pointer transition shadow-sm"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Start Replay</span>
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-[#0c101b] text-gray-400 border-b border-[#182338] sticky top-0">
                <tr>
                  <th className="p-2">Symbol</th>
                  <th className="p-2">Side</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Entry</th>
                  <th className="p-2">Current</th>
                  <th className="p-2">Stop Loss</th>
                  <th className="p-2">Take Profit</th>
                  <th className="p-2">Unrealized P&amp;L</th>
                  <th className="p-2">Duration</th>
                  <th className="p-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161f33]">
                {positions.map((pos) => {
                  const sym = symbolMap.get(pos.symbol);
                  return (
                    <tr key={pos.id} className="hover:bg-[#101726]">
                      <td className="p-2 font-bold text-white">{pos.symbol}</td>
                      <td className="p-2 font-bold">
                        <span className={pos.side === 'long' ? 'text-emerald-400' : 'text-rose-400'}>
                          {pos.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-2">{pos.quantity}</td>
                      <td className="p-2">{pos.entryPrice.toFixed(sym?.pricePrecision || 2)}</td>
                      <td className="p-2">{currentPrice.toFixed(sym?.pricePrecision || 2)}</td>
                      <td className="p-2 text-rose-400">{pos.stopLoss ? pos.stopLoss.toFixed(2) : '-'}</td>
                      <td className="p-2 text-emerald-400">{pos.takeProfit ? pos.takeProfit.toFixed(2) : '-'}</td>
                      <td className="p-2 font-bold">
                        <span className={pos.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {formatPnL(pos.netPnL)}
                        </span>
                      </td>
                      <td className="p-2 text-gray-400">{formatDuration(currentTs - pos.entryTime)}</td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => handleManualClose(pos.id, pos.symbol)}
                          className="px-2 py-0.5 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-[10px] font-bold cursor-pointer"
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </TabsContent>

        {/* 2. ORDERS TAB */}
        <TabsContent value="orders" className="flex-1 overflow-auto p-0 m-0">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-6">
              <ListOrdered className="w-7 h-7 text-gray-600 mb-1.5 opacity-50" />
              <p className="text-xs font-semibold text-gray-300">NO ACTIVE ORDERS</p>
              <p className="text-[11px] text-gray-500">Pending Limit/Stop orders will appear here during replay.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-[#0c101b] text-gray-400 border-b border-[#182338] sticky top-0">
                <tr>
                  <th className="p-2">Time</th>
                  <th className="p-2">Symbol</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Side</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Status</th>
                  <th className="p-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161f33]">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#101726]">
                    <td className="p-2 text-gray-400">{new Date(o.createdAt).toLocaleTimeString()}</td>
                    <td className="p-2 font-bold text-white">{o.symbol}</td>
                    <td className="p-2 uppercase">{o.type}</td>
                    <td className="p-2 font-bold">
                      <span className={o.side === 'long' ? 'text-emerald-400' : 'text-rose-400'}>
                        {o.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-2">{o.quantity}</td>
                    <td className="p-2">{o.price ? o.price.toFixed(2) : 'Market'}</td>
                    <td className="p-2">
                      <span
                        className={cn(
                          'px-1.5 py-0.2 rounded text-[10px] font-bold uppercase',
                          o.status === 'filled'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : o.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-gray-500/20 text-gray-400'
                        )}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      {o.status === 'pending' && (
                        <button
                          onClick={() => cancelOrder(o.id)}
                          className="px-2 py-0.5 rounded bg-[#1f283d] text-gray-400 hover:text-white text-[10px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TabsContent>

        {/* 3. TRADES TAB */}
        <TabsContent value="trades" className="flex-1 overflow-auto p-0 m-0 flex flex-col">
          {/* Sub-filter bar */}
          <div className="px-3 py-1.5 bg-[#090d17] border-b border-[#182338] flex items-center justify-between">
            <div className="flex items-center space-x-1 text-[10px]">
              <span className="text-gray-500 mr-1 flex items-center">
                <Filter className="w-3 h-3 mr-1" />
                Filter:
              </span>
              {(['all', 'winners', 'losers', 'long', 'short'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTradeFilter(f)}
                  className={cn(
                    'px-2 py-0.5 rounded capitalize cursor-pointer transition',
                    tradeFilter === f
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#141b2c]'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            <span className="text-[10px] text-gray-400">
              Showing {filteredTrades.length} of {closedTrades.length} trades
            </span>
          </div>

          {filteredTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center text-gray-500 py-6">
              <Briefcase className="w-7 h-7 text-gray-600 mb-1.5 opacity-50" />
              <p className="text-xs font-semibold text-gray-300">NO TRADES MATCH FILTER</p>
              <p className="text-[11px] text-gray-500">Completed backtest executions will be recorded here.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-[#0c101b] text-gray-400 border-b border-[#182338] sticky top-0">
                  <tr>
                    <th className="p-2">Date / Time</th>
                    <th className="p-2">Symbol</th>
                    <th className="p-2">Side</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Entry</th>
                    <th className="p-2">Exit</th>
                    <th className="p-2">Gross P&amp;L</th>
                    <th className="p-2">Net P&amp;L</th>
                    <th className="p-2">R-Multiple</th>
                    <th className="p-2">Duration</th>
                    <th className="p-2 text-right">Chart Jump</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#161f33]">
                  {filteredTrades.map((t, idx) => {
                    const sym = symbolMap.get(t.symbol);
                    return (
                      <tr key={t.id} className="hover:bg-[#101726]">
                        <td className="p-2 text-gray-300">{new Date(t.entryTime).toLocaleString()}</td>
                        <td className="p-2 font-bold text-white">{t.symbol}</td>
                        <td className="p-2 font-bold">
                          <span className={t.side === 'long' ? 'text-emerald-400' : 'text-rose-400'}>
                            {t.side.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-2">{t.quantity}</td>
                        <td className="p-2">{t.entryPrice.toFixed(sym?.pricePrecision || 2)}</td>
                        <td className="p-2">{t.exitPrice ? t.exitPrice.toFixed(sym?.pricePrecision || 2) : '-'}</td>
                        <td className="p-2">{formatPnL(t.grossPnL)}</td>
                        <td className="p-2 font-bold">
                          <span className={t.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {formatPnL(t.netPnL)}
                          </span>
                        </td>
                        <td className="p-2 text-blue-400 font-mono">
                          {t.rMultiple !== null ? `${t.rMultiple >= 0 ? '+' : ''}${t.rMultiple}R` : '-'}
                        </td>
                        <td className="p-2 text-gray-400">{t.duration ? formatDuration(t.duration) : '-'}</td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => handleJumpToTrade(t)}
                            title="Jump chart replay to this trade"
                            className="px-2 py-0.5 rounded bg-[#162035] hover:bg-blue-600 text-gray-300 hover:text-white transition text-[10px] font-bold cursor-pointer"
                          >
                            Jump ↗
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* 4. STATISTICS & ANALYTICS TAB */}
        <TabsContent value="statistics" className="flex-1 overflow-auto p-4 space-y-4 m-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-[#0d121f] border border-[#1b253c] rounded-xl">
              <span className="text-gray-400 text-[10px] block">Net Profit</span>
              <strong className={cn('text-sm block', metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {formatPnL(metrics.netProfit)}
              </strong>
            </div>

            <div className="p-3 bg-[#0d121f] border border-[#1b253c] rounded-xl">
              <span className="text-gray-400 text-[10px] block">Profit Factor</span>
              <strong className="text-sm block text-blue-400">
                {metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
              </strong>
            </div>

            <div className="p-3 bg-[#0d121f] border border-[#1b253c] rounded-xl">
              <span className="text-gray-400 text-[10px] block">Win Rate</span>
              <strong className="text-sm block text-white">
                {metrics.winRatePercent.toFixed(1)}% ({metrics.winningTrades}/{metrics.totalTrades})
              </strong>
            </div>

            <div className="p-3 bg-[#0d121f] border border-[#1b253c] rounded-xl">
              <span className="text-gray-400 text-[10px] block">Expected Value (EV)</span>
              <strong className="text-sm block text-emerald-400">
                {metrics.expectedValue >= 0 ? `+$${metrics.expectedValue.toFixed(2)}` : `-$${Math.abs(metrics.expectedValue).toFixed(2)}`} / tr
              </strong>
            </div>

            <div className="p-3 bg-[#0d121f] border border-[#1b253c] rounded-xl">
              <span className="text-gray-400 text-[10px] block">Sharpe / Sortino</span>
              <strong className="text-sm block text-purple-400">
                {metrics.sharpeRatio.toFixed(2)} / {metrics.sortinoRatio.toFixed(2)}
              </strong>
            </div>

            <div className="p-3 bg-[#0d121f] border border-[#1b253c] rounded-xl">
              <span className="text-gray-400 text-[10px] block">Max Drawdown</span>
              <strong className="text-sm block text-rose-400">
                -{formatCurrency(metrics.maxDrawdownDollars)} ({metrics.maxDrawdownPercent.toFixed(1)}%)
              </strong>
            </div>
          </div>

          {/* Time & Session Breakdown Card */}
          <div className="p-3 bg-[#0d121f] border border-[#1b253c] rounded-xl space-y-2">
            <span className="text-xs font-bold text-white block">Trading Session Breakdown</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-2.5 bg-[#111726] rounded-lg border border-[#1d273d]">
                <span className="text-gray-400 text-[10px] block font-bold">New York Session (13:30 - 21:00 UTC)</span>
                <span className={cn('text-sm font-bold block mt-0.5', sessionBreakdown.nyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                  {formatPnL(sessionBreakdown.nyPnL)}
                </span>
                <span className="text-gray-400 text-[10px]">{sessionBreakdown.nyTrades} trades</span>
              </div>

              <div className="p-2.5 bg-[#111726] rounded-lg border border-[#1d273d]">
                <span className="text-gray-400 text-[10px] block font-bold">London Session (07:00 - 13:00 UTC)</span>
                <span className={cn('text-sm font-bold block mt-0.5', sessionBreakdown.londonPnL >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                  {formatPnL(sessionBreakdown.londonPnL)}
                </span>
                <span className="text-gray-400 text-[10px]">{sessionBreakdown.londonTrades} trades</span>
              </div>

              <div className="p-2.5 bg-[#111726] rounded-lg border border-[#1d273d]">
                <span className="text-gray-400 text-[10px] block font-bold">Asia / Globex Session</span>
                <span className={cn('text-sm font-bold block mt-0.5', sessionBreakdown.asiaPnL >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                  {formatPnL(sessionBreakdown.asiaPnL)}
                </span>
                <span className="text-gray-400 text-[10px]">{sessionBreakdown.asiaTrades} trades</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#0d121f] border border-[#1b253c] rounded-xl p-3 h-52">
              <span className="text-xs font-bold text-white block mb-2">Equity Trajectory Curve</span>
              <EquityCurveChart data={metrics.equityTrajectory} startingBalance={accountSettings.startingBalance} />
            </div>

            <div className="bg-[#0d121f] border border-[#1b253c] rounded-xl p-3 h-52">
              <span className="text-xs font-bold text-white block mb-2">Underwater Drawdown (%)</span>
              <DrawdownChart data={metrics.equityTrajectory} />
            </div>
          </div>
        </TabsContent>

        {/* 5. CALENDAR TAB */}
        <TabsContent value="calendar" className="flex-1 overflow-auto p-0 m-0">
          <TradingCalendar trades={closedTrades} />
        </TabsContent>

        {/* 6. ECONOMIC CALENDAR TAB (Zero Lookahead) */}
        <TabsContent value="economic" className="flex-1 overflow-auto p-0 m-0">
          {revealedEconomicEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-6">
              <Globe className="w-7 h-7 text-gray-600 mb-1.5 opacity-50" />
              <p className="text-xs font-semibold text-gray-300">NO ECONOMIC EVENTS RELEASED YET</p>
              <p className="text-[11px] text-gray-500">Events appear dynamically as replay advances through their release timestamps.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-[#0c101b] text-gray-400 border-b border-[#182338] sticky top-0">
                <tr>
                  <th className="p-2">Date / Time (UTC)</th>
                  <th className="p-2">Currency</th>
                  <th className="p-2">Event</th>
                  <th className="p-2">Impact</th>
                  <th className="p-2">Actual</th>
                  <th className="p-2">Forecast</th>
                  <th className="p-2">Previous</th>
                  <th className="p-2">Analysis Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161f33]">
                {revealedEconomicEvents.map((e) => (
                  <tr key={e.id} className="hover:bg-[#101726]">
                    <td className="p-2 text-gray-300">{new Date(e.timestamp).toUTCString()}</td>
                    <td className="p-2 font-bold text-white">{e.currency}</td>
                    <td className="p-2 font-semibold text-gray-200">{e.event}</td>
                    <td className="p-2">
                      <span
                        className={cn(
                          'px-1.5 py-0.2 rounded text-[10px] font-bold',
                          e.impact === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        )}
                      >
                        {e.impact}
                      </span>
                    </td>
                    <td className="p-2 font-bold text-white">{e.actual}</td>
                    <td className="p-2 text-gray-400">{e.forecast}</td>
                    <td className="p-2 text-gray-400">{e.previous}</td>
                    <td className="p-2 text-gray-400 italic">{e.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TabsContent>

        {/* 7. JOURNAL TAB */}
        <TabsContent value="journal" className="flex-1 overflow-auto p-4 space-y-3 m-0">
          {closedTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-6">
              <BookOpen className="w-7 h-7 text-gray-600 mb-1.5 opacity-50" />
              <p className="text-xs font-semibold text-gray-300">NO JOURNAL LOGS YET</p>
              <p className="text-[11px] text-gray-500">Each completed trade will generate an editable journal entry for post-trade review.</p>
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl">
              {closedTrades.map((t, idx) => {
                const noteState = journalNotes[t.id] || {};
                return (
                  <div
                    key={t.id}
                    className="p-3.5 bg-[#0d121f] border border-[#1b253c] rounded-xl space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-[#182338] pb-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                            t.side === 'long'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          )}
                        >
                          Trade #{closedTrades.length - idx} · {t.side.toUpperCase()} {t.quantity} {t.symbol}
                        </span>
                        <span className="text-gray-400 text-[10px]">{new Date(t.entryTime).toLocaleString()}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={cn('font-bold', t.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                          {formatPnL(t.netPnL)}
                        </span>
                        {t.rMultiple !== null && (
                          <span className="text-blue-400 font-mono font-bold">
                            ({t.rMultiple >= 0 ? '+' : ''}{t.rMultiple}R)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-gray-400 text-[10px] mb-1">Setup / Strategy Tag</label>
                        <input
                          type="text"
                          placeholder="e.g. Opening Range Breakout, FVG"
                          value={noteState.setup ?? (t.setup || '')}
                          onChange={(e) =>
                            setJournalNotes((prev) => ({
                              ...prev,
                              [t.id]: { ...prev[t.id], setup: e.target.value },
                            }))
                          }
                          className="w-full bg-[#111726] border border-[#1b253c] rounded px-2 py-1 text-white font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 text-[10px] mb-1">Emotion State</label>
                        <input
                          type="text"
                          placeholder="e.g. Calm, Disciplined, FOMO"
                          value={noteState.emotion ?? (t.emotion || '')}
                          onChange={(e) =>
                            setJournalNotes((prev) => ({
                              ...prev,
                              [t.id]: { ...prev[t.id], emotion: e.target.value },
                            }))
                          }
                          className="w-full bg-[#111726] border border-[#1b253c] rounded px-2 py-1 text-white font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 text-[10px] mb-1">Execution Quality (Rating)</label>
                        <div className="flex items-center space-x-1 pt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                setJournalNotes((prev) => ({
                                  ...prev,
                                  [t.id]: { ...prev[t.id], rating: star },
                                }))
                              }
                              className="text-amber-400 hover:scale-110 transition cursor-pointer"
                            >
                              <Star
                                className={cn(
                                  'w-4 h-4',
                                  star <= (noteState.rating ?? 4) ? 'fill-current' : 'text-gray-600'
                                )}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-[10px] mb-1">Trade Notes &amp; Execution Review</label>
                      <textarea
                        rows={2}
                        placeholder="Log trade rationale, key levels, what went well, what went wrong..."
                        value={noteState.note ?? (t.notes || '')}
                        onChange={(e) =>
                          setJournalNotes((prev) => ({
                            ...prev,
                            [t.id]: { ...prev[t.id], note: e.target.value },
                          }))
                        }
                        className="w-full bg-[#111726] border border-[#1b253c] rounded p-2 text-white font-mono text-[11px] focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* 7. ORDER FLOW TAB */}
        <TabsContent value="orderflow" className="flex-1 overflow-hidden p-0 m-0 h-full">
          <OrderFlowTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
