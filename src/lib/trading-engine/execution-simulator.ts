import type { Symbol, OHLCV } from '@/types/market-data';
import type { Order, Position, Trade, OrderStatus } from '@/types/trading';
import type { AccountSettings } from '@/types/account';
import { calculateGrossPnL, calculateNetPnL, calculateRMultiple } from './calculations';

export interface PendingOrderEvaluationResult {
  unfilledOrders: Order[];
  filledPositions: Position[];
  executedOrders: Order[];
}

export interface PositionEvaluationResult {
  remainingPositions: Position[];
  closedTrades: Trade[];
  realizedPnLDelta: number;
}

/**
 * Evaluates pending limit and stop orders against the current candle
 */
export function evaluatePendingOrders(
  orders: Order[],
  candle: OHLCV,
  symbol: Symbol,
  settings: AccountSettings
): PendingOrderEvaluationResult {
  const unfilledOrders: Order[] = [];
  const filledPositions: Position[] = [];
  const executedOrders: Order[] = [];

  for (const order of orders) {
    if (order.status !== 'pending' || order.symbol !== symbol.id || order.price === null) {
      unfilledOrders.push(order);
      continue;
    }

    let isFilled = false;
    let fillPrice = order.price;

    if (order.type === 'limit') {
      if (order.side === 'long' && candle.low <= order.price) {
        isFilled = true;
        fillPrice = Math.min(order.price, candle.open); // Price improvement if opened below limit
      } else if (order.side === 'short' && candle.high >= order.price) {
        isFilled = true;
        fillPrice = Math.max(order.price, candle.open);
      }
    } else if (order.type === 'stop') {
      if (order.side === 'long' && candle.high >= order.price) {
        isFilled = true;
        fillPrice = Math.max(order.price, candle.open) + (settings.slippage || 0);
      } else if (order.side === 'short' && candle.low <= order.price) {
        isFilled = true;
        fillPrice = Math.min(order.price, candle.open) - (settings.slippage || 0);
      }
    }

    if (isFilled) {
      const updatedOrder: Order = {
        ...order,
        status: 'filled',
        filledPrice: fillPrice,
        filledAt: candle.timestamp,
      };
      executedOrders.push(updatedOrder);

      // Create new open position
      const riskAmount = order.stopLoss
        ? Math.abs(calculateGrossPnL(symbol, order.side, fillPrice, order.stopLoss, order.quantity))
        : 0;

      const newPos: Position = {
        id: crypto.randomUUID(),
        orderId: order.id,
        symbol: symbol.id,
        side: order.side,
        status: 'open',
        entryPrice: fillPrice,
        entryTime: candle.timestamp,
        exitPrice: null,
        exitTime: null,
        quantity: order.quantity,
        stopLoss: order.stopLoss,
        takeProfit: order.takeProfit,
        fees: settings.commission || 0,
        slippage: settings.slippage || 0,
        grossPnL: 0,
        netPnL: 0 - (settings.commission || 0),
        riskAmount,
        rMultiple: null,
        duration: 0,
      };
      filledPositions.push(newPos);
    } else {
      unfilledOrders.push(order);
    }
  }

  return { unfilledOrders, filledPositions, executedOrders };
}

/**
 * Evaluates open positions against current candle for Stop Loss & Take Profit hits
 */
export function evaluateOpenPositions(
  positions: Position[],
  candle: OHLCV,
  symbol: Symbol,
  settings: AccountSettings
): PositionEvaluationResult {
  const remainingPositions: Position[] = [];
  const closedTrades: Trade[] = [];
  let realizedPnLDelta = 0;

  for (const pos of positions) {
    if (pos.status !== 'open' || pos.symbol !== symbol.id) {
      remainingPositions.push(pos);
      continue;
    }

    let isClosed = false;
    let exitPrice = candle.close;
    let exitReason = 'manual';

    const preferTarget = settings.executionAssumption === 'target-first' || settings.executionAssumption === 'optimistic';

    if (pos.side === 'long') {
      const slHit = pos.stopLoss !== null && candle.low <= pos.stopLoss;
      const tpHit = pos.takeProfit !== null && candle.high >= pos.takeProfit;

      if (slHit && tpHit) {
        // Same-candle collision -> apply configurable policy
        isClosed = true;
        if (preferTarget) {
          exitPrice = pos.takeProfit!;
          exitReason = 'tp';
        } else {
          exitPrice = pos.stopLoss!;
          exitReason = 'sl';
        }
      } else if (slHit) {
        isClosed = true;
        exitPrice = pos.stopLoss!;
        exitReason = 'sl';
      } else if (tpHit) {
        isClosed = true;
        exitPrice = pos.takeProfit!;
        exitReason = 'tp';
      }
    } else if (pos.side === 'short') {
      const slHit = pos.stopLoss !== null && candle.high >= pos.stopLoss;
      const tpHit = pos.takeProfit !== null && candle.low <= pos.takeProfit;

      if (slHit && tpHit) {
        // Same-candle collision -> apply configurable policy
        isClosed = true;
        if (preferTarget) {
          exitPrice = pos.takeProfit!;
          exitReason = 'tp';
        } else {
          exitPrice = pos.stopLoss!;
          exitReason = 'sl';
        }
      } else if (slHit) {
        isClosed = true;
        exitPrice = pos.stopLoss!;
        exitReason = 'sl';
      } else if (tpHit) {
        isClosed = true;
        exitPrice = pos.takeProfit!;
        exitReason = 'tp';
      }
    }

    if (isClosed) {
      const grossPnL = calculateGrossPnL(symbol, pos.side, pos.entryPrice, exitPrice, pos.quantity);
      const netPnL = calculateNetPnL(grossPnL, pos.fees * 2, pos.slippage);
      const rMultiple = calculateRMultiple(netPnL, pos.riskAmount);
      const duration = candle.timestamp - pos.entryTime;

      const closedTrade: Trade = {
        ...pos,
        status: 'closed',
        exitPrice,
        exitTime: candle.timestamp,
        grossPnL,
        netPnL,
        rMultiple,
        duration,
        setup: exitReason.toUpperCase(),
        notes: `Exited on ${exitReason.toUpperCase()} at ${exitPrice}`,
        emotion: null,
        tags: [exitReason],
        screenshotUrl: null,
      };

      closedTrades.push(closedTrade);
      realizedPnLDelta += netPnL;
    } else {
      // Recalculate floating unrealized P&L
      const floatingGross = calculateGrossPnL(symbol, pos.side, pos.entryPrice, candle.close, pos.quantity);
      const floatingNet = calculateNetPnL(floatingGross, pos.fees, 0);
      const rMultiple = calculateRMultiple(floatingNet, pos.riskAmount);

      remainingPositions.push({
        ...pos,
        grossPnL: floatingGross,
        netPnL: floatingNet,
        rMultiple,
        duration: candle.timestamp - pos.entryTime,
      });
    }
  }

  return { remainingPositions, closedTrades, realizedPnLDelta };
}
