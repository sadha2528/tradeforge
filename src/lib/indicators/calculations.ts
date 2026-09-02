import type { OHLCV } from '@/types/market-data';

export interface IndicatorPoint {
  time: number; // Unix timestamp in seconds for Lightweight Charts
  value: number;
}

export interface BollingerBandsPoint {
  time: number;
  upper: number;
  middle: number;
  lower: number;
}

export interface MACDPoint {
  time: number;
  macd: number;
  signal: number;
  histogram: number;
}

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(candles: OHLCV[], period: number = 20): IndicatorPoint[] {
  if (candles.length < period) return [];

  const result: IndicatorPoint[] = [];
  let sum = 0;

  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;

    if (i >= period) {
      sum -= candles[i - period].close;
    }

    if (i >= period - 1) {
      result.push({
        time: Math.floor(candles[i].timestamp / 1000),
        value: Number((sum / period).toFixed(4)),
      });
    }
  }

  return result;
}

/**
 * Exponential Moving Average (EMA)
 * Formula: EMA_t = Price_t * multiplier + EMA_{t-1} * (1 - multiplier)
 */
export function calculateEMA(candles: OHLCV[], period: number = 20): IndicatorPoint[] {
  if (candles.length < period) return [];

  const result: IndicatorPoint[] = [];
  const multiplier = 2 / (period + 1);

  // Initial SMA as starting EMA
  let initialSum = 0;
  for (let i = 0; i < period; i++) {
    initialSum += candles[i].close;
  }
  let prevEMA = initialSum / period;

  result.push({
    time: Math.floor(candles[period - 1].timestamp / 1000),
    value: Number(prevEMA.toFixed(4)),
  });

  for (let i = period; i < candles.length; i++) {
    const currentPrice = candles[i].close;
    const currentEMA = (currentPrice - prevEMA) * multiplier + prevEMA;
    prevEMA = currentEMA;

    result.push({
      time: Math.floor(candles[i].timestamp / 1000),
      value: Number(currentEMA.toFixed(4)),
    });
  }

  return result;
}

/**
 * Relative Strength Index (RSI)
 * Uses Wilder's smoothed averages
 */
export function calculateRSI(candles: OHLCV[], period: number = 14): IndicatorPoint[] {
  if (candles.length <= period) return [];

  const result: IndicatorPoint[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const initialRSI = 100 - 100 / (1 + rs);

  result.push({
    time: Math.floor(candles[period].timestamp / 1000),
    value: Number(initialRSI.toFixed(2)),
  });

  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const curRS = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + curRS);

    result.push({
      time: Math.floor(candles[i].timestamp / 1000),
      value: Number(rsi.toFixed(2)),
    });
  }

  return result;
}

/**
 * Moving Average Convergence Divergence (MACD)
 */
export function calculateMACD(
  candles: OHLCV[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDPoint[] {
  if (candles.length < slowPeriod + signalPeriod) return [];

  const fastEMA = calculateEMA(candles, fastPeriod);
  const slowEMA = calculateEMA(candles, slowPeriod);

  // Map slow and fast EMAs by timestamp
  const fastMap = new Map<number, number>(fastEMA.map((p) => [p.time, p.value]));
  const macdLineRaw: { time: number; value: number }[] = [];

  slowEMA.forEach((slow) => {
    const fast = fastMap.get(slow.time);
    if (fast !== undefined) {
      macdLineRaw.push({
        time: slow.time,
        value: fast - slow.value,
      });
    }
  });

  // Calculate Signal EMA of the MACD Line
  const signalMultiplier = 2 / (signalPeriod + 1);
  let signalSum = 0;
  for (let i = 0; i < signalPeriod; i++) {
    signalSum += macdLineRaw[i].value;
  }
  let prevSignal = signalSum / signalPeriod;

  const result: MACDPoint[] = [];

  for (let i = signalPeriod - 1; i < macdLineRaw.length; i++) {
    const macdVal = macdLineRaw[i].value;
    if (i >= signalPeriod) {
      prevSignal = (macdVal - prevSignal) * signalMultiplier + prevSignal;
    }
    const histogram = macdVal - prevSignal;

    result.push({
      time: macdLineRaw[i].time,
      macd: Number(macdVal.toFixed(4)),
      signal: Number(prevSignal.toFixed(4)),
      histogram: Number(histogram.toFixed(4)),
    });
  }

  return result;
}

/**
 * Bollinger Bands
 */
export function calculateBollingerBands(
  candles: OHLCV[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBandsPoint[] {
  if (candles.length < period) return [];

  const result: BollingerBandsPoint[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const mean = slice.reduce((acc, c) => acc + c.close, 0) / period;

    const variance = slice.reduce((acc, c) => acc + Math.pow(c.close - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    result.push({
      time: Math.floor(candles[i].timestamp / 1000),
      upper: Number((mean + stdDevMultiplier * stdDev).toFixed(4)),
      middle: Number(mean.toFixed(4)),
      lower: Number((mean - stdDevMultiplier * stdDev).toFixed(4)),
    });
  }

  return result;
}

/**
 * Average True Range (ATR)
 */
export function calculateATR(candles: OHLCV[], period: number = 14): IndicatorPoint[] {
  if (candles.length <= period) return [];

  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trs.push(tr);
  }

  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const result: IndicatorPoint[] = [
    {
      time: Math.floor(candles[period].timestamp / 1000),
      value: Number(atr.toFixed(4)),
    },
  ];

  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
    result.push({
      time: Math.floor(candles[i + 1].timestamp / 1000),
      value: Number(atr.toFixed(4)),
    });
  }

  return result;
}

/**
 * Volume Weighted Average Price (VWAP)
 */
export function calculateVWAP(candles: OHLCV[]): IndicatorPoint[] {
  if (candles.length === 0) return [];

  const result: IndicatorPoint[] = [];
  let cumulativeTPV = 0;
  let cumulativeVol = 0;
  let currentDay = new Date(candles[0].timestamp).getUTCDate();

  candles.forEach((c) => {
    const day = new Date(c.timestamp).getUTCDate();
    if (day !== currentDay) {
      cumulativeTPV = 0;
      cumulativeVol = 0;
      currentDay = day;
    }

    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumulativeTPV += typicalPrice * c.volume;
    cumulativeVol += c.volume;

    const vwap = cumulativeVol > 0 ? cumulativeTPV / cumulativeVol : typicalPrice;

    result.push({
      time: Math.floor(c.timestamp / 1000),
      value: Number(vwap.toFixed(4)),
    });
  });

  return result;
}
