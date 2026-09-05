export type OrderSide = 'long' | 'short';
export type OrderType = 'market' | 'limit' | 'stop';
export type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'rejected';
export type PositionStatus = 'open' | 'closed';

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  quantity: number;
  price: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  filledPrice: number | null;
  filledAt: number | null;
  createdAt: number;
  fees: number;
  slippage: number;
}

export interface Position {
  id: string;
  orderId: string;
  symbol: string;
  side: OrderSide;
  status: PositionStatus;
  entryPrice: number;
  entryTime: number;
  exitPrice: number | null;
  exitTime: number | null;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  fees: number;
  slippage: number;
  grossPnL: number;
  netPnL: number;
  riskAmount: number;
  rMultiple: number | null;
  duration: number | null;
}

export interface Trade extends Position {
  setup: string | null;
  notes: string | null;
  emotion: string | null;
  tags: string[];
  screenshotUrl: string | null;
}

export type ExecutionAssumption = 'conservative' | 'optimistic' | 'stop-first' | 'target-first' | 'random' | 'path-aware';
export type PositionSizingMethod = 'fixed-quantity' | 'fixed-dollar' | 'percentage-risk';
