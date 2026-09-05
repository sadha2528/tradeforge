import { Timeframe } from './market-data';
import type { ExecutionAssumption } from './trading';

export type ReplayState = 'idle' | 'playing' | 'paused' | 'finished';
export type ReplaySpeed = 0.25 | 0.5 | 1 | 2 | 5 | 10 | 20 | 25 | 50 | 100;
export type PanelTab = 'positions' | 'orders' | 'trades' | 'statistics' | 'calendar' | 'economic' | 'journal' | 'orderflow';

export type SessionMode = 'manual' | 'prop-firm' | 'free-replay';
export type RiskMode = 'contracts' | 'risk-pct' | 'fixed-dollar';

export interface BacktestSession {
  id: string;
  name: string;
  strategyName: string | null;
  symbol: string;
  market?: string;
  timeframe: Timeframe;
  startingBalance: number;
  riskPerTrade: number;
  mode?: SessionMode;
  riskMode?: RiskMode;
  riskValue?: number;
  commission?: number;
  slippage?: number;
  sameCandlePolicy?: ExecutionAssumption;
  includeETH?: boolean;
  timezone?: string;
  startDate: number;
  endDate: number;
  replayStartTime?: number;
  currentTimestamp: number;
  currentIndex: number;
  preloadCount: number;
  createdAt: number;
  updatedAt: number;
  description?: string;
  tradesCount?: number;
  winRate?: number;
}

