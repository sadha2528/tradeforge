'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useChartStore } from '@/store/chart-store';
import { useReplayStore } from '@/store/replay-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import { generateTapePrints } from '@/lib/orderflow/orderflow-engine';
import type { Symbol } from '@/types/market-data';
import type { TapePrint } from '@/types/orderflow';
import { cn } from '@/lib/utils';
import { Clock, Filter } from 'lucide-react';

export function TimeAndSales() {
  const [symbolObj, setSymbolObj] = useState<Symbol | null>(null);
  const [minSizeFilter, setMinSizeFilter] = useState<number>(1);

  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const allCandles = useReplayStore((s) => s.allCandles);
  const currentIndex = useReplayStore((s) => s.currentIndex);
  const preloadCount = useReplayStore((s) => s.preloadCount);

  useEffect(() => {
    marketDataService.getSymbol(activeSymbol).then(setSymbolObj);
  }, [activeSymbol]);

  const currentCandle = allCandles[preloadCount + currentIndex] ?? null;

  // Generate tape prints for current candle
  const tapePrints: TapePrint[] = useMemo(() => {
    if (!symbolObj || !currentCandle) return [];
    return generateTapePrints(currentCandle, symbolObj, 25);
  }, [currentCandle, symbolObj]);

  const filteredPrints = useMemo(() => {
    return tapePrints.filter((p) => p.size >= minSizeFilter);
  }, [tapePrints, minSizeFilter]);

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0d14] text-xs font-mono select-none overflow-hidden p-2.5">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1b2234] shrink-0">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-bold text-white text-[12px]">Time & Sales (Tape)</span>
        </div>

        {/* Size Filter Pills */}
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-gray-500">Min Size:</span>
          {[1, 5, 10, 20].map((sz) => (
            <button
              key={sz}
              onClick={() => setMinSizeFilter(sz)}
              className={cn(
                'px-1.5 py-0.5 rounded cursor-pointer transition font-bold',
                minSizeFilter === sz
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white bg-[#141a29]'
              )}
            >
              {sz}+
            </button>
          ))}
        </div>
      </div>

      {/* ── TABLE HEADER ── */}
      <div className="grid grid-cols-4 text-[10px] text-gray-500 font-bold py-1.5 border-b border-[#161c2b] shrink-0">
        <div>Time (ET)</div>
        <div className="text-right">Price</div>
        <div className="text-right">Size</div>
        <div className="text-center">Side</div>
      </div>

      {/* ── STREAMING PRINTS ROWS ── */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#131826]/60">
        {filteredPrints.length === 0 ? (
          <div className="text-center text-gray-600 py-6 text-xs">No prints matching filter</div>
        ) : (
          filteredPrints.map((print) => {
            const isBuy = print.side === 'buy';
            const isBlock = print.size >= 10;
            const timeStr = new Date(print.timestamp).toLocaleTimeString('en-US', {
              timeZone: 'America/New_York',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            });

            return (
              <div
                key={print.id}
                className={cn(
                  'grid grid-cols-4 text-[11px] py-1 items-center hover:bg-[#131a2a] transition-colors',
                  isBlock && (isBuy ? 'bg-emerald-950/20' : 'bg-rose-950/20')
                )}
              >
                {/* Time */}
                <div className="text-gray-400 text-[10px]">{timeStr}</div>

                {/* Price */}
                <div className={cn('text-right font-bold', isBuy ? 'text-emerald-400' : 'text-rose-400')}>
                  {print.price.toFixed(symbolObj?.pricePrecision || 2)}
                </div>

                {/* Size */}
                <div className="text-right font-bold">
                  <span
                    className={cn(
                      isBlock
                        ? isBuy
                          ? 'bg-emerald-600/30 text-emerald-300 px-1 rounded-xs'
                          : 'bg-rose-600/30 text-rose-300 px-1 rounded-xs'
                        : 'text-gray-200'
                    )}
                  >
                    {print.size}
                  </span>
                </div>

                {/* Side */}
                <div className="text-center">
                  <span
                    className={cn(
                      'text-[9px] px-1 py-0.2 rounded font-black',
                      isBuy ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                    )}
                  >
                    {print.side.toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
