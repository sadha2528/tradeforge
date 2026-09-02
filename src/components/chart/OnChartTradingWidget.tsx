'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTradingStore } from '@/store/trading-store';
import { useChartStore } from '@/store/chart-store';
import { useReplayStore } from '@/store/replay-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import { formatCurrency, formatPnL } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils';
import type { Symbol } from '@/types/market-data';
import {
  ArrowUp,
  ArrowDown,
  Shield,
  Target,
  Minus,
  Plus,
  CheckCircle2,
  XCircle,
  Maximize2,
  ChevronDown,
} from 'lucide-react';

export function OnChartTradingWidget() {
  const [symbolObj, setSymbolObj] = useState<Symbol | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [slTicks, setSlTicks] = useState(20);
  const [tpTicks, setTpTicks] = useState(40);
  const [isExpanded, setIsExpanded] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const allCandles = useReplayStore((s) => s.allCandles);
  const currentIndex = useReplayStore((s) => s.currentIndex);
  const preloadCount = useReplayStore((s) => s.preloadCount);

  const positions = useTradingStore((s) => s.positions);
  const placeMarketOrder = useTradingStore((s) => s.placeMarketOrder);
  const closePosition = useTradingStore((s) => s.closePosition);
  const closePartialPosition = useTradingStore((s) => s.closePartialPosition);
  const updateStopLossTakeProfit = useTradingStore((s) => s.updateStopLossTakeProfit);

  useEffect(() => {
    marketDataService.getSymbol(activeSymbol).then((sym) => {
      setSymbolObj(sym);
      setQuantity(sym.minQuantity || 1);
    });
  }, [activeSymbol]);

  const currentCandle = allCandles[preloadCount + currentIndex] ?? null;
  const currentPrice = currentCandle ? currentCandle.close : 0;
  const currentTs = currentCandle ? currentCandle.timestamp : Date.now();

  const activePosition = useMemo(
    () => positions.find((p) => p.symbol === activeSymbol) || null,
    [positions, activeSymbol]
  );

  const handleBuy = () => {
    if (!symbolObj || !currentCandle) return;
    const slPrice = slTicks > 0 ? currentPrice - slTicks * symbolObj.tickSize : undefined;
    const tpPrice = tpTicks > 0 ? currentPrice + tpTicks * symbolObj.tickSize : undefined;

    placeMarketOrder({
      symbol: symbolObj,
      side: 'long',
      quantity,
      currentPrice,
      timestamp: currentCandle.timestamp,
      stopLoss: slPrice,
      takeProfit: tpPrice,
    });
    setFeedbackMsg(`BOUGHT ${quantity} ${symbolObj.id}`);
    setTimeout(() => setFeedbackMsg(''), 2000);
  };

  const handleSell = () => {
    if (!symbolObj || !currentCandle) return;
    const slPrice = slTicks > 0 ? currentPrice + slTicks * symbolObj.tickSize : undefined;
    const tpPrice = tpTicks > 0 ? currentPrice - tpTicks * symbolObj.tickSize : undefined;

    placeMarketOrder({
      symbol: symbolObj,
      side: 'short',
      quantity,
      currentPrice,
      timestamp: currentCandle.timestamp,
      stopLoss: slPrice,
      takeProfit: tpPrice,
    });
    setFeedbackMsg(`SOLD ${quantity} ${symbolObj.id}`);
    setTimeout(() => setFeedbackMsg(''), 2000);
  };

  const handleMoveToBreakeven = () => {
    if (!activePosition) return;
    updateStopLossTakeProfit(activePosition.id, activePosition.entryPrice, activePosition.takeProfit);
    setFeedbackMsg('SL MOVED TO BREAKEVEN');
    setTimeout(() => setFeedbackMsg(''), 2000);
  };

  const handleCloseActive = () => {
    if (!activePosition || !symbolObj) return;
    closePosition(activePosition.id, currentPrice, currentTs, symbolObj);
  };

  if (!symbolObj) return null;

  return (
    <div className="absolute top-14 left-4 z-30 flex flex-col items-start gap-1 font-mono text-xs select-none">
      {/* Main Floating Bar */}
      <div className="bg-[#0b101d]/90 backdrop-blur-md border border-[#1d273f] rounded-xl shadow-2xl p-1 flex items-center gap-1.5 text-gray-200">
        {/* SELL Button */}
        <button
          onClick={handleSell}
          className="px-2.5 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white font-bold flex items-center space-x-1 transition shadow-sm cursor-pointer"
          title="Sell Market (S)"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>SELL</span>
          <span className="text-[10px] text-rose-200 font-normal">
            {currentPrice.toFixed(symbolObj.pricePrecision)}
          </span>
        </button>

        {/* Quantity Stepper */}
        <div className="flex items-center bg-[#131b2e] border border-[#1f2b45] rounded-lg px-1 py-0.5 space-x-1">
          <button
            onClick={() => setQuantity((q) => Math.max(symbolObj.minQuantity || 1, q - 1))}
            className="w-5 h-5 rounded hover:bg-[#1e2942] flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-5 text-center font-bold text-white text-xs">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="w-5 h-5 rounded hover:bg-[#1e2942] flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* BUY Button */}
        <button
          onClick={handleBuy}
          className="px-2.5 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold flex items-center space-x-1 transition shadow-sm cursor-pointer"
          title="Buy Market (B)"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span>BUY</span>
          <span className="text-[10px] text-emerald-200 font-normal">
            {currentPrice.toFixed(symbolObj.pricePrecision)}
          </span>
        </button>

        {/* SL / TP Quick Toggle & Expansion */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'px-2 py-1.5 rounded-lg border text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer',
            isExpanded
              ? 'bg-blue-600/25 border-blue-500/40 text-blue-300'
              : 'bg-[#131b2e] border-[#1f2b45] text-gray-400 hover:text-gray-200'
          )}
          title="SL/TP Ticks Setup"
        >
          <span>SL: {slTicks}t · TP: {tpTicks}t</span>
          <ChevronDown className={cn('w-3 h-3 transition-transform', isExpanded ? 'rotate-180' : '')} />
        </button>
      </div>

      {/* Expanded SL/TP Sliders & Configuration */}
      {isExpanded && (
        <div className="bg-[#0b101d]/95 backdrop-blur-md border border-[#1d273f] rounded-xl shadow-2xl p-2.5 flex items-center space-x-3 text-[11px] text-gray-300 animate-fadeIn">
          <div className="flex items-center space-x-1.5">
            <span className="text-rose-400 font-bold">SL:</span>
            {[10, 20, 30, 40].map((t) => (
              <button
                key={t}
                onClick={() => setSlTicks(t)}
                className={cn(
                  'px-1.5 py-0.5 rounded cursor-pointer font-bold',
                  slTicks === t ? 'bg-rose-600 text-white' : 'bg-[#141b2e] text-gray-400 hover:text-white'
                )}
              >
                {t}t
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-[#1f2b45]" />

          <div className="flex items-center space-x-1.5">
            <span className="text-emerald-400 font-bold">TP:</span>
            {[20, 40, 60, 80].map((t) => (
              <button
                key={t}
                onClick={() => setTpTicks(t)}
                className={cn(
                  'px-1.5 py-0.5 rounded cursor-pointer font-bold',
                  tpTicks === t ? 'bg-emerald-600 text-white' : 'bg-[#141b2e] text-gray-400 hover:text-white'
                )}
              >
                {t}t
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Position Floating Banner & 1-Click Breakeven / Close */}
      {activePosition && (
        <div className="bg-[#0b101d]/95 backdrop-blur-md border border-[#1d273f] rounded-xl shadow-2xl px-2.5 py-1.5 flex items-center space-x-2.5 animate-fadeIn">
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-black',
              activePosition.side === 'long'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            )}
          >
            {activePosition.side.toUpperCase()} {activePosition.quantity} {activePosition.symbol}
          </span>

          <span
            className={cn(
              'font-bold text-xs',
              activePosition.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            {formatPnL(activePosition.netPnL)}
          </span>

          {activePosition.rMultiple !== null && (
            <span className="text-gray-400 text-[10px]">
              ({activePosition.rMultiple >= 0 ? '+' : ''}{activePosition.rMultiple}R)
            </span>
          )}

          <div className="w-px h-3.5 bg-[#1f2b45]" />

          <button
            onClick={handleMoveToBreakeven}
            className="px-2 py-0.5 rounded bg-[#151d30] hover:bg-[#1f2c4a] border border-[#233252] text-amber-300 hover:text-amber-200 text-[10px] font-bold cursor-pointer transition"
            title="Move Stop Loss to Entry Price (Breakeven)"
          >
            BE (Breakeven)
          </button>

          <button
            onClick={() => closePartialPosition(activePosition.id, 0.5, currentPrice, currentTs, symbolObj)}
            className="px-2 py-0.5 rounded bg-[#151d30] hover:bg-[#1f2c4a] border border-[#233252] text-blue-300 hover:text-blue-200 text-[10px] font-bold cursor-pointer transition"
            title="Close 50% of position"
          >
            Close 50%
          </button>

          <button
            onClick={handleCloseActive}
            className="px-2 py-0.5 rounded bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-[10px] font-bold cursor-pointer transition"
            title="Close Entire Position"
          >
            Flatten
          </button>
        </div>
      )}

      {/* Instant Notification Tag */}
      {feedbackMsg && (
        <div className="bg-blue-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-lg flex items-center space-x-1 animate-fadeIn">
          <CheckCircle2 className="w-3 h-3 text-white" />
          <span>{feedbackMsg}</span>
        </div>
      )}
    </div>
  );
}
