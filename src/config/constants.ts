export const APP_NAME = 'TradeForge';
export const APP_TAGLINE = 'Backtest. Replay. Improve.';

export const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1D'] as const;

export const REPLAY_SPEEDS = [0.25, 0.5, 1, 2, 5, 10, 20, 25, 50, 100] as const;

export const CHART_COLORS = {
  background: '#131722', // Official TradingView dark chart background
  text: '#d1d4dc',       // TradingView light text
  grid: '#1e222d',       // TradingView subtle grid lines
  candleUp: '#089981',   // TradingView green (teal)
  candleDown: '#F23645', // TradingView red
  volumeUp: 'rgba(8, 153, 129, 0.4)',
  volumeDown: 'rgba(242, 54, 69, 0.4)',
  volume: '#334155',
  crosshair: '#787b86',  // TradingView crosshair color
  crosshairLabel: '#2a2e39',
  stopLoss: '#F23645',
  takeProfit: '#089981',
  entry: '#2962FF',      // TradingView blue
  position: '#8b5cf6',
} as const;

export const INITIAL_VISIBLE_CANDLES = 100;
export const PRELOAD_CANDLE_COUNT = 200;
