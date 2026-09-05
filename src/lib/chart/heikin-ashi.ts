import type { OHLCV } from '@/types/market-data';

/**
 * Calculates smoothed Heikin-Ashi candlestick bars from standard OHLCV candles.
 * 
 * Formulas:
 * HA_Close = (Open + High + Low + Close) / 4
 * HA_Open[0] = (Open[0] + Close[0]) / 2
 * HA_Open[i] = (HA_Open[i-1] + HA_Close[i-1]) / 2
 * HA_High = max(High, HA_Open, HA_Close)
 * HA_Low = min(Low, HA_Open, HA_Close)
 */
export function calculateHeikinAshi(candles: OHLCV[]): OHLCV[] {
  if (candles.length === 0) return [];

  const haCandles: OHLCV[] = [];

  for (let i = 0; i < candles.length; i++) {
    const curr = candles[i];

    const haClose = (curr.open + curr.high + curr.low + curr.close) / 4;
    let haOpen = (curr.open + curr.close) / 2;

    if (i > 0) {
      const prevHa = haCandles[i - 1];
      haOpen = (prevHa.open + prevHa.close) / 2;
    }

    const haHigh = Math.max(curr.high, haOpen, haClose);
    const haLow = Math.min(curr.low, haOpen, haClose);

    haCandles.push({
      timestamp: curr.timestamp,
      open: Number(haOpen.toFixed(4)),
      high: Number(haHigh.toFixed(4)),
      low: Number(haLow.toFixed(4)),
      close: Number(haClose.toFixed(4)),
      volume: curr.volume,
    });
  }

  return haCandles;
}
