import type { OHLCV } from '@/types/market-data';

// Simple seeded PRNG (mulberry32) for reproducible data
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateMockCandles(startPrice: number, count: number, seed: number): OHLCV[] {
  const prng = mulberry32(seed);
  const candles: OHLCV[] = [];
  
  // Start date: 2024-01-15 09:00:00 UTC
  let currentTimestamp = new Date(Date.UTC(2024, 0, 15, 9, 0, 0)).getTime();
  let currentPrice = startPrice;

  // Trend component for generating more realistic price movements
  let trend = 0;

  for (let i = 0; i < count; i++) {
    // Skip weekends
    const date = new Date(currentTimestamp);
    if (date.getUTCDay() === 6) { // Saturday
      currentTimestamp += 2 * 24 * 60 * 60 * 1000;
    } else if (date.getUTCDay() === 0) { // Sunday
      currentTimestamp += 24 * 60 * 60 * 1000;
    }

    // Random walk with mean reversion and occasional trends
    if (prng() < 0.05) { // 5% chance to start a new trend
      trend = (prng() - 0.5) * 0.0005; // -0.00025 to 0.00025
    } else {
      trend *= 0.95; // Trend decay over time
    }
    
    // Occasional volatility spikes
    const isVolatile = prng() < 0.02;
    const volMultiplier = isVolatile ? 3 : 1;

    // Body size: roughly 0.0001 to 0.0015 base
    const maxBody = 0.0015 * volMultiplier;
    const minBody = 0.0001 * volMultiplier;
    const bodySize = (prng() * (maxBody - minBody) + minBody);
    
    // Direction bias based on current trend
    const isUp = prng() + (trend * 1000) > 0.5;

    const open = currentPrice;
    const close = isUp ? open + bodySize : open - bodySize;
    
    // Wicks: 0 to body*1.5
    const upperWick = prng() * bodySize * 1.5;
    const lowerWick = prng() * bodySize * 1.5;

    const high = Math.max(open, close) + upperWick;
    const low = Math.min(open, close) - lowerWick;

    // Volume: 1000 to 50000
    const volume = Math.floor(prng() * 49000) + 1000;

    candles.push({
      timestamp: currentTimestamp,
      open: Number(open.toFixed(5)),
      high: Number(high.toFixed(5)),
      low: Number(low.toFixed(5)),
      close: Number(close.toFixed(5)),
      volume,
    });

    currentPrice = close;
    
    // Increment timestamp by 5 minutes for next candle
    currentTimestamp += 5 * 60 * 1000;
  }

  return candles;
}

export const MOCK_SYMBOL = {
  id: 'eurusd',
  name: 'EURUSD',
  displayName: 'EUR/USD',
  exchange: 'FOREX',
  assetClass: 'forex' as const,
  pricePrecision: 5,
  quantityPrecision: 0,
  minQuantity: 1000,
  tickSize: 0.00001,
};

// Generate 500 deterministic candles starting at 1.0850
export const MOCK_CANDLES: OHLCV[] = generateMockCandles(1.0850, 500, 42);
