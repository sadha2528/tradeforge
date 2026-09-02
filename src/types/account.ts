import { ExecutionAssumption, PositionSizingMethod } from './trading';

export interface AccountSettings {
  startingBalance: number;
  currency: string;
  commission: number;
  spread: number;
  slippage: number;
  riskPerTrade: number;
  positionSizingMethod: PositionSizingMethod;
  leverage: number;
  executionAssumption: ExecutionAssumption;
}

export interface AccountState {
  balance: number;
  equity: number;
  availableMargin: number;
  usedMargin: number;
  openPnL: number;
  realizedPnL: number;
  dailyPnL: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
}
