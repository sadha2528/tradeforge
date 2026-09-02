export const APP_NAME = 'TradeForge';
export const APP_TAGLINE = 'Backtest. Replay. Improve.';

export const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1D'] as const;

export const REPLAY_SPEEDS = [0.25, 0.5, 1, 2, 5, 10, 20, 50, 100] as const;

export const CHART_COLORS = {
  background: '#0a0e17',
  text: '#d1d5db',
  grid: '#1a1f2e',
  candleUp: '#22c55e',
  candleDown: '#ef4444',
  volume: '#334155',
  crosshair: '#6b7280',
  stopLoss: '#ef4444',
  takeProfit: '#22c55e',
  entry: '#3b82f6',
  position: '#8b5cf6',
} as const;

export const INITIAL_VISIBLE_CANDLES = 100;
export const PRELOAD_CANDLE_COUNT = 200;
