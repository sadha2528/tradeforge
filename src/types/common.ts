import { Timeframe } from './market-data';

export type ReplayState = 'idle' | 'playing' | 'paused' | 'finished';
export type ReplaySpeed = 0.25 | 0.5 | 1 | 2 | 5 | 10 | 20 | 25 | 50 | 100;
export type PanelTab = 'positions' | 'orders' | 'trades' | 'statistics' | 'calendar' | 'economic' | 'journal';

export interface BacktestSession {
  id: string;
  name: string;
  strategyName: string | null;
  symbol: string;
  timeframe: Timeframe;
  startingBalance: number;
  riskPerTrade: number;
  currentTimestamp: number;
  currentIndex: number;
  preloadCount: number;
  startDate: number;
  endDate: number;
  createdAt: number;
  updatedAt: number;
  description?: string;
  tradesCount?: number;
  winRate?: number;
}
