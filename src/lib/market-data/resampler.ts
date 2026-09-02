import type { OHLCV, Timeframe } from '@/types/market-data';

export const TIMEFRAME_TO_MS: Record<Timeframe, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1D': 24 * 60 * 60 * 1000,
};

/**
 * Resamples lower-timeframe OHLCV bars into a target higher timeframe.
 * Ensures open is from first bar, high is max, low is min, close is last bar, volume is summed.
 * Bars are strictly bucketed by UTC aligned time periods.
 */
export function resampleBars(bars: OHLCV[], targetTimeframe: Timeframe): OHLCV[] {
  if (bars.length === 0) return [];
  if (targetTimeframe === '1m') return [...bars];

  const intervalMs = TIMEFRAME_TO_MS[targetTimeframe];
  const aggregated: OHLCV[] = [];

  let currentBucketStart = -1;
  let currentOpen = 0;
  let currentHigh = -Infinity;
  let currentLow = Infinity;
  let currentClose = 0;
  let currentVolume = 0;

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const bucketStart = Math.floor(bar.timestamp / intervalMs) * intervalMs;

    if (bucketStart !== currentBucketStart) {
      // Flush previous completed candle
      if (currentBucketStart !== -1) {
        aggregated.push({
          timestamp: currentBucketStart,
          open: currentOpen,
          high: currentHigh,
          low: currentLow,
          close: currentClose,
          volume: currentVolume,
        });
      }

      // Start new candle bucket
      currentBucketStart = bucketStart;
      currentOpen = bar.open;
      currentHigh = bar.high;
      currentLow = bar.low;
      currentClose = bar.close;
      currentVolume = bar.volume;
    } else {
      // Aggregate into current candle bucket
      if (bar.high > currentHigh) currentHigh = bar.high;
      if (bar.low < currentLow) currentLow = bar.low;
      currentClose = bar.close;
      currentVolume += bar.volume;
    }
  }

  // Push final in-progress / last candle
  if (currentBucketStart !== -1) {
    aggregated.push({
      timestamp: currentBucketStart,
      open: currentOpen,
      high: currentHigh,
      low: currentLow,
      close: currentClose,
      volume: currentVolume,
    });
  }

  return aggregated;
}

/**
 * Quantize a price to the instrument's exact tick size.
 */
export function quantizePrice(price: number, tickSize: number, precision: number): number {
  if (tickSize <= 0) return Number(price.toFixed(precision));
  const ticks = Math.round(price / tickSize);
  const rounded = ticks * tickSize;
  return Number(rounded.toFixed(precision));
}
