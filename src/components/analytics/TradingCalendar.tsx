'use client';

import React, { useState, useMemo } from 'react';
import type { Trade } from '@/types/trading';
import { formatCurrency, formatPnL } from '@/lib/utils/formatting';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradingCalendarProps {
  trades: Trade[];
  onSelectDate?: (dateStr: string) => void;
}

export function TradingCalendar({ trades, onSelectDate }: TradingCalendarProps) {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  // Group trades by date key (YYYY-MM-DD)
  const tradesByDate = useMemo(() => {
    const map = new Map<string, { trades: Trade[]; netPnL: number; wins: number; losses: number }>();
    trades.forEach((t) => {
      const d = new Date(t.entryTime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;

      const existing = map.get(key) || { trades: [], netPnL: 0, wins: 0, losses: 0 };
      existing.trades.push(t);
      existing.netPnL += t.netPnL;
      if (t.netPnL > 0) existing.wins++;
      else existing.losses++;
      map.set(key, existing);
    });
    return map;
  }, [trades]);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const prevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    let net = 0;
    let count = 0;
    let wins = 0;
    tradesByDate.forEach((val, key) => {
      if (key.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
        net += val.netPnL;
        count += val.trades.length;
        wins += val.wins;
      }
    });
    return { net, count, winRate: count > 0 ? (wins / count) * 100 : 0 };
  }, [tradesByDate, year, month]);

  const daysArray = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      arr.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      arr.push({ day: d, key, data: tradesByDate.get(key) || null });
    }
    return arr;
  }, [firstDayOfWeek, daysInMonth, year, month, tradesByDate]);

  const selectedDayTrades = selectedDayKey ? tradesByDate.get(selectedDayKey)?.trades || [] : [];

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-4 p-4 font-mono text-xs overflow-y-auto">
      {/* Calendar Grid Container */}
      <div className="flex-1 bg-[#0c111e] border border-[#1b253c] rounded-xl p-4 flex flex-col space-y-3">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-tight">{monthName}</span>
              <div className="text-[10px] text-gray-400">
                Monthly Net: <strong className={monthlyStats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatPnL(monthlyStats.net)}</strong> · {monthlyStats.count} trade(s) · {monthlyStats.winRate.toFixed(0)}% WR
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg bg-[#141b2c] hover:bg-[#1e273f] text-gray-300 hover:text-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg bg-[#141b2c] hover:bg-[#1e273f] text-gray-300 hover:text-white cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] text-gray-500 font-bold border-b border-[#182338] pb-1.5">
          <span>SUN</span>
          <span>MON</span>
          <span>TUE</span>
          <span>WED</span>
          <span>THU</span>
          <span>FRI</span>
          <span>SAT</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 flex-1">
          {daysArray.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty-${idx}`} className="bg-transparent rounded-lg" />;
            }

            const { day, key, data } = cell;
            const isSelected = selectedDayKey === key;
            const hasTrades = data && data.trades.length > 0;
            const isProfit = data && data.netPnL > 0;
            const isLoss = data && data.netPnL < 0;

            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedDayKey(key);
                  onSelectDate?.(key);
                }}
                className={cn(
                  'h-14 rounded-lg p-1.5 flex flex-col justify-between text-left transition border cursor-pointer',
                  isSelected
                    ? 'border-blue-500 ring-1 ring-blue-500/50'
                    : 'border-[#1b253c] hover:border-[#2a3a5c]',
                  hasTrades
                    ? isProfit
                      ? 'bg-emerald-950/30 text-emerald-300'
                      : isLoss
                      ? 'bg-rose-950/30 text-rose-300'
                      : 'bg-[#111726] text-gray-300'
                    : 'bg-[#0e1424] text-gray-500'
                )}
              >
                <span className="font-bold text-[10px]">{day}</span>
                {hasTrades ? (
                  <div className="text-[9px] leading-tight text-right">
                    <span className={cn('font-bold', isProfit ? 'text-emerald-400' : 'text-rose-400')}>
                      {formatPnL(data.netPnL)}
                    </span>
                    <span className="block text-gray-400 text-[8px]">
                      {data.trades.length}t ({data.wins}W)
                    </span>
                  </div>
                ) : (
                  <span className="text-[8px] text-gray-600 block text-right">-</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Trade Details Panel */}
      <div className="w-full md:w-72 bg-[#0c111e] border border-[#1b253c] rounded-xl p-4 flex flex-col space-y-3">
        <div className="flex items-center justify-between border-b border-[#182338] pb-2">
          <span className="font-bold text-white text-xs">
            {selectedDayKey ? `Trades on ${selectedDayKey}` : 'Select a Day'}
          </span>
          <span className="text-[10px] text-gray-400">{selectedDayTrades.length} trade(s)</span>
        </div>

        {selectedDayTrades.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 text-xs p-4">
            <CalendarIcon className="w-8 h-8 text-gray-600 mb-2 opacity-50" />
            <p>Click any active day in the calendar to inspect trade logs and execution timestamps.</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[300px]">
            {selectedDayTrades.map((t, idx) => (
              <div
                key={t.id}
                className="p-2 rounded-lg bg-[#111726] border border-[#1b253c] space-y-1 text-[11px]"
              >
                <div className="flex justify-between items-center">
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded text-[10px] font-bold',
                      t.side === 'long'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    )}
                  >
                    #{idx + 1} {t.side.toUpperCase()} {t.quantity} {t.symbol}
                  </span>
                  <span className={cn('font-bold', t.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                    {formatPnL(t.netPnL)}
                  </span>
                </div>

                <div className="text-[10px] text-gray-400 flex justify-between">
                  <span>Entry: {t.entryPrice.toFixed(2)}</span>
                  <span>Exit: {t.exitPrice?.toFixed(2) || 'Open'}</span>
                </div>

                {t.rMultiple !== null && (
                  <div className="text-[9px] text-gray-400 flex justify-between">
                    <span>R: {t.rMultiple >= 0 ? '+' : ''}{t.rMultiple}R</span>
                    <span>{t.setup || 'Discretionary'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
