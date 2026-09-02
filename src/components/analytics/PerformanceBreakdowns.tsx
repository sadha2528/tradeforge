'use client';

import React from 'react';
import type { PerformanceMetrics, BreakdownItem } from '@/lib/analytics/metrics-engine';
import { formatCurrency, formatPnL } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils';

interface PerformanceBreakdownsProps {
  metrics: PerformanceMetrics;
}

export function PerformanceBreakdowns({ metrics }: PerformanceBreakdownsProps) {
  const { longVsShort, sessionBreakdown, dayOfWeekBreakdown } = metrics;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
      {/* Long vs Short Card */}
      <div className="bg-[#0d121f] border border-[#1b253a] rounded-xl p-3.5 space-y-3">
        <h4 className="font-bold text-white text-xs uppercase tracking-wider">Direction Breakdown</h4>
        <div className="space-y-2.5">
          <DirectionRow item={longVsShort.long} isLong={true} />
          <DirectionRow item={longVsShort.short} isLong={false} />
        </div>
      </div>

      {/* Trading Sessions Card */}
      <div className="bg-[#0d121f] border border-[#1b253a] rounded-xl p-3.5 space-y-3">
        <h4 className="font-bold text-white text-xs uppercase tracking-wider">Trading Sessions</h4>
        <div className="space-y-2">
          {Object.entries(sessionBreakdown).map(([name, item]) => (
            <div key={name} className="flex justify-between items-center text-[11px]">
              <span className="text-gray-400">{name.split(' ')[0]}</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">{item.totalTrades} tr</span>
                <span className={cn('font-semibold', item.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                  {formatPnL(item.netPnL)}
                </span>
                <span className="text-[10px] text-blue-400">{item.winRate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Day of Week Card */}
      <div className="bg-[#0d121f] border border-[#1b253a] rounded-xl p-3.5 space-y-3">
        <h4 className="font-bold text-white text-xs uppercase tracking-wider">Day of Week</h4>
        <div className="space-y-2">
          {Object.entries(dayOfWeekBreakdown).map(([day, item]) => (
            <div key={day} className="flex justify-between items-center text-[11px]">
              <span className="text-gray-400">{day.slice(0, 3)}</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">{item.totalTrades} tr</span>
                <span className={cn('font-semibold', item.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                  {formatPnL(item.netPnL)}
                </span>
                <span className="text-[10px] text-blue-400">{item.winRate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DirectionRow({ item, isLong }: { item: BreakdownItem; isLong: boolean }) {
  return (
    <div className="bg-[#111726] border border-[#1e2942] rounded-lg p-2.5 space-y-1.5">
      <div className="flex justify-between items-center">
        <span className={cn('font-bold text-xs', isLong ? 'text-emerald-400' : 'text-rose-400')}>
          {item.name.toUpperCase()} ({item.totalTrades})
        </span>
        <span className={cn('font-bold', item.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
          {formatPnL(item.netPnL)}
        </span>
      </div>
      <div className="w-full bg-[#18233a] h-1.5 rounded-full overflow-hidden flex">
        <div
          className={cn('h-full', isLong ? 'bg-emerald-500' : 'bg-rose-500')}
          style={{ width: `${item.winRate}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>Win Rate: <strong className="text-white">{item.winRate}%</strong></span>
        <span>PF: <strong className="text-blue-400">{item.profitFactor}</strong></span>
        <span>Avg R: <strong className="text-white">{item.avgR !== null ? `${item.avgR}R` : '-'}</strong></span>
      </div>
    </div>
  );
}
