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
  ShieldAlert,
  Target,
  CheckCircle2,
  Briefcase,
  Layers,
  Flame,
  Info,
  Sliders,
  DollarSign,
  Percent,
  Hash,
  Clock,
  XCircle,
} from 'lucide-react';

export function RightSidebar() {
  const [symbolObj, setSymbolObj] = useState<Symbol | null>(null);
  const [orderSide, setOrderSide] = useState<OrderSide>('long');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [sizingMode, setSizingMode] = useState<'contracts' | 'riskPct' | 'fixedDollar'>('contracts');
  const [quantity, setQuantity] = useState('1');
  const [riskPercent, setRiskPercent] = useState('1.0');
  const [fixedDollarRisk, setFixedDollarRisk] = useState('1000');
  const [orderPrice, setOrderPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
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
  const currentTs = currentCandle ? currentCandle.timestamp : Date.now();

  // Active open position for current symbol
  const activePosition = useMemo(
    () => positions.find((p) => p.symbol === activeSymbol) || positions[0] || null,
    [positions, activeSymbol]
  );

  // Auto-calculate position sizing when in % Risk or Fixed Dollar mode
  useEffect(() => {
    if (!symbolObj || currentPrice <= 0 || !stopLoss) return;
    const slPrice = parseFloat(stopLoss);
    if (isNaN(slPrice) || slPrice <= 0) return;

    const entryP = orderType === 'market' ? currentPrice : parseFloat(orderPrice) || currentPrice;

    if (sizingMode === 'riskPct') {
      const riskPct = parseFloat(riskPercent) || 1;
      const { quantity: calculatedQty } = calculatePositionSize(
        balance,
        riskPct,
        entryP,
        slPrice,
        symbolObj
      );
      setQuantity(String(calculatedQty));
    } else if (sizingMode === 'fixedDollar') {
      const targetDollarRisk = parseFloat(fixedDollarRisk) || 1000;
      const riskPctEquivalent = (targetDollarRisk / balance) * 100;
      const { quantity: calculatedQty } = calculatePositionSize(
        balance,
        riskPctEquivalent,
        entryP,
        slPrice,
        symbolObj
      );
      setQuantity(String(calculatedQty));
    }
  }, [
    sizingMode,
    riskPercent,
    fixedDollarRisk,
    stopLoss,
    currentPrice,
    orderPrice,
    orderType,
    balance,
    symbolObj,
  ]);

  // Risk / Reward Ratio calculation
  const entryP = orderType === 'market' ? currentPrice : parseFloat(orderPrice) || currentPrice;
  const slP = parseFloat(stopLoss);
  const tpP = parseFloat(takeProfit);
  let rrRatio: string | null = null;
  let estimatedRiskDollars = 0;
  let estimatedRewardDollars = 0;
  let ticksRisk = 0;
  let ticksReward = 0;

  if (!isNaN(slP) && slP > 0 && entryP > 0 && symbolObj) {
    const slDist = Math.abs(entryP - slP);
    const qty = parseInt(quantity, 10) || 1;
    ticksRisk = Math.round(slDist / (symbolObj.tickSize || 0.25));

    if (symbolObj.assetClass === 'futures') {
      estimatedRiskDollars = ticksRisk * symbolObj.tickValue * qty;
    } else {
      estimatedRiskDollars = slDist * (symbolObj.contractSize || 1) * qty;
    }

    if (!isNaN(tpP) && tpP > 0) {
      const tpDist = Math.abs(tpP - entryP);
      ticksReward = Math.round(tpDist / (symbolObj.tickSize || 0.25));
      if (symbolObj.assetClass === 'futures') {
        estimatedRewardDollars = ticksReward * symbolObj.tickValue * qty;
      } else {
        estimatedRewardDollars = tpDist * (symbolObj.contractSize || 1) * qty;
      }
      if (slDist > 0) {
        rrRatio = `1 : ${(tpDist / slDist).toFixed(2)}`;
      }
    }
  }

  const handleQuickTicks = (ticks: number, target: 'sl' | 'tp') => {
    if (!symbolObj || currentPrice <= 0) return;
    const distance = ticks * symbolObj.tickSize;
    if (target === 'sl') {
      const price = orderSide === 'long' ? currentPrice - distance : currentPrice + distance;
      setStopLoss(price.toFixed(symbolObj.pricePrecision));
    } else {
      const price = orderSide === 'long' ? currentPrice + distance : currentPrice - distance;
      setTakeProfit(price.toFixed(symbolObj.pricePrecision));
    }
  };

  const handleExecute = () => {
    if (!symbolObj || !currentCandle) return;

    const qty = Math.max(symbolObj.minQuantity || 1, parseInt(quantity, 10) || 1);
    const sl = stopLoss ? parseFloat(stopLoss) : undefined;
    const tp = takeProfit ? parseFloat(takeProfit) : undefined;

    if (orderType === 'market') {
      placeMarketOrder({
        symbol: symbolObj,
        side: orderSide,
        quantity: qty,
        currentPrice,
        timestamp: currentCandle.timestamp,
        stopLoss: sl,
        takeProfit: tp,
        riskDollars: estimatedRiskDollars || undefined,
      });
      setSubmittedMsg(
        `Filled ${qty} ${orderSide.toUpperCase()} at ${currentPrice.toFixed(symbolObj.pricePrecision)}`
      );
    } else {
      const targetPrice = parseFloat(orderPrice);
      if (isNaN(targetPrice) || targetPrice <= 0) return;

      placePendingOrder({
        symbol: symbolObj,
        side: orderSide,
        type: orderType,
        price: targetPrice,
        quantity: qty,
        timestamp: currentCandle.timestamp,
        stopLoss: sl,
        takeProfit: tp,
      });
      setSubmittedMsg(
        `Placed ${orderType.toUpperCase()} ${orderSide.toUpperCase()} at ${targetPrice.toFixed(
          symbolObj.pricePrecision
        )}`
      );
    }

    setTimeout(() => setSubmittedMsg(''), 2500);
  };

  const winCount = closedTrades.filter((t) => t.netPnL > 0).length;
  const winRate = closedTrades.length > 0 ? (winCount / closedTrades.length) * 100 : 0;

  return (
    <div className="h-full w-full bg-[#0a0e17] border-l border-[#182338] text-xs font-mono flex flex-col overflow-y-auto select-none">
      {/* =========================================================================
          SECTION 1: ORDER EXECUTION (PRIMARY)
      ========================================================================= */}
      <div className="p-3.5 border-b border-[#182338] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-white font-bold text-xs uppercase tracking-wider">
            <Briefcase className="w-3.5 h-3.5 text-blue-400" />
            <span>Order Execution</span>
          </div>
          <span className="text-[10px] bg-[#141b2c] border border-[#1f2b44] text-gray-400 px-1.5 py-0.5 rounded font-mono">
            {symbolObj?.id} · {currentPrice.toFixed(symbolObj?.pricePrecision || 2)}
          </span>
        </div>

        {/* Order Type Tabs: Market / Limit / Stop */}
        <div className="grid grid-cols-3 bg-[#111726] p-0.5 rounded-lg border border-[#1b253c]">
          {(['market', 'limit', 'stop'] as OrderType[]).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={cn(
                'py-1 rounded text-[11px] font-bold uppercase transition cursor-pointer',
                orderType === type
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Order Side: BUY (Long) vs SELL (Short) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setOrderSide('long')}
            className={cn(
              'py-2 rounded-lg font-black text-xs transition flex items-center justify-center space-x-1.5 border cursor-pointer',
              orderSide === 'long'
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-[#111726] border-[#1b253c] text-gray-400 hover:text-emerald-400'
            )}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>BUY / LONG</span>
          </button>

          <button
            onClick={() => setOrderSide('short')}
            className={cn(
              'py-2 rounded-lg font-black text-xs transition flex items-center justify-center space-x-1.5 border cursor-pointer',
              orderSide === 'short'
                ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/20'
                : 'bg-[#111726] border-[#1b253c] text-gray-400 hover:text-rose-400'
            )}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>SELL / SHORT</span>
          </button>
        </div>

        {/* Pending Order Price Input */}
        {orderType !== 'market' && (
          <div>
            <label className="block text-gray-400 text-[10px] mb-1">
              Order Trigger Price ($)
            </label>
            <input
              type="number"
              step={symbolObj?.tickSize || 0.25}
              placeholder={currentPrice.toFixed(symbolObj?.pricePrecision || 2)}
              value={orderPrice}
              onChange={(e) => setOrderPrice(e.target.value)}
              className="w-full bg-[#111726] border border-[#1b253c] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-hidden focus:border-blue-500"
            />
          </div>
        )}

        {/* Sizing Mode Tabs: Contracts / % Risk / Fixed $ */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>Position Sizing</span>
            <div className="flex space-x-1">
              <button
                onClick={() => setSizingMode('contracts')}
                className={cn(
                  'px-1.5 py-0.5 rounded cursor-pointer',
                  sizingMode === 'contracts' ? 'bg-blue-600 text-white font-bold' : 'hover:text-gray-200'
                )}
              >
                Contracts
              </button>
              <button
                onClick={() => setSizingMode('riskPct')}
                className={cn(
                  'px-1.5 py-0.5 rounded cursor-pointer',
                  sizingMode === 'riskPct' ? 'bg-blue-600 text-white font-bold' : 'hover:text-gray-200'
                )}
              >
                % Risk
              </button>
              <button
                onClick={() => setSizingMode('fixedDollar')}
                className={cn(
                  'px-1.5 py-0.5 rounded cursor-pointer',
                  sizingMode === 'fixedDollar' ? 'bg-blue-600 text-white font-bold' : 'hover:text-gray-200'
                )}
              >
                Fixed $
              </button>
            </div>
          </div>

          {sizingMode === 'contracts' && (
            <input
              type="number"
              min={symbolObj?.minQuantity || 1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-[#111726] border border-[#1b253c] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-hidden focus:border-blue-500"
            />
          )}

          {sizingMode === 'riskPct' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  max="100"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                  className="w-full bg-[#111726] border border-[#1b253c] rounded-lg pl-2.5 pr-6 py-1.5 text-white font-mono text-xs focus:outline-hidden focus:border-blue-500"
                />
                <span className="absolute right-2 top-1.5 text-gray-400">%</span>
              </div>
              <div className="bg-[#111726] border border-[#1b253c] rounded-lg px-2 py-1.5 text-gray-300 text-right flex items-center justify-end">
                <span className="text-gray-400 text-[10px] mr-1">Qty:</span>
                <strong className="text-white">{quantity}</strong>
              </div>
            </div>
          )}

          {sizingMode === 'fixedDollar' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-2 top-1.5 text-gray-400">$</span>
                <input
                  type="number"
                  step="100"
                  min="10"
                  value={fixedDollarRisk}
                  onChange={(e) => setFixedDollarRisk(e.target.value)}
                  className="w-full bg-[#111726] border border-[#1b253c] rounded-lg pl-5 pr-2 py-1.5 text-white font-mono text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>
              <div className="bg-[#111726] border border-[#1b253c] rounded-lg px-2 py-1.5 text-gray-300 text-right flex items-center justify-end">
                <span className="text-gray-400 text-[10px] mr-1">Qty:</span>
                <strong className="text-white">{quantity}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Stop Loss & Take Profit */}
        <div className="grid grid-cols-2 gap-2">
          {/* Stop Loss */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-rose-400 font-bold">Stop Loss</span>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => handleQuickTicks(10, 'sl')}
                  className="text-[9px] px-1 bg-[#151c2d] hover:bg-[#1f2b44] rounded text-gray-400 cursor-pointer"
                >
                  10t
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickTicks(20, 'sl')}
                  className="text-[9px] px-1 bg-[#151c2d] hover:bg-[#1f2b44] rounded text-gray-400 cursor-pointer"
                >
                  20t
                </button>
              </div>
            </div>
            <input
              type="number"
              step={symbolObj?.tickSize || 0.25}
              placeholder="None"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="w-full bg-[#111726] border border-[#1b253c] rounded-lg px-2 py-1 text-white font-mono text-xs focus:outline-hidden focus:border-rose-500"
            />
          </div>

          {/* Take Profit */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-emerald-400 font-bold">Take Profit</span>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => handleQuickTicks(20, 'tp')}
                  className="text-[9px] px-1 bg-[#151c2d] hover:bg-[#1f2b44] rounded text-gray-400 cursor-pointer"
                >
                  20t
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickTicks(40, 'tp')}
                  className="text-[9px] px-1 bg-[#151c2d] hover:bg-[#1f2b44] rounded text-gray-400 cursor-pointer"
                >
                  40t
                </button>
              </div>
            </div>
            <input
              type="number"
              step={symbolObj?.tickSize || 0.25}
              placeholder="None"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="w-full bg-[#111726] border border-[#1b253c] rounded-lg px-2 py-1 text-white font-mono text-xs focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Live Risk / Reward Preview Card */}
        {estimatedRiskDollars > 0 && (
          <div className="p-2.5 bg-[#0e1424] border border-[#1b253c] rounded-xl space-y-1 text-[10px]">
            <div className="flex justify-between items-center text-gray-300">
              <span>Risk: <strong className="text-rose-400">-${estimatedRiskDollars.toFixed(2)}</strong> ({ticksRisk}t)</span>
              {estimatedRewardDollars > 0 && (
                <span>Reward: <strong className="text-emerald-400">+${estimatedRewardDollars.toFixed(2)}</strong> ({ticksReward}t)</span>
              )}
            </div>
            {rrRatio && (
              <div className="flex justify-between items-center pt-0.5 border-t border-[#182338]">
                <span className="text-gray-400">Risk-to-Reward Ratio:</span>
                <span className="text-blue-400 font-bold font-mono">{rrRatio}</span>
              </div>
            )}
          </div>
        )}

        {/* Big Execute Button */}
        <button
          onClick={handleExecute}
          className={cn(
            'w-full py-2.5 rounded-xl font-black text-xs transition shadow-md flex items-center justify-center space-x-2 cursor-pointer',
            orderSide === 'long'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25'
          )}
        >
          <span>
            {orderType === 'market' ? 'EXECUTE' : 'PLACE'}{' '}
            {orderSide.toUpperCase()} {quantity} {symbolObj?.id}
          </span>
        </button>

        {submittedMsg && (
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] rounded-lg text-center flex items-center justify-center space-x-1.5 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{submittedMsg}</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 2: ACTIVE OPEN POSITION & PARTIAL CLOSES
      ========================================================================= */}
      {activePosition && symbolObj && (
        <div className="p-3.5 border-b border-[#182338] bg-[#0c111e] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded font-black text-[10px]',
                  activePosition.side === 'long'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                )}
              >
                {activePosition.side.toUpperCase()} {activePosition.quantity} {activePosition.symbol}
              </span>
              <span className="text-gray-400 text-[10px]">@ {activePosition.entryPrice.toFixed(symbolObj.pricePrecision)}</span>
            </div>

            <div className="flex items-center space-x-1 text-[10px] text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(currentTs - activePosition.entryTime)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center bg-[#111726] p-2 rounded-lg border border-[#1b253c]">
            <span className="text-gray-400">Unrealized P&amp;L:</span>
            <div className="text-right">
              <span
                className={cn(
                  'font-bold text-xs',
                  activePosition.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {formatPnL(activePosition.netPnL)}
              </span>
              {activePosition.rMultiple !== null && (
                <span className="text-[10px] text-gray-400 ml-1 font-mono">
                  ({activePosition.rMultiple >= 0 ? '+' : ''}{activePosition.rMultiple}R)
                </span>
              )}
            </div>
          </div>

          {/* Quick Partial Close Buttons: 25%, 50%, 75%, 100% */}
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 block font-semibold">Scale Out / Partial Exits:</span>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() =>
                  closePartialPosition(activePosition.id, 0.25, currentPrice, currentTs, symbolObj)
                }
                className="py-1 rounded bg-[#141b2c] hover:bg-[#1f2b44] border border-[#202d48] text-gray-300 hover:text-white text-[10px] font-bold cursor-pointer"
              >
                25%
              </button>
              <button
                onClick={() =>
                  closePartialPosition(activePosition.id, 0.5, currentPrice, currentTs, symbolObj)
                }
                className="py-1 rounded bg-[#141b2c] hover:bg-[#1f2b44] border border-[#202d48] text-gray-300 hover:text-white text-[10px] font-bold cursor-pointer"
              >
                50%
              </button>
              <button
                onClick={() =>
                  closePartialPosition(activePosition.id, 0.75, currentPrice, currentTs, symbolObj)
                }
                className="py-1 rounded bg-[#141b2c] hover:bg-[#1f2b44] border border-[#202d48] text-gray-300 hover:text-white text-[10px] font-bold cursor-pointer"
              >
                75%
              </button>
              <button
                onClick={() =>
                  closePartialPosition(activePosition.id, 1.0, currentPrice, currentTs, symbolObj)
                }
                className="py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-[10px] font-bold cursor-pointer"
              >
                Close All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 3: ACCOUNT SUMMARY (SECONDARY)
      ========================================================================= */}
      <div className="p-3.5 border-b border-[#182338] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-white font-bold text-xs uppercase tracking-wider">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Account Summary</span>
          </div>
          <button
            onClick={resetAccount}
            className="text-[10px] text-gray-500 hover:text-rose-400 transition cursor-pointer"
            title="Reset Account to Default Balance"
          >
            Reset
          </button>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between">
            <span className="text-gray-400">Balance</span>
            <span className="text-white font-semibold">{formatCurrency(balance)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Equity</span>
            <span className="text-white font-semibold">{formatCurrency(equity)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Realized P&amp;L</span>
            <span className={cn('font-semibold', realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {formatPnL(realizedPnL)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Win Rate ({closedTrades.length} trades)</span>
            <span className="text-blue-400 font-bold">{winRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: CONTRACT SPECS (TERTIARY)
      ========================================================================= */}
      {symbolObj && (
        <div className="p-3.5 space-y-2 text-[10px] text-gray-400">
          <div className="flex items-center space-x-1.5 text-white font-bold text-xs uppercase tracking-wider">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>Contract Specs</span>
          </div>

          <div className="space-y-1 bg-[#0c111e] p-2.5 rounded-xl border border-[#182338]">
            <div className="flex justify-between">
              <span>Instrument:</span>
              <span className="text-white font-semibold">{symbolObj.displayName} ({symbolObj.id})</span>
            </div>
            <div className="flex justify-between">
              <span>Exchange:</span>
              <span className="text-gray-300">{symbolObj.exchange}</span>
            </div>
            <div className="flex justify-between">
              <span>Tick Size:</span>
              <span className="text-gray-300 font-bold">{symbolObj.tickSize}</span>
            </div>
            <div className="flex justify-between">
              <span>Tick Value:</span>
              <span className="text-amber-400 font-bold">${symbolObj.tickValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Point Value:</span>
              <span className="text-gray-300">${symbolObj.pointValue} / pt</span>
            </div>
            {symbolObj.marginRequirement && (
              <div className="flex justify-between">
                <span>Initial Margin:</span>
                <span className="text-gray-300">${symbolObj.marginRequirement.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
