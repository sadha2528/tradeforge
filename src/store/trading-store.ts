import { create } from 'zustand';
import type { Position, Order, Trade } from '@/types/trading';
import type { AccountSettings } from '@/types/account';
import type { Symbol, OHLCV } from '@/types/market-data';
import { DEFAULT_ACCOUNT_SETTINGS } from '@/config/default-settings';
import { soundEngine } from '@/lib/audio/sound-engine';
import {
  calculateGrossPnL,
  calculateRMultiple,
  calculatePositionSize,
} from '@/lib/trading-engine/calculations';
import {
  evaluatePendingOrders,
  evaluateOpenPositions,
} from '@/lib/trading-engine/execution-simulator';

interface PlaceMarketOrderInput {
  symbol: Symbol;
  side: 'long' | 'short';
  quantity: number;
  currentPrice: number;
  timestamp: number;
  stopLoss?: number;
  takeProfit?: number;
  riskDollars?: number;
}

interface PlacePendingOrderInput {
  symbol: Symbol;
  side: 'long' | 'short';
  type: 'limit' | 'stop';
  price: number;
  quantity: number;
  timestamp: number;
  stopLoss?: number;
  takeProfit?: number;
}

interface TradingStore {
  accountSettings: AccountSettings;
  balance: number;
  equity: number;
  openPnL: number;
  realizedPnL: number;

  positions: Position[];
  closedTrades: Trade[];
  orders: Order[];

  updateAccountSettings: (settings: Partial<AccountSettings>) => void;
  resetAccount: () => void;

  placeMarketOrder: (input: PlaceMarketOrderInput) => Position;
  placePendingOrder: (input: PlacePendingOrderInput) => Order;
  closePosition: (id: string, exitPrice: number, exitTime: number, symbol: Symbol) => void;
  closePartialPosition: (
    id: string,
    fraction: number, // 0.25, 0.5, 0.75, 1.0
    exitPrice: number,
    exitTime: number,
    symbol: Symbol
  ) => void;
  cancelOrder: (id: string) => void;
  updateStopLossTakeProfit: (id: string, stopLoss?: number | null, takeProfit?: number | null) => void;

  onCandleTick: (candle: OHLCV, symbol: Symbol) => void;
}

