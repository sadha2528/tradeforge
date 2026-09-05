'use client';

import React, { useEffect, useRef } from 'react';
import { useChartStore } from '@/store/chart-store';
import { useTradingStore } from '@/store/trading-store';
import { useReplayStore } from '@/store/replay-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import { ChartManager } from '@/lib/chart/chart-manager';
import type { ChartStyle } from '@/types/chart';
import type { Symbol } from '@/types/market-data';
import { cn } from '@/lib/utils';
import {
  RotateCcw,
  Maximize2,
  ArrowUpRight,
  ArrowDownRight,
  CandlestickChart,
  BarChart2,
  LineChart,
  Layers,
  Camera,
  Check,
  Clock,
  Eye,
  Sliders,
} from 'lucide-react';

interface ChartContextMenuProps {
  x: number;
  y: number;
  price: number;
  chartManager: ChartManager | null;
  onClose: () => void;
}

export function ChartContextMenu({
  x,
  y,
  price,
  chartManager,
  onClose,
}: ChartContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [symbolObj, setSymbolObj] = React.useState<Symbol | null>(null);

  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const chartStyle = useChartStore((s) => s.chartStyle);
  const setChartStyle = useChartStore((s) => s.setChartStyle);
  const priceScaleMode = useChartStore((s) => s.priceScaleMode);
  const toggleInvertScale = useChartStore((s) => s.toggleInvertScale);
  const isCountdownVisible = useChartStore((s) => s.isCountdownVisible);
  const toggleCountdown = useChartStore((s) => s.toggleCountdown);

  const allCandles = useReplayStore((s) => s.allCandles);
  const currentIndex = useReplayStore((s) => s.currentIndex);
  const preloadCount = useReplayStore((s) => s.preloadCount);
  const placePendingOrder = useTradingStore((s) => s.placePendingOrder);

  useEffect(() => {
    marketDataService.getSymbol(activeSymbol).then(setSymbolObj);
  }, [activeSymbol]);

  const currentCandle = allCandles[preloadCount + currentIndex] ?? null;

  // Close on outside click or escape
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Adjust position to stay inside viewport
  const posX = Math.min(x, window.innerWidth - 240);
  const posY = Math.min(y, window.innerHeight - 340);

  const handleReset = () => {
    chartManager?.resetPriceScale();
    onClose();
  };

  const handleFit = () => {
    chartManager?.fitContent();
    onClose();
  };

  const handleBuyLimit = () => {
    if (!symbolObj || !currentCandle) return;
    placePendingOrder({
      symbol: symbolObj,
      side: 'long',
      type: 'limit',
      price: Number(price.toFixed(symbolObj.pricePrecision || 2)),
      quantity: 1,
      timestamp: currentCandle.timestamp,
    });
    onClose();
  };

  const handleSellLimit = () => {
    if (!symbolObj || !currentCandle) return;
    placePendingOrder({
      symbol: symbolObj,
      side: 'short',
      type: 'limit',
      price: Number(price.toFixed(symbolObj.pricePrecision || 2)),
      quantity: 1,
      timestamp: currentCandle.timestamp,
    });
    onClose();
  };

  const handleScreenshot = () => {
    const dataUrl = chartManager?.takeScreenshot();
    if (dataUrl) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `tradeforge-${activeSymbol}-${Date.now()}.png`;
      a.click();
    }
    onClose();
  };

  const formattedPrice = price.toFixed(symbolObj?.pricePrecision || 2);

  return (
    <div
      ref={menuRef}
      style={{ top: posY, left: posX }}
      className="fixed z-50 w-56 bg-[#131722] border border-[#252d42] rounded-xl shadow-2xl py-1.5 text-xs font-mono text-gray-200 select-none backdrop-blur-md"
    >
      {/* Price Header / Order Placement */}
      <div className="px-3 py-1 text-[10px] text-gray-500 font-bold border-b border-[#1e2538] uppercase tracking-wider flex justify-between items-center">
        <span>TradingView Actions</span>
        <span className="text-blue-400 font-bold">{formattedPrice}</span>
      </div>

      <button
        onClick={handleBuyLimit}
        className="w-full px-3 py-1.5 text-left hover:bg-[#1b2234] flex items-center justify-between text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Buy Limit @ {formattedPrice}</span>
        </div>
      </button>

      <button
        onClick={handleSellLimit}
        className="w-full px-3 py-1.5 text-left hover:bg-[#1b2234] flex items-center justify-between text-rose-400 hover:text-rose-300 transition cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <ArrowDownRight className="w-3.5 h-3.5" />
          <span>Sell Limit @ {formattedPrice}</span>
        </div>
      </button>

      <div className="my-1 border-t border-[#1e2538]" />

      {/* Chart Navigation */}
      <button
        onClick={handleReset}
        className="w-full px-3 py-1.5 text-left hover:bg-[#1b2234] flex items-center justify-between text-gray-300 hover:text-white transition cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
          <span>Reset Price Scale</span>
        </div>
        <span className="text-[10px] text-gray-500">Alt+R</span>
      </button>

      <button
        onClick={handleFit}
        className="w-full px-3 py-1.5 text-left hover:bg-[#1b2234] flex items-center justify-between text-gray-300 hover:text-white transition cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Auto-Fit Content</span>
        </div>
      </button>

      <button
        onClick={() => {
          toggleInvertScale();
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-[#1b2234] flex items-center justify-between text-gray-300 hover:text-white transition cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Invert Scale</span>
        </div>
        {priceScaleMode.inverted && <Check className="w-3.5 h-3.5 text-amber-400" />}
      </button>

      <div className="my-1 border-t border-[#1e2538]" />

      {/* Chart Styles Sub-menu */}
      <div className="px-3 py-1 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
        Chart Type
      </div>

      {(
        [
          { id: 'candlestick', label: 'Candlesticks' },
          { id: 'bar', label: 'Bars (OHLC)' },
          { id: 'line', label: 'Line' },
          { id: 'area', label: 'Area' },
          { id: 'heikin-ashi', label: 'Heikin-Ashi' },
        ] as const
      ).map((st) => (
        <button
          key={st.id}
          onClick={() => {
            setChartStyle(st.id as ChartStyle);
            onClose();
          }}
          className="w-full px-3 py-1 text-left hover:bg-[#1b2234] flex items-center justify-between text-gray-300 hover:text-white transition cursor-pointer text-[11px]"
        >
          <span>{st.label}</span>
          {chartStyle === st.id && <Check className="w-3 h-3 text-blue-400" />}
        </button>
      ))}

      <div className="my-1 border-t border-[#1e2538]" />

      {/* Toggles */}
      <button
        onClick={() => {
          toggleCountdown();
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-[#1b2234] flex items-center justify-between text-gray-300 hover:text-white transition cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Countdown to Bar Close</span>
        </div>
        {isCountdownVisible && <Check className="w-3.5 h-3.5 text-blue-400" />}
      </button>

      <button
        onClick={handleScreenshot}
        className="w-full px-3 py-1.5 text-left hover:bg-[#1b2234] flex items-center justify-between text-gray-300 hover:text-white transition cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Camera className="w-3.5 h-3.5 text-emerald-400" />
          <span>Save Chart Image (PNG)</span>
        </div>
      </button>
    </div>
  );
}
