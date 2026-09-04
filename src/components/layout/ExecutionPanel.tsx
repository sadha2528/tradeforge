'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTradingStore } from '@/store/trading-store';
import { useChartStore } from '@/store/chart-store';
import { useReplayStore } from '@/store/replay-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import { formatCurrency, formatPnL, formatDuration } from '@/lib/utils/formatting';
import { calculatePositionSize } from '@/lib/trading-engine/calculations';
import { cn } from '@/lib/utils';
import type { Symbol } from '@/types/market-data';
import type { OrderSide, OrderType } from '@/types/trading';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  X,
  Minus,
  Plus,
  RotateCcw,
  Target,
  Shield,
} from 'lucide-react';

export function ExecutionPanel() {
  const [symbolObj, setSymbolObj] = useState<Symbol | null>(null);
  const [orderSide, setOrderSide] = useState<OrderSide>('long');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [sizingMode, setSizingMode] = useState<'contracts' | 'riskPct'>('contracts');
  const [quantity, setQuantity] = useState('1');
  const [riskPercent, setRiskPercent] = useState('1.0');
  const [orderPrice, setOrderPrice] = useState('');
  const [stopLossTicks, setStopLossTicks] = useState('20');
  const [takeProfitTicks, setTakeProfitTicks] = useState('40');
  const [submittedMsg, setSubmittedMsg] = useState('');

  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const allCandles = useReplayStore((s) => s.allCandles);
  const currentIndex = useReplayStore((s) => s.currentIndex);
  const preloadCount = useReplayStore((s) => s.preloadCount);

  const balance = useTradingStore((s) => s.balance);
  const equity = useTradingStore((s) => s.equity);
  const openPnL = useTradingStore((s) => s.openPnL);
  const realizedPnL = useTradingStore((s) => s.realizedPnL);
  const positions = useTradingStore((s) => s.positions);
  const closedTrades = useTradingStore((s) => s.closedTrades);
  const placeMarketOrder = useTradingStore((s) => s.placeMarketOrder);
  const placePendingOrder = useTradingStore((s) => s.placePendingOrder);
  const closePosition = useTradingStore((s) => s.closePosition);
  const closePartialPosition = useTradingStore((s) => s.closePartialPosition);
  const resetAccount = useTradingStore((s) => s.resetAccount);

  useEffect(() => {
    marketDataService.getSymbol(activeSymbol).then((sym) => {
      setSymbolObj(sym);
      setQuantity(String(sym.minQuantity || 1));
    });
  }, [activeSymbol]);

  const currentCandle = allCandles[preloadCount + currentIndex] ?? null;
  const currentPrice = currentCandle ? currentCandle.close : 0;

  const activePosition = useMemo(
    () => positions.find((p) => p.symbol === activeSymbol) || positions[0] || null,
    [positions, activeSymbol]
  );

  // Compute risk/reward display values
  const slTicks = parseInt(stopLossTicks, 10) || 20;
  const tpTicks = parseInt(takeProfitTicks, 10) || 40;
  const tickSz = symbolObj?.tickSize || 0.25;
  const tickVal = symbolObj?.tickValue || 12.5;
  const qty = parseInt(quantity, 10) || 1;

  const riskDollars = slTicks * tickVal * qty;
  const rewardDollars = tpTicks * tickVal * qty;
  const rrRatio = slTicks > 0 ? (tpTicks / slTicks).toFixed(2) : '—';

  const handleExecute = (side: OrderSide) => {
    if (!symbolObj || !currentCandle) return;
    const qtyN = Math.max(symbolObj.minQuantity || 1, qty);
    const sl = slTicks > 0 ? (side === 'long' ? currentPrice - slTicks * tickSz : currentPrice + slTicks * tickSz) : undefined;
    const tp = tpTicks > 0 ? (side === 'long' ? currentPrice + tpTicks * tickSz : currentPrice - tpTicks * tickSz) : undefined;
    const risk = slTicks * tickVal * qtyN;

    if (orderType === 'market') {
      placeMarketOrder({
        symbol: symbolObj,
        side,
        quantity: qtyN,
        currentPrice,
        timestamp: currentCandle.timestamp,
        stopLoss: sl,
        takeProfit: tp,
        riskDollars: risk,
      });
      setSubmittedMsg(`Filled ${qtyN} ${activeSymbol} ${side.toUpperCase()} @ ${currentPrice.toFixed(symbolObj.pricePrecision)}`);
    } else {
      const targetPrice = parseFloat(orderPrice);
      if (isNaN(targetPrice) || targetPrice <= 0) return;
      placePendingOrder({ symbol: symbolObj, side, type: orderType, price: targetPrice, quantity: qtyN, timestamp: currentCandle.timestamp, stopLoss: sl, takeProfit: tp });
      setSubmittedMsg(`Placed ${orderType} ${side.toUpperCase()} @ ${targetPrice.toFixed(symbolObj.pricePrecision)}`);
    }
    setTimeout(() => setSubmittedMsg(''), 3000);
  };

  const winCount = closedTrades.filter((t) => t.netPnL > 0).length;
  const winRate = closedTrades.length > 0 ? (winCount / closedTrades.length) * 100 : 0;

  return (
    <div className="h-full w-full bg-[#0c1018] border-l border-[#1e2333] flex flex-col text-xs font-mono overflow-y-auto select-none">

      {/* ── ACCOUNT SUMMARY ── */}
      <div className="p-3 border-b border-[#1e2333] space-y-2 shrink-0">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Account</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#111520] rounded-lg p-2 border border-[#1e2535]">
            <div className="text-[10px] text-gray-500 mb-0.5">Balance</div>
            <div className="font-bold text-white text-sm">{formatCurrency(balance)}</div>
          </div>
          <div className="bg-[#111520] rounded-lg p-2 border border-[#1e2535]">
            <div className="text-[10px] text-gray-500 mb-0.5">Equity</div>
            <div className={cn('font-bold text-sm', equity >= balance ? 'text-emerald-400' : 'text-rose-400')}>
              {formatCurrency(equity)}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
          <div className="bg-[#111520] rounded p-1.5 border border-[#1e2535] text-center">
            <div className="text-gray-500 text-[9px]">Open P&L</div>
            <div className={cn('font-bold', openPnL >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {formatPnL(openPnL)}
            </div>
          </div>
          <div className="bg-[#111520] rounded p-1.5 border border-[#1e2535] text-center">
            <div className="text-gray-500 text-[9px]">Realized</div>
            <div className={cn('font-bold', realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {formatPnL(realizedPnL)}
            </div>
          </div>
          <div className="bg-[#111520] rounded p-1.5 border border-[#1e2535] text-center">
            <div className="text-gray-500 text-[9px]">Win %</div>
            <div className="font-bold text-blue-400">{winRate.toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* ── ACTIVE POSITION ── */}
      {activePosition && (
        <div className="p-3 border-b border-[#1e2333] shrink-0">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Open Position</div>
          <div className={cn(
            'rounded-xl p-3 border space-y-2',
            activePosition.side === 'long'
              ? 'bg-emerald-500/5 border-emerald-500/25'
              : 'bg-rose-500/5 border-rose-500/25'
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {activePosition.side === 'long'
                  ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  : <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                }
                <span className={cn('font-bold text-sm', activePosition.side === 'long' ? 'text-emerald-400' : 'text-rose-400')}>
                  {activePosition.side === 'long' ? 'LONG' : 'SHORT'} {activePosition.quantity} {activePosition.symbol}
                </span>
              </div>
              <button
                onClick={() => symbolObj && closePosition(activePosition.id, currentPrice, currentCandle?.timestamp || Date.now(), symbolObj)}
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1 rounded transition cursor-pointer"
                title="Close Position"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div>
                <span className="text-gray-500">Entry: </span>
                <span className="text-white font-bold">{activePosition.entryPrice.toFixed(symbolObj?.pricePrecision || 2)}</span>
              </div>
              <div>
                <span className="text-gray-500">Current: </span>
                <span className="text-white font-bold">{currentPrice.toFixed(symbolObj?.pricePrecision || 2)}</span>
              </div>
              {activePosition.stopLoss && (
                <div>
                  <span className="text-gray-500">SL: </span>
                  <span className="text-rose-400 font-bold">{activePosition.stopLoss.toFixed(symbolObj?.pricePrecision || 2)}</span>
                </div>
              )}
              {activePosition.takeProfit && (
                <div>
                  <span className="text-gray-500">TP: </span>
                  <span className="text-emerald-400 font-bold">{activePosition.takeProfit.toFixed(symbolObj?.pricePrecision || 2)}</span>
                </div>
              )}
            </div>

            <div className={cn('text-center font-black text-sm', activePosition.grossPnL >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {formatPnL(activePosition.grossPnL)}
            </div>

            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => symbolObj && closePartialPosition(activePosition.id, 0.25, currentPrice, currentCandle?.timestamp || Date.now(), symbolObj)}
                className="py-1 rounded bg-[#1a2236] hover:bg-[#222e48] text-gray-300 hover:text-white transition cursor-pointer text-[10px] font-bold border border-[#252d42]"
              >25%</button>
              <button
                onClick={() => symbolObj && closePartialPosition(activePosition.id, 0.5, currentPrice, currentCandle?.timestamp || Date.now(), symbolObj)}
                className="py-1 rounded bg-[#1a2236] hover:bg-[#222e48] text-gray-300 hover:text-white transition cursor-pointer text-[10px] font-bold border border-[#252d42]"
              >50%</button>
              <button
                onClick={() => symbolObj && closePosition(activePosition.id, currentPrice, currentCandle?.timestamp || Date.now(), symbolObj)}
                className="py-1 rounded bg-rose-600/80 hover:bg-rose-500 text-white transition cursor-pointer text-[10px] font-bold"
              >Flatten</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ORDER ENTRY ── */}
      <div className="p-3 space-y-3 border-b border-[#1e2333] shrink-0">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">New Order</div>

        {/* Order Type */}
        <div className="grid grid-cols-3 bg-[#0e1421] p-0.5 rounded-lg border border-[#1e2535]">
          {(['market', 'limit', 'stop'] as OrderType[]).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={cn(
                'py-1.5 rounded text-[11px] font-bold uppercase transition cursor-pointer',
                orderType === type ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-200'
              )}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Buy / Sell */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleExecute('long')}
            className="py-3.5 rounded-xl font-black text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-2 border border-emerald-500"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>BUY</span>
          </button>
          <button
            onClick={() => handleExecute('short')}
            className="py-3.5 rounded-xl font-black text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition cursor-pointer flex items-center justify-center gap-2 border border-rose-500"
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>SELL</span>
          </button>
        </div>

        {/* Current Price display */}
        <div className="flex items-center justify-between bg-[#0e1421] px-3 py-2 rounded-lg border border-[#1e2535]">
          <span className="text-gray-500 text-[10px]">Market Price</span>
          <span className="font-bold text-white">{currentPrice > 0 ? currentPrice.toFixed(symbolObj?.pricePrecision || 2) : '—'}</span>
        </div>

        {/* Limit / Stop price */}
        {orderType !== 'market' && (
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Order Price</label>
            <input
              type="number"
              step={tickSz}
              placeholder={currentPrice.toFixed(symbolObj?.pricePrecision || 2)}
              value={orderPrice}
              onChange={(e) => setOrderPrice(e.target.value)}
              className="w-full bg-[#0e1421] border border-[#1e2535] rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-blue-500 text-[12px]"
            />
          </div>
        )}

        {/* Quantity / Sizing */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500">Quantity</span>
            <div className="flex gap-1">
              {(['contracts', 'riskPct'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSizingMode(mode)}
                  className={cn(
                    'px-1.5 py-0.5 text-[9px] rounded cursor-pointer font-bold transition',
                    sizingMode === mode ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'
                  )}
                >
                  {mode === 'contracts' ? 'Qty' : '% Risk'}
                </button>
              ))}
            </div>
          </div>
          {sizingMode === 'contracts' ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setQuantity(String(Math.max(1, qty - 1)))}
                className="w-8 h-8 rounded-lg bg-[#0e1421] border border-[#1e2535] text-gray-400 hover:text-white hover:bg-[#161c2b] flex items-center justify-center transition cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="flex-1 bg-[#0e1421] border border-[#1e2535] rounded-lg px-2 py-2 text-white text-center text-[13px] font-bold focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => setQuantity(String(qty + 1))}
                className="w-8 h-8 rounded-lg bg-[#0e1421] border border-[#1e2535] text-gray-400 hover:text-white hover:bg-[#161c2b] flex items-center justify-center transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                className="flex-1 bg-[#0e1421] border border-[#1e2535] rounded-lg px-2 py-2 text-white focus:outline-none focus:border-blue-500 text-[12px]"
              />
              <span className="text-gray-400 text-[11px]">% = {quantity} ct</span>
            </div>
          )}
        </div>

        {/* SL / TP in ticks */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                <Shield className="w-3 h-3" /> Stop Loss
              </span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={stopLossTicks}
                onChange={(e) => setStopLossTicks(e.target.value)}
                className="flex-1 bg-[#0e1421] border border-rose-500/30 rounded-lg px-2 py-1.5 text-rose-300 focus:outline-none focus:border-rose-500 text-[12px] text-center font-bold"
              />
              <span className="text-[10px] text-gray-500">ticks</span>
            </div>
            <div className="text-[9px] text-rose-400/60 text-center">-${riskDollars.toFixed(0)}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <Target className="w-3 h-3" /> Take Profit
              </span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={takeProfitTicks}
                onChange={(e) => setTakeProfitTicks(e.target.value)}
                className="flex-1 bg-[#0e1421] border border-emerald-500/30 rounded-lg px-2 py-1.5 text-emerald-300 focus:outline-none focus:border-emerald-500 text-[12px] text-center font-bold"
              />
              <span className="text-[10px] text-gray-500">ticks</span>
            </div>
            <div className="text-[9px] text-emerald-400/60 text-center">+${rewardDollars.toFixed(0)}</div>
          </div>
        </div>

        {/* R:R display */}
        {slTicks > 0 && tpTicks > 0 && (
          <div className="flex items-center justify-between bg-[#0e1421] px-3 py-2 rounded-lg border border-[#1e2535] text-[11px]">
            <span className="text-gray-500">Risk/Reward</span>
            <span className="font-bold text-blue-400">1 : {rrRatio}</span>
            <span className="text-gray-500">{riskDollars.toFixed(0)} → {rewardDollars.toFixed(0)}</span>
          </div>
        )}

        {/* Submit Message */}
        {submittedMsg && (
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] text-center font-bold">
            ✓ {submittedMsg}
          </div>
        )}
      </div>

      {/* ── FOOTER ACTIONS ── */}
      <div className="p-3 mt-auto border-t border-[#1e2333] space-y-2">
        <button
          onClick={() => resetAccount()}
          className="w-full py-2 rounded-lg bg-[#111520] hover:bg-[#161c2b] border border-[#1e2535] text-gray-400 hover:text-white text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Account
        </button>
        <div className="text-center text-[9px] text-gray-600 font-mono">
          {closedTrades.length} trades · {winRate.toFixed(0)}% win rate
        </div>
      </div>
    </div>
  );
}
