'use client';

import React from 'react';
import { useChartStore } from '@/store/chart-store';
import { useReplayStore } from '@/store/replay-store';
import { useIndicatorStore } from '@/store/indicator-store';
import { formatCompactNumber } from '@/lib/utils/formatting';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Symbol } from '@/types/market-data';

interface ChartLegendProps {
  symbolObj: Symbol | null;
}

export function ChartLegend({ symbolObj }: ChartLegendProps) {
  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const activeTimeframe = useChartStore((s) => s.activeTimeframe);

  const allCandles = useReplayStore((s) => s.allCandles);
  const currentIndex = useReplayStore((s) => s.currentIndex);
  const preloadCount = useReplayStore((s) => s.preloadCount);

  const activeIndicators = useIndicatorStore((s) => s.activeIndicators);
  const toggleVisibility = useIndicatorStore((s) => s.toggleVisibility);

  const currentCandle = allCandles[preloadCount + currentIndex] ?? null;

  if (!currentCandle || !symbolObj) return null;

  const isGreen = currentCandle.close >= currentCandle.open;
  const barDelta = currentCandle.close - currentCandle.open;
  const barPct = ((barDelta / currentCandle.open) * 100).toFixed(2);
  const precision = symbolObj.pricePrecision ?? 2;

  return (
    <div className="absolute top-3 left-4 z-20 pointer-events-none flex flex-col space-y-1">
      {/* Symbol & Specs Row */}
      <div className="flex items-center space-x-2 text-xs pointer-events-auto">
        <span className="font-bold text-white tracking-tight">
          {symbolObj.displayName || activeSymbol}
        </span>
        <span className="text-gray-400 font-mono text-[11px] bg-[#111726] border border-[#1b253a] px-1.5 py-0.2 rounded">
          {activeTimeframe}
        </span>
        <span className="text-gray-400 text-[11px] uppercase">
          {symbolObj.exchange}
        </span>
        {symbolObj.assetClass === 'futures' && (
          <span className="text-amber-400 text-[10px] bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded font-mono">
            Tick: {symbolObj.tickSize} (${symbolObj.tickValue.toFixed(2)})
          </span>
        )}
      </div>

      {/* Bar OHLC Values */}
      <div className="flex items-center space-x-3 text-xs font-mono text-gray-400">
        <div>
          <span>O </span>
          <span className="text-gray-200 font-semibold">{currentCandle.open.toFixed(precision)}</span>
        </div>
        <div>
          <span>H </span>
          <span className="text-gray-200 font-semibold">{currentCandle.high.toFixed(precision)}</span>
        </div>
        <div>
          <span>L </span>
          <span className="text-gray-200 font-semibold">{currentCandle.low.toFixed(precision)}</span>
        </div>
        <div>
          <span>C </span>
          <span className={cn('font-semibold', isGreen ? 'text-emerald-400' : 'text-rose-400')}>
            {currentCandle.close.toFixed(precision)}
          </span>
        </div>
        <div className="hidden sm:block">
          <span>Vol </span>
          <span className="text-gray-300">{formatCompactNumber(currentCandle.volume)}</span>
        </div>
        <div className="hidden md:block">
          <span className={cn('text-[11px] font-bold px-1.5 py-0.2 rounded', isGreen ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400')}>
            {barDelta >= 0 ? '+' : ''}{barDelta.toFixed(precision)} ({barDelta >= 0 ? '+' : ''}{barPct}%)
          </span>
        </div>
      </div>

      {/* Active Indicator Badges */}
      {activeIndicators.length > 0 && (
        <div className="flex items-center space-x-2 pt-0.5 text-[11px] font-mono pointer-events-auto">
          {activeIndicators.map((ind) => (
            <div
              key={ind.id}
              className={cn(
                'flex items-center space-x-1.5 px-1.5 py-0.5 rounded bg-[#101726]/90 border border-[#1b253a] transition shadow-xs',
                !ind.visible && 'opacity-40'
              )}
            >
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: ind.color }} />
              <span className="font-semibold text-gray-200 text-[10px]">{ind.shortName}</span>
              <button
                onClick={() => toggleVisibility(ind.id)}
                className="text-gray-400 hover:text-white cursor-pointer ml-0.5"
              >
                {ind.visible ? <Eye className="w-3 h-3 text-blue-400" /> : <EyeOff className="w-3 h-3 text-gray-500" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
