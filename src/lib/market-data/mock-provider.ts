import type { MarketDataProvider, OHLCV, Symbol, Timeframe } from '@/types/market-data';
import { DEFAULT_SYMBOLS, getSymbolById } from '@/config/symbols';
import { resampleBars, quantizePrice } from './resampler';

// Mulberry32 seeded PRNG for 100% deterministic, reproducible data across all clients
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Initial anchor baseline prices and volatilities for each asset
const SYMBOL_CONFIG: Record<string, { startPrice: number; baseVol: number; seed: number; volRatio: number }> = {
  // Futures
  ES: { startPrice: 5850.00, baseVol: 1.50, seed: 101, volRatio: 0.25 },     // ES index around 5850.00
  NQ: { startPrice: 20450.00, baseVol: 8.50, seed: 202, volRatio: 0.25 },    // NQ index around 20450.00
  MES: { startPrice: 5850.00, baseVol: 1.50, seed: 101, volRatio: 0.25 },
  MNQ: { startPrice: 20450.00, baseVol: 8.50, seed: 202, volRatio: 0.25 },
  GC: { startPrice: 2650.00, baseVol: 1.20, seed: 303, volRatio: 0.10 },     // Gold around $2650.00
  CL: { startPrice: 72.50, baseVol: 0.15, seed: 404, volRatio: 0.01 },       // Crude around $72.50
  
  // Forex
  EURUSD: { startPrice: 1.0850, baseVol: 0.0003, seed: 42, volRatio: 0.00001 },
  GBPUSD: { startPrice: 1.2950, baseVol: 0.0004, seed: 505, volRatio: 0.00001 },
  USDJPY: { startPrice: 152.40, baseVol: 0.08, seed: 606, volRatio: 0.001 },

  // Crypto
  BTCUSDT: { startPrice: 68500.00, baseVol: 45.00, seed: 707, volRatio: 0.10 },
  ETHUSDT: { startPrice: 3450.00, baseVol: 4.50, seed: 808, volRatio: 0.01 },

  // Stocks
  AAPL: { startPrice: 230.50, baseVol: 0.35, seed: 909, volRatio: 0.01 },
  NVDA: { startPrice: 135.00, baseVol: 0.40, seed: 1010, volRatio: 0.01 },
  TSLA: { startPrice: 245.00, baseVol: 0.85, seed: 1111, volRatio: 0.01 },
};

export class MockMarketDataProvider implements MarketDataProvider {
  id = 'mock-provider';
  name = 'Built-in Simulated Historical Feed';

  private cache: Map<string, OHLCV[]> = new Map();

  async getSymbols(): Promise<Symbol[]> {
    return DEFAULT_SYMBOLS;
  }

  async getHistoricalBars(
    symbolId: string,
    timeframe: Timeframe,
    count: number = 1000,
    fromTimestamp?: number,
    toTimestamp?: number
  ): Promise<OHLCV[]> {
    const symbol = getSymbolById(symbolId) || DEFAULT_SYMBOLS[0];
    const cacheKey = `${symbol.id}_1m_${fromTimestamp || 'default'}`;

    let base1mBars = this.cache.get(cacheKey);
    if (!base1mBars) {
      const barCount = fromTimestamp && toTimestamp 
        ? Math.max(100, Math.min(10000, Math.ceil((toTimestamp - fromTimestamp) / 60000)))
        : Math.max(2000, count * 2);
      base1mBars = this.generate1mBars(symbol, barCount, fromTimestamp);
      this.cache.set(cacheKey, base1mBars);
    }

    if (timeframe === '1m') {
      return base1mBars.slice(-count);
    }

    const resampled = resampleBars(base1mBars, timeframe);
    return resampled.slice(-count);
  }

  validateDataAvailability(
    symbolId: string,
    timeframe: Timeframe,
    fromTimestamp: number,
    toTimestamp: number
  ): { available: boolean; reason?: string; isSimulated: boolean; barEstimate?: number } {
    if (!fromTimestamp || !toTimestamp) {
      return { available: false, reason: 'Valid date range required', isSimulated: false };
    }
    if (fromTimestamp >= toTimestamp) {
      return { available: false, reason: 'Start date must precede end date', isSimulated: false };
    }
    const validTimeframes: Timeframe[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1D'];
    if (!validTimeframes.includes(timeframe)) {
      return { available: false, reason: `Unsupported timeframe: ${timeframe}`, isSimulated: false };
    }
    const diffMs = toTimestamp - fromTimestamp;
    const minutes = Math.floor(diffMs / (60 * 1000));
    return { available: true, isSimulated: true, barEstimate: minutes };
  }

  async getLatestBar(symbolId: string, timeframe: Timeframe): Promise<OHLCV | null> {
    const bars = await this.getHistoricalBars(symbolId, timeframe, 1);
    return bars.length > 0 ? bars[bars.length - 1] : null;
  }

  async getAvailableTimeframes(): Promise<Timeframe[]> {
    return ['1m', '5m', '15m', '30m', '1h', '4h', '1D'];
  }

  private generate1mBars(symbol: Symbol, count: number, startTime?: number): OHLCV[] {
    const cfg = SYMBOL_CONFIG[symbol.id] || {
      startPrice: 100,
      baseVol: 0.5,
      seed: 42,
      volRatio: symbol.tickSize,
    };

    const prng = mulberry32(cfg.seed);
    const bars: OHLCV[] = [];

    // Start at provided startTime or fallback to 3 days ago in UTC
    let currentTs = startTime ?? Date.UTC(2024, 8, 16, 0, 0, 0);
    let currentPrice = cfg.startPrice;
    let trend = 0;

    for (let i = 0; i < count; i++) {
      const date = new Date(currentTs);
      // Skip weekends for traditional markets (Futures & Forex)
      if (symbol.assetClass !== 'crypto') {
        if (date.getUTCDay() === 6) currentTs += 2 * 86400000;
        else if (date.getUTCDay() === 0) currentTs += 86400000;
      }

      // Trend oscillation
      if (prng() < 0.05) trend = (prng() - 0.5) * cfg.baseVol * 0.4;
      else trend *= 0.96;

      const isVolatile = prng() < 0.03;
      const volMult = isVolatile ? 2.8 : 1.0;
      const delta = (prng() * cfg.baseVol + cfg.volRatio) * volMult;
      const isUp = prng() + trend / (cfg.baseVol || 1) > 0.49;

      const open = quantizePrice(currentPrice, symbol.tickSize, symbol.pricePrecision);
      let close = isUp ? open + delta : open - delta;
      close = quantizePrice(close, symbol.tickSize, symbol.pricePrecision);

      const highDelta = quantizePrice(prng() * delta * 0.8, symbol.tickSize, symbol.pricePrecision);
      const lowDelta = quantizePrice(prng() * delta * 0.8, symbol.tickSize, symbol.pricePrecision);

      const high = Math.max(open, close) + highDelta;
      const low = Math.min(open, close) - lowDelta;
      const volume = Math.floor(prng() * 3500 + 150);

      bars.push({
        timestamp: currentTs,
        open: Number(open.toFixed(symbol.pricePrecision)),
        high: Number(high.toFixed(symbol.pricePrecision)),
        low: Number(low.toFixed(symbol.pricePrecision)),
        close: Number(close.toFixed(symbol.pricePrecision)),
        volume,
      });

      currentPrice = close;
      currentTs += 60 * 1000; // increment 1 minute
    }

    return bars;
  }
}
