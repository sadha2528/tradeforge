'use client';

import React, { useMemo, useState } from 'react';
import { useChartStore } from '@/store/chart-store';
import { useReplayStore } from '@/store/replay-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import { generateSessionFootprints } from '@/lib/orderflow/orderflow-engine';
import type { Symbol } from '@/types/market-data';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';

export function CVDChart() {
  const [symbolObj, setSymbolObj] = useState<Symbol | null>(null);
  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const allCandles = useReplayStore((s) => s.allCandles);
  const currentIndex = useReplayStore((s) => s.currentIndex);
  const preloadCount = useReplayStore((s) => s.preloadCount);

  React.useEffect(() => {
    marketDataService.getSymbol(activeSymbol).then(setSymbolObj);
  }, [activeSymbol]);

  const visibleCandles = useMemo(() => {
    return allCandles.slice(0, preloadCount + currentIndex + 1);
  }, [allCandles, preloadCount, currentIndex]);

  const { cvdPoints, currentDelta, totalCumDelta, minCumDelta, maxCumDelta, isDivergence } = useMemo(() => {
    if (!symbolObj || visibleCandles.length === 0) {
      return { cvdPoints: [], currentDelta: 0, totalCumDelta: 0, minCumDelta: 0, maxCumDelta: 0, isDivergence: false };
    }

    const { cvdPoints: points } = generateSessionFootprints(visibleCandles, symbolObj);
    const last = points[points.length - 1];
    const currDelta = last ? last.delta : 0;
    const totCum = last ? last.cumDelta : 0;

    let minCum = 0;
    let maxCum = 0;
    for (const p of points) {
      if (p.cumDelta < minCum) minCum = p.cumDelta;
      if (p.cumDelta > maxCum) maxCum = p.cumDelta;
    }

    // Detect simple divergence on last 5 bars:
    // e.g. Price went up but CVD went down (Bearish Absorption)
    let divergence = false;
    if (visibleCandles.length >= 5 && points.length >= 5) {
      const priceDelta = visibleCandles[visibleCandles.length - 1].close - visibleCandles[visibleCandles.length - 5].close;
      const cvdDelta = totCum - points[points.length - 5].cumDelta;
      if ((priceDelta > 0 && cvdDelta < 0) || (priceDelta < 0 && cvdDelta > 0)) {
        divergence = true;
      }
    }

    return {
      cvdPoints: points,
      currentDelta: currDelta,
      totalCumDelta: totCum,
      minCumDelta: minCum,
      maxCumDelta: maxCum,
      isDivergence: divergence,
    };
  }, [visibleCandles, symbolObj]);

  // Display only last 60 points for clear visualization
  const displayPoints = useMemo(() => cvdPoints.slice(-60), [cvdPoints]);

  const maxVal = Math.max(1, Math.abs(maxCumDelta), Math.abs(minCumDelta));

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0d14] text-xs font-mono p-3 select-none">
      {/* ── METRICS SUMMARY HEADER ── */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1b2234] shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold text-white text-[12px]">Cumulative Volume Delta (CVD)</span>
          </div>
          {isDivergence && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold animate-pulse">
              <AlertCircle className="w-3 h-3" />
              <span>Absorption Divergence</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <div>
            <span className="text-gray-500">Bar Delta: </span>
            <span className={cn('font-bold', currentDelta >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {currentDelta >= 0 ? '+' : ''}{currentDelta.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Session Delta: </span>
            <span className={cn('font-bold', totalCumDelta >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {totalCumDelta >= 0 ? '+' : ''}{totalCumDelta.toLocaleString()}
            </span>
          </div>
          <div className="hidden sm:block">
            <span className="text-gray-500">Max / Min: </span>
            <span className="text-emerald-400 font-bold">+{maxCumDelta.toLocaleString()}</span>
            <span className="text-gray-600"> / </span>
            <span className="text-rose-400 font-bold">{minCumDelta.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── CVD VISUALIZATION CANVAS / SVG ── */}
      <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center pt-2">
        {displayPoints.length === 0 ? (
          <span className="text-gray-600 text-xs">Waiting for candle data...</span>
        ) : (
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 160">
            <defs>
              <linearGradient id="cvdGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Zero Line */}
            <line x1="0" y1="80" x2="600" y2="80" stroke="#1f293d" strokeDasharray="3 3" strokeWidth="1" />

            {/* Delta Bars (Histogram in Background) */}
            {displayPoints.map((pt, i) => {
              const x = (i / Math.max(1, displayPoints.length - 1)) * 580 + 10;
              const barH = Math.min(60, (Math.abs(pt.delta) / Math.max(1, maxVal * 0.4)) * 60);
              const y = pt.delta >= 0 ? 80 - barH : 80;
              return (
                <rect
                  key={i}
                  x={x - 3}
                  y={y}
                  width="6"
                  height={Math.max(2, barH)}
                  fill={pt.delta >= 0 ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)'}
                  rx="1"
                />
              );
            })}

            {/* CVD Line Path */}
            <path
              d={displayPoints
                .map((pt, i) => {
                  const x = (i / Math.max(1, displayPoints.length - 1)) * 580 + 10;
                  // Map cumDelta into 0..160 where 80 is zero
                  const y = 80 - (pt.cumDelta / maxVal) * 70;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
            />
          </svg>
        )}
      </div>

      {/* ── FOOTER LEGEND ── */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>CVD Line</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-emerald-500/60" />
            <span>Buyer Delta</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-rose-500/60" />
            <span>Seller Delta</span>
          </span>
        </div>
        <span>Last {displayPoints.length} bars</span>
      </div>
    </div>
  );
}
