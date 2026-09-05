'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { CVDChart } from './CVDChart';
import { TimeAndSales } from './TimeAndSales';
import { useChartStore } from '@/store/chart-store';
import { useReplayStore } from '@/store/replay-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import {
  generateSessionFootprints,
  calculateVolumeProfile,
} from '@/lib/orderflow/orderflow-engine';
import type { Symbol } from '@/types/market-data';
import { cn } from '@/lib/utils';
import {
  Activity,
  Layers,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Shield,
  Zap,
} from 'lucide-react';

export function OrderFlowTab() {
  const [symbolObj, setSymbolObj] = useState<Symbol | null>(null);

  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const showFootprint = useChartStore((s) => s.showFootprint);
  const showVolumeProfile = useChartStore((s) => s.showVolumeProfile);
  const showDOM = useChartStore((s) => s.showDOM);
  const toggleFootprint = useChartStore((s) => s.toggleFootprint);
  const toggleVolumeProfile = useChartStore((s) => s.toggleVolumeProfile);
  const toggleDOM = useChartStore((s) => s.toggleDOM);

  const allCandles = useReplayStore((s) => s.allCandles);
  const currentIndex = useReplayStore((s) => s.currentIndex);
  const preloadCount = useReplayStore((s) => s.preloadCount);

  useEffect(() => {
    marketDataService.getSymbol(activeSymbol).then(setSymbolObj);
  }, [activeSymbol]);

  const visibleCandles = useMemo(() => {
    return allCandles.slice(0, preloadCount + currentIndex + 1);
  }, [allCandles, preloadCount, currentIndex]);

  const { totalVolume, totalDelta, buyVolume, sellVolume, pocPrice, vahPrice, valPrice } = useMemo(() => {
    if (!symbolObj || visibleCandles.length === 0) {
      return { totalVolume: 0, totalDelta: 0, buyVolume: 0, sellVolume: 0, pocPrice: 0, vahPrice: 0, valPrice: 0 };
    }
    const { footprints } = generateSessionFootprints(visibleCandles, symbolObj);
    const vp = calculateVolumeProfile(footprints, symbolObj, 70);

    let totVol = 0;
    let totDelta = 0;
    let totBuy = 0;
    let totSell = 0;

    for (const fp of footprints) {
      totVol += fp.totalVolume;
      totDelta += fp.delta;
      for (const lvl of fp.levels) {
        totBuy += lvl.askVolume;
        totSell += lvl.bidVolume;
      }
    }

    return {
      totalVolume: totVol,
      totalDelta: totDelta,
      buyVolume: totBuy,
      sellVolume: totSell,
      pocPrice: vp.poc,
      vahPrice: vp.vah,
      valPrice: vp.val,
    };
  }, [visibleCandles, symbolObj]);

  const buyPct = totalVolume > 0 ? ((buyVolume / totalVolume) * 100).toFixed(1) : '50.0';
  const sellPct = totalVolume > 0 ? ((sellVolume / totalVolume) * 100).toFixed(1) : '50.0';
  const deltaPct = totalVolume > 0 ? ((totalDelta / totalVolume) * 100).toFixed(1) : '0.0';

  return (
    <div className="flex flex-col h-full w-full bg-[#080b12] text-xs font-mono select-none overflow-hidden">
      {/* ── TOP ORDER FLOW CONTROL STRIP ── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d121e] border-b border-[#1b2234] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-white text-[12px]">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Order Flow Suite</span>
            <span className="text-gray-500 font-normal">({activeSymbol})</span>
          </div>

          <div className="w-px h-4 bg-[#232c42]" />

          {/* Quick On-Chart Toggles */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleFootprint}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-bold border transition cursor-pointer flex items-center gap-1',
                showFootprint
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                  : 'text-gray-400 hover:text-white border-[#1c2436] bg-[#121826]'
              )}
            >
              <span>Footprint</span>
              {showFootprint && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
            </button>

            <button
              onClick={toggleVolumeProfile}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-bold border transition cursor-pointer flex items-center gap-1',
                showVolumeProfile
                  ? 'bg-amber-600/20 text-amber-400 border-amber-500/40'
                  : 'text-gray-400 hover:text-white border-[#1c2436] bg-[#121826]'
              )}
            >
              <span>Volume Profile</span>
              {showVolumeProfile && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
            </button>

            <button
              onClick={toggleDOM}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-bold border transition cursor-pointer flex items-center gap-1',
                showDOM
                  ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/40'
                  : 'text-gray-400 hover:text-white border-[#1c2436] bg-[#121826]'
              )}
            >
              <span>DOM Ladder</span>
              {showDOM && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
            </button>
          </div>
        </div>

        {/* Key Auction Metrics */}
        <div className="flex items-center gap-4 text-[11px]">
          <div>
            <span className="text-gray-500">Session POC: </span>
            <span className="text-amber-400 font-bold">{pocPrice}</span>
          </div>
          <div>
            <span className="text-gray-500">VAH / VAL: </span>
            <span className="text-sky-400 font-bold">{vahPrice}</span>
            <span className="text-gray-600"> / </span>
            <span className="text-sky-400 font-bold">{valPrice}</span>
          </div>
          <div>
            <span className="text-gray-500">Delta %: </span>
            <span className={cn('font-bold', totalDelta >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {totalDelta >= 0 ? '+' : ''}{deltaPct}%
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN ORDER FLOW WORKSPACE (CVD + Tape) ── */}
      <div className="flex-1 grid grid-cols-12 divide-x divide-[#1b2234] overflow-hidden">
        {/* CVD Sub-chart (8 cols) */}
        <div className="col-span-8 h-full overflow-hidden flex flex-col">
          <CVDChart />
        </div>

        {/* Time & Sales (4 cols) */}
        <div className="col-span-4 h-full overflow-hidden flex flex-col">
          <TimeAndSales />
        </div>
      </div>
    </div>
  );
}
