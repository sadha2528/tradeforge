'use client';

import React, { useMemo } from 'react';
import { useChartStore } from '@/store/chart-store';
import { useReplayStore } from '@/store/replay-store';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface PriceScaleControlsProps {
  className?: string;
}

export function PriceScaleControls({ className }: PriceScaleControlsProps) {
  const priceScaleMode = useChartStore((s) => s.priceScaleMode);
  const toggleAutoScale = useChartStore((s) => s.toggleAutoScale);
  const toggleLogScale = useChartStore((s) => s.toggleLogScale);
  const togglePercentageScale = useChartStore((s) => s.togglePercentageScale);
  const isCountdownVisible = useChartStore((s) => s.isCountdownVisible);

  const activeTimeframe = useChartStore((s) => s.activeTimeframe);
  const allCandles = useReplayStore((s) => s.allCandles);
  const currentIndex = useReplayStore((s) => s.currentIndex);
  const preloadCount = useReplayStore((s) => s.preloadCount);

  // Current active candle
  const currentCandle = allCandles[preloadCount + currentIndex] ?? null;

  // Calculate countdown time remaining for current candle
  const countdownFormatted = useMemo(() => {
    if (!currentCandle || !isCountdownVisible) return null;

    // Timeframe duration in ms
    let tfMs = 5 * 60 * 1000;
    if (activeTimeframe === '1m') tfMs = 1 * 60 * 1000;
    else if (activeTimeframe === '5m') tfMs = 5 * 60 * 1000;
    else if (activeTimeframe === '15m') tfMs = 15 * 60 * 1000;
    else if (activeTimeframe === '30m') tfMs = 30 * 60 * 1000;
    else if (activeTimeframe === '1h') tfMs = 60 * 60 * 1000;
    else if (activeTimeframe === '4h') tfMs = 4 * 60 * 60 * 1000;
    else if (activeTimeframe === '1D') tfMs = 24 * 60 * 60 * 1000;

    // Since in replay time is discrete per bar, simulate remaining time or show bar duration
    const remainingSec = Math.floor((tfMs / 1000) * 0.42); // estimated remaining slice
    const mins = Math.floor(remainingSec / 60);
    const secs = remainingSec % 60;

    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [currentCandle, isCountdownVisible, activeTimeframe]);

  return (
    <div
      className={cn(
        'absolute bottom-8 right-16 z-25 flex items-center gap-1 font-mono text-[10px] select-none pointer-events-auto',
        className
      )}
    >
      {/* ── COUNTDOWN TO BAR CLOSE ── */}
      {countdownFormatted && (
        <div
          title="Countdown to bar close"
          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#161c28]/95 border border-[#252d40] text-amber-300 font-bold shadow-md shadow-black/40 backdrop-blur-xs"
        >
          <Clock className="w-2.5 h-2.5 text-amber-400" />
          <span>{countdownFormatted}</span>
        </div>
      )}

      {/* ── PRICE SCALE BUTTONS (Auto, Log, %) ── */}
      <div className="flex items-center gap-0.5 p-0.5 rounded bg-[#131722]/95 border border-[#252d40] shadow-md shadow-black/40 backdrop-blur-xs">
        {/* Auto Scale Button */}
        <button
          onClick={toggleAutoScale}
          title="Auto scale (Toggle)"
          className={cn(
            'px-1.5 py-0.5 rounded font-bold cursor-pointer transition text-[10px]',
            priceScaleMode.autoScale
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-400 hover:text-white hover:bg-[#1c2333]'
          )}
        >
          auto
        </button>

        {/* Log Scale Button */}
        <button
          onClick={toggleLogScale}
          title="Logarithmic scale (Toggle)"
          className={cn(
            'px-1.5 py-0.5 rounded font-bold cursor-pointer transition text-[10px]',
            priceScaleMode.logScale
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-400 hover:text-white hover:bg-[#1c2333]'
          )}
        >
          log
        </button>

        {/* Percentage Scale Button */}
        <button
          onClick={togglePercentageScale}
          title="Percentage scale (Toggle)"
          className={cn(
            'px-1.5 py-0.5 rounded font-bold cursor-pointer transition text-[10px]',
            priceScaleMode.percentageScale
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-400 hover:text-white hover:bg-[#1c2333]'
          )}
        >
          %
        </button>
      </div>
    </div>
  );
}
