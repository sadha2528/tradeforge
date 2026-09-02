import type { AccountSettings } from '@/types/account';
import type { ChartSettings } from '@/types/chart';

export const DEFAULT_ACCOUNT_SETTINGS: AccountSettings = {
  startingBalance: 100000,
  currency: 'USD',
  commission: 1.25,
  spread: 0,
  slippage: 0,
  riskPerTrade: 1,
  positionSizingMethod: 'percentage-risk',
  leverage: 1,
  executionAssumption: 'conservative',
};

export const DEFAULT_CHART_SETTINGS: ChartSettings = {
  showVolume: true,
  showCrosshair: true,
  showGrid: true,
  candleUpColor: '#22c55e',
  candleDownColor: '#ef4444',
  backgroundColor: '#0a0e17',
  textColor: '#d1d5db',
  gridColor: '#1a1f2e',
  showPositionsOnChart: true,
  showOrdersOnChart: true,
  showExecutionsOnChart: true,
  showPnLOnChart: true,
};
