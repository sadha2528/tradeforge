import type { OHLCV } from '@/types/market-data';
import type { DrawingPoint, MagnetMode } from '@/types/chart';

export interface CoordinateConverter {
  priceToCoordinate(price: number): number | null;
}

/**
 * Snaps a drawing point (time, price) to the nearest candle's OHLC
 * based on the active MagnetMode:
 * - 'off': returns original point unaltered
 * - 'weak': snaps only if within distance threshold (e.g., 25 pixels or 50% of candle range)
 * - 'strong': unconditionally snaps to closest OHLC price on the nearest candle
 */
export function snapToCandleOHLC(
  rawPt: DrawingPoint,
  mode: MagnetMode,
  candles: OHLCV[],
  converter?: CoordinateConverter | null
): DrawingPoint {
  if (mode === 'off' || !candles || candles.length === 0) {
    return rawPt;
  }

  const targetMs = rawPt.time * 1000;

  // Find candle with the closest timestamp
  let closestCandle = candles[0];
  let minTimeDiff = Math.abs(candles[0].timestamp - targetMs);

  for (let i = 1; i < candles.length; i++) {
    const diff = Math.abs(candles[i].timestamp - targetMs);
    if (diff < minTimeDiff) {
      minTimeDiff = diff;
      closestCandle = candles[i];
    }
  }

  // Candidate OHLC price levels
  const levels = [
    closestCandle.open,
    closestCandle.high,
    closestCandle.low,
    closestCandle.close,
  ];

  let closestPrice = levels[0];
  let minPriceDiff = Math.abs(levels[0] - rawPt.price);

  for (let i = 1; i < levels.length; i++) {
    const pDiff = Math.abs(levels[i] - rawPt.price);
    if (pDiff < minPriceDiff) {
      minPriceDiff = pDiff;
      closestPrice = levels[i];
    }
  }

  const snappedTime = Math.floor(closestCandle.timestamp / 1000);

  if (mode === 'strong') {
    return { time: snappedTime, price: closestPrice };
  }

  // 'weak' magnet mode
  let shouldSnap = true;
  if (converter) {
    const rawY = converter.priceToCoordinate(rawPt.price);
    const snapY = converter.priceToCoordinate(closestPrice);
    if (rawY !== null && snapY !== null) {
      shouldSnap = Math.abs(rawY - snapY) <= 25; // 25 pixel threshold
    }
  } else {
    const candleRange = Math.max(0.0001, closestCandle.high - closestCandle.low);
    shouldSnap = minPriceDiff <= candleRange * 0.5;
  }

  if (shouldSnap) {
    return { time: snappedTime, price: closestPrice };
  }

  return rawPt;
}
