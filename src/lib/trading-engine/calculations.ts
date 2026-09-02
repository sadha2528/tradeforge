import type { Symbol } from '@/types/market-data';
import type { OrderSide } from '@/types/trading';

/**
 * Calculates Gross P&L based on asset class (Futures tick value multiplier vs standard units)
 */
export function calculateGrossPnL(
  symbol: Symbol,
  side: OrderSide,
  entryPrice: number,
  exitPrice: number,
  quantity: number
): number {
  if (quantity <= 0 || !entryPrice || !exitPrice) return 0;

  const priceDelta = side === 'long' ? exitPrice - entryPrice : entryPrice - exitPrice;

  if (symbol.assetClass === 'futures') {
    // Tick-aware Futures formula: (delta / tickSize) * tickValue * contracts
    const ticks = priceDelta / (symbol.tickSize || 0.25);
    const tickVal = symbol.tickValue || (symbol.tickSize * (symbol.pointValue || 1));
    return ticks * tickVal * quantity;
  }

  // Standard Forex / Stocks / Crypto formula
  const multiplier = symbol.contractSize || symbol.pointValue || 1;
  return priceDelta * multiplier * quantity;
}

/**
 * Calculates Net P&L after transaction commissions, spread, and slippage
 */
export function calculateNetPnL(grossPnL: number, fees: number = 0, slippageCost: number = 0): number {
  return grossPnL - fees - slippageCost;
}

/**
 * Calculates R-Multiple (Risk:Reward realized ratio)
 */
export function calculateRMultiple(netPnL: number, riskAmount: number): number | null {
  if (!riskAmount || riskAmount <= 0) return null;
  const r = netPnL / riskAmount;
  return Number(r.toFixed(2));
}

/**
 * Calculates Position Size (Contracts / Lots) based on Account Balance & % Risk
 */
export function calculatePositionSize(
  balance: number,
  riskPercent: number,
  entryPrice: number,
  stopLossPrice: number,
  symbol: Symbol
): { quantity: number; dollarRisk: number; ticksRisk: number } {
  if (balance <= 0 || riskPercent <= 0 || !entryPrice || !stopLossPrice || entryPrice === stopLossPrice) {
    return { quantity: symbol.minQuantity || 1, dollarRisk: 0, ticksRisk: 0 };
  }

  const dollarRisk = balance * (riskPercent / 100);
  const priceDistance = Math.abs(entryPrice - stopLossPrice);
  const ticksRisk = priceDistance / (symbol.tickSize || 0.25);

  let riskPerUnit = 0;
  if (symbol.assetClass === 'futures') {
    const tickVal = symbol.tickValue || (symbol.tickSize * (symbol.pointValue || 1));
    riskPerUnit = ticksRisk * tickVal;
  } else {
    const multiplier = symbol.contractSize || symbol.pointValue || 1;
    riskPerUnit = priceDistance * multiplier;
  }

  if (riskPerUnit <= 0) {
    return { quantity: symbol.minQuantity || 1, dollarRisk, ticksRisk };
  }

  const rawQty = dollarRisk / riskPerUnit;
  const quantity = Math.max(symbol.minQuantity || 1, Math.floor(rawQty));

  return {
    quantity,
    dollarRisk: Number(dollarRisk.toFixed(2)),
    ticksRisk: Math.round(ticksRisk),
  };
}

/**
 * Calculates used margin for a position
 */
export function calculateMargin(symbol: Symbol, quantity: number): number {
  if (symbol.marginRequirement) {
    return symbol.marginRequirement * quantity;
  }
  // Default 5% initial margin for other instruments
  return 0;
}
