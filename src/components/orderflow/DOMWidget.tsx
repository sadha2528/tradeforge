'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useChartStore } from '@/store/chart-store';
import { useTradingStore } from '@/store/trading-store';
import { useReplayStore } from '@/store/replay-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import { generateDOMBook } from '@/lib/orderflow/orderflow-engine';
import type { Symbol } from '@/types/market-data';
import type { DOMBook, DOMLevel } from '@/types/orderflow';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPnL } from '@/lib/utils/formatting';
import {
  ArrowUp,
  ArrowDown,
  RotateCcw,
  X,
  Crosshair,
  Shield,
  Layers,
  ChevronDown,
  Minimize2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface DOMWidgetProps {
  className?: string;
  onClose?: () => void;
}

export function DOMWidget({ className, onClose }: DOMWidgetProps) {
  const [symbolObj, setSymbolObj] = useState<Symbol | null>(null);
  const [orderQty, setOrderQty] = useState(1);
  const [isCentered, setIsCentered] = useState(true);
  const ladderRef = useRef<HTMLDivElement>(null);

  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const allCandles = useReplayStore((s) => s.allCandles);
  const currentIndex = useReplayStore((s) => s.currentIndex);
  const preloadCount = useReplayStore((s) => s.preloadCount);

  const positions = useTradingStore((s) => s.positions);
  const orders = useTradingStore((s) => s.orders);
  const placeMarketOrder = useTradingStore((s) => s.placeMarketOrder);
  const placePendingOrder = useTradingStore((s) => s.placePendingOrder);
  const cancelOrder = useTradingStore((s) => s.cancelOrder);
  const closePosition = useTradingStore((s) => s.closePosition);

  // Load symbol specifications
  useEffect(() => {
    marketDataService.getSymbol(activeSymbol).then(setSymbolObj);
  }, [activeSymbol]);

  const currentCandle = allCandles[preloadCount + currentIndex] ?? null;
  const currentPrice = currentCandle ? currentCandle.close : 0;

  // Active position for this symbol
  const activePosition = useMemo(
    () => positions.find((p) => p.symbol === activeSymbol) || null,
    [positions, activeSymbol]
  );

  // Working pending orders for this symbol
  const workingOrders = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'pending' && o.symbol === activeSymbol && o.price !== null)
        .map((o) => ({ price: o.price!, side: o.side, quantity: o.quantity })),
    [orders, activeSymbol]
  );

  // Generate DOM book
  const domBook: DOMBook = useMemo(() => {
    if (!symbolObj || currentPrice <= 0) {
      return { symbol: activeSymbol, currentPrice: 0, spread: 0.25, levels: [], totalBidDepth: 0, totalAskDepth: 0 };
    }
    return generateDOMBook(symbolObj, currentPrice, workingOrders, 24);
  }, [symbolObj, currentPrice, workingOrders, activeSymbol]);

  // Find max sizes for depth bar proportions
  const maxBidSize = useMemo(() => Math.max(1, ...domBook.levels.map((l) => l.bidSize)), [domBook]);
  const maxAskSize = useMemo(() => Math.max(1, ...domBook.levels.map((l) => l.askSize)), [domBook]);
  const maxVolume = useMemo(() => Math.max(1, ...domBook.levels.map((l) => l.volumeAtPrice)), [domBook]);

  // Center on current market price
  const handleCenter = useCallback(() => {
    if (!ladderRef.current) return;
    const currentPriceRow = ladderRef.current.querySelector('[data-current-price="true"]');
    if (currentPriceRow) {
      currentPriceRow.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (isCentered) {
      handleCenter();
    }
  }, [currentPrice, isCentered, handleCenter]);

  // 1-Click Execution
  const handleBuyLimit = (price: number) => {
    if (!symbolObj || !currentCandle) return;
    placePendingOrder({
      symbol: symbolObj,
      side: 'long',
      type: 'limit',
      price,
      quantity: orderQty,
      timestamp: currentCandle.timestamp,
    });
  };

  const handleSellLimit = (price: number) => {
    if (!symbolObj || !currentCandle) return;
    placePendingOrder({
      symbol: symbolObj,
      side: 'short',
      type: 'limit',
      price,
      quantity: orderQty,
      timestamp: currentCandle.timestamp,
    });
  };

  const handleMarketBuy = () => {
    if (!symbolObj || !currentCandle) return;
    placeMarketOrder({
      symbol: symbolObj,
      side: 'long',
      quantity: orderQty,
      currentPrice,
      timestamp: currentCandle.timestamp,
    });
  };

  const handleMarketSell = () => {
    if (!symbolObj || !currentCandle) return;
    placeMarketOrder({
      symbol: symbolObj,
      side: 'short',
      quantity: orderQty,
      currentPrice,
      timestamp: currentCandle.timestamp,
    });
  };

  const handleFlatten = () => {
    if (!symbolObj || !activePosition || !currentCandle) return;
    closePosition(activePosition.id, currentPrice, currentCandle.timestamp, symbolObj);
  };

  const handleCancelAll = () => {
    orders
      .filter((o) => o.status === 'pending' && o.symbol === activeSymbol)
      .forEach((o) => cancelOrder(o.id));
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full w-full bg-[#0a0d14] border-l border-[#1b2234] text-xs font-mono select-none overflow-hidden',
        className
      )}
    >
      {/* ── HEADER ── */}
      <div className="p-2.5 bg-[#0f1422] border-b border-[#1b2234] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="font-bold text-white text-[13px]">{activeSymbol}</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-[#162035] text-blue-400 border border-[#202c48]">
              DOM
            </span>
          </div>
          <span className="text-gray-400 text-[11px] font-bold">
            {currentPrice.toFixed(symbolObj?.pricePrecision || 2)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCenter}
            title="Center Price Ladder"
            className="px-1.5 py-0.5 rounded bg-[#141b2c] hover:bg-[#1a253e] border border-[#202d48] text-blue-400 text-[10px] flex items-center gap-1 transition cursor-pointer"
          >
            <Crosshair className="w-3 h-3" />
            <span>Center</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white p-1 rounded transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── QUICK ACTION BUTTONS ── */}
      <div className="p-2 bg-[#0c101a] border-b border-[#1b2234] space-y-1.5 shrink-0">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={handleMarketBuy}
            className="py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-1"
          >
            <ArrowUp className="w-3 h-3" />
            <span>MKT BUY</span>
          </button>
          <button
            onClick={handleMarketSell}
            className="py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center justify-center gap-1"
          >
            <ArrowDown className="w-3 h-3" />
            <span>MKT SELL</span>
          </button>
        </div>

        {/* Order Size & Position Status */}
        <div className="flex items-center justify-between text-[11px] px-1">
          <div className="flex items-center gap-1">
            <span className="text-gray-500 text-[10px]">Qty:</span>
            {[1, 2, 5, 10].map((q) => (
              <button
                key={q}
                onClick={() => setOrderQty(q)}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition',
                  orderQty === q
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 bg-[#141b2c]'
                )}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleFlatten}
              disabled={!activePosition}
              className="px-2 py-0.5 rounded bg-[#1f1a24] hover:bg-rose-950/60 text-rose-400 disabled:opacity-40 text-[10px] font-bold border border-rose-500/30 transition cursor-pointer"
            >
              Flatten
            </button>
            <button
              onClick={handleCancelAll}
              className="px-2 py-0.5 rounded bg-[#141b2c] hover:bg-[#1a253e] text-gray-400 hover:text-white text-[10px] font-bold border border-[#202d48] transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Open Position Ribbon */}
        {activePosition && (
          <div
            className={cn(
              'px-2 py-1 rounded-md text-[10px] flex items-center justify-between border',
              activePosition.side === 'long'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            )}
          >
            <span className="font-bold">
              {activePosition.side.toUpperCase()} {activePosition.quantity} @ {activePosition.entryPrice}
            </span>
            <span className="font-black">
              {activePosition.grossPnL >= 0 ? '+' : ''}
              {formatCurrency(activePosition.grossPnL)}
            </span>
          </div>
        )}
      </div>

      {/* ── PRICE LADDER COLUMNS HEADER ── */}
      <div className="grid grid-cols-12 bg-[#0d121e] border-b border-[#1b2234] text-[9px] text-gray-400 font-bold py-1 px-1 text-center shrink-0">
        <div className="col-span-2 text-blue-400" title="Working Buy Orders">Buy</div>
        <div className="col-span-2 text-cyan-400" title="Bid Size">Bid</div>
        <div className="col-span-4 text-gray-300" title="Price">Price</div>
        <div className="col-span-2 text-amber-400" title="Ask Size">Ask</div>
        <div className="col-span-2 text-rose-400" title="Working Sell Orders">Sell</div>
      </div>

      {/* ── SCROLLABLE PRICE LADDER ── */}
      <div ref={ladderRef} className="flex-1 overflow-y-auto divide-y divide-[#131826]/60">
        {domBook.levels.map((level) => {
          const isAtCurrent = Math.abs(level.price - currentPrice) < (symbolObj?.tickSize || 0.25) * 0.5;
          const bidDepthPct = (level.bidSize / maxBidSize) * 100;
          const askDepthPct = (level.askSize / maxAskSize) * 100;

          return (
            <div
              key={level.price}
              data-current-price={isAtCurrent ? 'true' : undefined}
              className={cn(
                'grid grid-cols-12 text-[11px] h-6 items-center hover:bg-[#151c2e] transition-colors relative group font-mono',
                isAtCurrent && 'bg-blue-600/15 font-bold border-y border-blue-500/40'
              )}
            >
              {/* Working Buy Orders */}
              <div
                onClick={() => handleBuyLimit(level.price)}
                className="col-span-2 h-full flex items-center justify-center cursor-pointer hover:bg-emerald-600/20 text-emerald-400 font-bold text-[10px]"
                title={`Click to place Buy Limit at ${level.price}`}
              >
                {level.myWorkingBuys ? (
                  <span className="bg-emerald-600 text-white px-1 rounded-sm text-[9px]">
                    {level.myWorkingBuys}
                  </span>
                ) : (
                  <span className="opacity-0 group-hover:opacity-60 text-emerald-400 text-[9px]">+B</span>
                )}
              </div>

              {/* Bid Size with Depth Bar */}
              <div
                onClick={() => handleBuyLimit(level.price)}
                className="col-span-2 h-full relative flex items-center justify-end pr-1 cursor-pointer"
              >
                {level.bidSize > 0 && (
                  <div
                    className="absolute right-0 top-0.5 bottom-0.5 bg-cyan-600/25 rounded-xs"
                    style={{ width: `${bidDepthPct}%` }}
                  />
                )}
                <span className="relative z-10 text-cyan-300 text-[10px]">
                  {level.bidSize > 0 ? level.bidSize : ''}
                </span>
              </div>

              {/* Price Level */}
              <div
                className={cn(
                  'col-span-4 h-full flex items-center justify-center text-center font-bold px-1',
                  isAtCurrent
                    ? 'text-white bg-blue-600 text-[11px] shadow-sm rounded-xs'
                    : level.isInsideBid
                    ? 'text-cyan-400'
                    : level.isInsideAsk
                    ? 'text-amber-400'
                    : 'text-gray-300'
                )}
              >
                {level.price.toFixed(symbolObj?.pricePrecision || 2)}
              </div>

              {/* Ask Size with Depth Bar */}
              <div
                onClick={() => handleSellLimit(level.price)}
                className="col-span-2 h-full relative flex items-center justify-start pl-1 cursor-pointer"
              >
                {level.askSize > 0 && (
                  <div
                    className="absolute left-0 top-0.5 bottom-0.5 bg-amber-600/25 rounded-xs"
                    style={{ width: `${askDepthPct}%` }}
                  />
                )}
                <span className="relative z-10 text-amber-300 text-[10px]">
                  {level.askSize > 0 ? level.askSize : ''}
                </span>
              </div>

              {/* Working Sell Orders */}
              <div
                onClick={() => handleSellLimit(level.price)}
                className="col-span-2 h-full flex items-center justify-center cursor-pointer hover:bg-rose-600/20 text-rose-400 font-bold text-[10px]"
                title={`Click to place Sell Limit at ${level.price}`}
              >
                {level.myWorkingSells ? (
                  <span className="bg-rose-600 text-white px-1 rounded-sm text-[9px]">
                    {level.myWorkingSells}
                  </span>
                ) : (
                  <span className="opacity-0 group-hover:opacity-60 text-rose-400 text-[9px]">+S</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FOOTER DEPTH TOTALS ── */}
      <div className="p-2 bg-[#0c101a] border-t border-[#1b2234] flex items-center justify-between text-[10px] text-gray-400 shrink-0">
        <div>
          <span>Total Bid: </span>
          <span className="text-cyan-400 font-bold">{domBook.totalBidDepth.toLocaleString()}</span>
        </div>
        <div>
          <span>Spread: </span>
          <span className="text-gray-300 font-bold">{domBook.spread.toFixed(2)}</span>
        </div>
        <div>
          <span>Total Ask: </span>
          <span className="text-amber-400 font-bold">{domBook.totalAskDepth.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