export const useTradingStore = create<TradingStore>((set, get) => ({
  accountSettings: DEFAULT_ACCOUNT_SETTINGS,
  balance: DEFAULT_ACCOUNT_SETTINGS.startingBalance,
  equity: DEFAULT_ACCOUNT_SETTINGS.startingBalance,
  openPnL: 0,
  realizedPnL: 0,

  positions: [],
  closedTrades: [],
  orders: [],

  updateAccountSettings: (settings) =>
    set((state) => ({
      accountSettings: { ...state.accountSettings, ...settings },
    })),

  resetAccount: () =>
    set((state) => ({
      balance: state.accountSettings.startingBalance,
      equity: state.accountSettings.startingBalance,
      openPnL: 0,
      realizedPnL: 0,
      positions: [],
      closedTrades: [],
      orders: [],
    })),

  placeMarketOrder: (input) => {
    const {
      symbol,
      side,
      quantity,
      currentPrice,
      timestamp,
      stopLoss,
      takeProfit,
      riskDollars,
    } = input;

    const { accountSettings } = get();
    const slippage = accountSettings.slippage || 0;
    const fillPrice =
      side === 'long' ? currentPrice + slippage : currentPrice - slippage;

    const positionId = crypto.randomUUID();
    const orderId = crypto.randomUUID();

    const riskAmount =
      riskDollars ??
      (stopLoss
        ? Math.abs(fillPrice - stopLoss) *
          (symbol.tickValue / symbol.tickSize) *
          quantity
        : 0);

    const newOrder: Order = {
      id: orderId,
      symbol: symbol.id,
      side,
      type: 'market',
      status: 'filled',
      quantity,
      price: currentPrice,
      stopLoss: stopLoss ?? null,
      takeProfit: takeProfit ?? null,
      filledPrice: fillPrice,
      filledAt: timestamp,
      createdAt: timestamp,
      fees: accountSettings.commission || 0,
      slippage,
    };

    const newPosition: Position = {
      id: positionId,
      orderId,
      symbol: symbol.id,
      side,
      status: 'open',
      entryPrice: fillPrice,
      entryTime: timestamp,
      exitPrice: null,
      exitTime: null,
      quantity,
      stopLoss: stopLoss ?? null,
      takeProfit: takeProfit ?? null,
      fees: accountSettings.commission || 0,
      slippage,
      grossPnL: 0,
      netPnL: 0 - (accountSettings.commission || 0),
      riskAmount,
      rMultiple: null,
      duration: 0,
    };

    soundEngine.playOrderFilled();

    set((state) => ({
      orders: [newOrder, ...state.orders],
      positions: [newPosition, ...state.positions],
    }));

    return newPosition;
  },

  placePendingOrder: (input) => {
    const { symbol, side, type, price, quantity, timestamp, stopLoss, takeProfit } = input;
    const { accountSettings } = get();

    const newOrder: Order = {
      id: crypto.randomUUID(),
      symbol: symbol.id,
      side,
      type,
      status: 'pending',
      quantity,
      price,
      stopLoss: stopLoss ?? null,
      takeProfit: takeProfit ?? null,
      filledPrice: null,
      filledAt: null,
      createdAt: timestamp,
      fees: accountSettings.commission || 0,
      slippage: accountSettings.slippage || 0,
    };

    set((state) => ({
      orders: [newOrder, ...state.orders],
    }));

    return newOrder;
  },

  closePosition: (id, exitPrice, exitTime, symbol) => {
    const { closePartialPosition } = get();
    closePartialPosition(id, 1.0, exitPrice, exitTime, symbol);
  },

  closePartialPosition: (id, fraction, exitPrice, exitTime, symbol) => {
    const { positions, closedTrades, balance, realizedPnL, accountSettings } = get();
    const pos = positions.find((p) => p.id === id);
    if (!pos) return;

    const clampedFraction = Math.min(1.0, Math.max(0.1, fraction));
    let closeQty = Math.max(1, Math.round(pos.quantity * clampedFraction));
    if (clampedFraction >= 0.99 || closeQty >= pos.quantity) {
      closeQty = pos.quantity;
    }

    const remainingQty = pos.quantity - closeQty;

    const grossPnL = calculateGrossPnL(
      symbol,
      pos.side,
      pos.entryPrice,
      exitPrice,
      closeQty
    );
    const netPnL = grossPnL - (accountSettings.commission || 0) * 2;
    const closedRiskPortion = pos.riskAmount * (closeQty / pos.quantity);
    const rMultiple = calculateRMultiple(netPnL, closedRiskPortion);

    const closedTrade: Trade = {
      ...pos,
      id: crypto.randomUUID(),
      quantity: closeQty,
      status: 'closed',
      exitPrice,
      exitTime,
      grossPnL,
      netPnL,
      riskAmount: closedRiskPortion,
      rMultiple,
      duration: exitTime - pos.entryTime,
      setup: clampedFraction < 1.0 ? `PARTIAL_CLOSE_${Math.round(clampedFraction * 100)}%` : 'MANUAL',
      notes: `Closed ${closeQty} contract(s) at ${exitPrice.toFixed(symbol.pricePrecision)}`,
      emotion: null,
      tags: ['manual', ...(clampedFraction < 1.0 ? ['scale-out'] : [])],
      screenshotUrl: null,
    };

    if (netPnL > 0) {
      soundEngine.playTakeProfit();
    } else {
      soundEngine.playStopLoss();
    }

    let updatedPositions: Position[];
    if (remainingQty <= 0) {
      updatedPositions = positions.filter((p) => p.id !== id);
    } else {
      updatedPositions = positions.map((p) =>
        p.id === id
          ? {
              ...p,
              quantity: remainingQty,
              riskAmount: pos.riskAmount - closedRiskPortion,
            }
          : p
      );
    }

    const newOpenPnL = updatedPositions.reduce((acc, p) => acc + p.netPnL, 0);
    const newBalance = balance + netPnL;

    set({
      positions: updatedPositions,
      closedTrades: [closedTrade, ...closedTrades],
      balance: newBalance,
      realizedPnL: realizedPnL + netPnL,
      openPnL: newOpenPnL,
      equity: newBalance + newOpenPnL,
    });
  },

  cancelOrder: (id) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status: 'cancelled' as const } : o)),
    })),

  updateStopLossTakeProfit: (id, stopLoss, takeProfit) =>
    set((state) => ({
      positions: state.positions.map((p) =>
        p.id === id
          ? {
              ...p,
              stopLoss: stopLoss !== undefined ? stopLoss : p.stopLoss,
              takeProfit: takeProfit !== undefined ? takeProfit : p.takeProfit,
            }
          : p
      ),
    })),

  onCandleTick: (candle, symbol) => {
    const { orders, positions, closedTrades, balance, realizedPnL, accountSettings } = get();

    // 1. Evaluate pending orders
    const { unfilledOrders, filledPositions, executedOrders } = evaluatePendingOrders(
      orders,
      candle,
      symbol,
      accountSettings
    );

    if (filledPositions.length > 0) {
      soundEngine.playOrderFilled();
    }

    // Combine filled positions with existing open positions
    const allActivePositions = [...positions, ...filledPositions];

    // 2. Evaluate open positions for SL/TP hits and floating P&L recalculation
    const { remainingPositions, closedTrades: newClosedTrades, realizedPnLDelta } = evaluateOpenPositions(
      allActivePositions,
      candle,
      symbol,
      accountSettings
    );

    if (newClosedTrades.length > 0) {
      const isProfitable = newClosedTrades.some((t) => t.netPnL > 0);
      if (isProfitable) soundEngine.playTakeProfit();
      else soundEngine.playStopLoss();
    }

    const updatedBalance = balance + realizedPnLDelta;
    const updatedRealizedPnL = realizedPnL + realizedPnLDelta;
    const updatedOpenPnL = remainingPositions.reduce((sum, p) => sum + p.netPnL, 0);
    const updatedEquity = updatedBalance + updatedOpenPnL;

    const updatedOrders = orders.map((o) => {
      const match = executedOrders.find((ex) => ex.id === o.id);
      return match || o;
    });

    set({
      orders: updatedOrders,
      positions: remainingPositions,
      closedTrades: [...newClosedTrades, ...closedTrades],
      balance: updatedBalance,
      realizedPnL: updatedRealizedPnL,
      openPnL: updatedOpenPnL,
      equity: updatedEquity,
    });
  },
}));
