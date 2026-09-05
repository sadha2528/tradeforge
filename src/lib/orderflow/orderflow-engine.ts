import type { OHLCV, Symbol } from '@/types/market-data';
import type {
  PriceLevelVolume,
  CandleFootprint,
  DOMBook,
  DOMLevel,
  TapePrint,
  VolumeProfileData,
  VolumeProfileLevel,
  OrderFlowSettings,
} from '@/types/orderflow';
import { DEFAULT_ORDERFLOW_SETTINGS } from '@/types/orderflow';

// Mulberry32 deterministic PRNG
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate intra-candle cluster footprint data for a single candle.
 * Deterministic based on candle timestamp and symbol tick size.
 */
export function generateCandleFootprint(
  candle: OHLCV,
  symbol: Symbol,
  settings: OrderFlowSettings = DEFAULT_ORDERFLOW_SETTINGS,
  prevCumDelta: number = 0
): CandleFootprint {
  const tickSize = symbol.tickSize || 0.25;
  const precision = symbol.pricePrecision || 2;
  const prng = mulberry32(candle.timestamp ^ Math.floor(candle.close * 100));

  const lowTicks = Math.round(candle.low / tickSize);
  const highTicks = Math.round(candle.high / tickSize);
  const openTicks = Math.round(candle.open / tickSize);
  const closeTicks = Math.round(candle.close / tickSize);

  const numTicks = Math.max(1, highTicks - lowTicks + 1);
  const isBullish = candle.close >= candle.open;

  // Approximate fair value price center (weighted toward body center)
  const bodyCenterTick = (openTicks + closeTicks) / 2;

  // Distribute total candle volume across price ticks using a bell curve
  const rawVolumes: number[] = [];
  let rawVolSum = 0;

  for (let t = lowTicks; t <= highTicks; t++) {
    const dist = Math.abs(t - bodyCenterTick);
    // Gaussian-like curve with tails at wicks
    const weight = Math.exp(-(dist * dist) / Math.max(4, numTicks * 0.8)) + prng() * 0.15;
    rawVolumes.push(weight);
    rawVolSum += weight;
  }

  // Normalize volumes so they sum to candle.volume exactly
  const scale = candle.volume / Math.max(0.001, rawVolSum);
  const quantizedVols = rawVolumes.map((w) => Math.max(1, Math.round(w * scale)));
  const quantizedSum = quantizedVols.reduce((s, v) => s + v, 0);
  const diff = candle.volume - quantizedSum;

  let peakIdx = 0;
  let peakVal = -1;
  for (let i = 0; i < quantizedVols.length; i++) {
    if (quantizedVols[i] > peakVal) {
      peakVal = quantizedVols[i];
      peakIdx = i;
    }
  }
  quantizedVols[peakIdx] = Math.max(1, quantizedVols[peakIdx] + diff);

  const levelVolumes: PriceLevelVolume[] = [];
  let maxVolume = -1;
  let pocPrice = candle.close;
  let candleDelta = 0;
  let runningDelta = 0;
  let minDelta = 0;
  let maxDelta = 0;

  for (let i = 0; i < numTicks; i++) {
    const tickIndex = lowTicks + i;
    const price = Number((tickIndex * tickSize).toFixed(precision));
    const totalLevelVol = quantizedVols[i];

    // Directional bias for bid vs ask split:
    // When price is near high of candle, aggressive buyers were active
    // When price is near low of candle, aggressive sellers were active
    const relativePos = (tickIndex - lowTicks) / Math.max(1, numTicks - 1); // 0 at low, 1 at high
    let buyRatio = 0.5;

    if (isBullish) {
      buyRatio = 0.45 + relativePos * 0.3 + (prng() - 0.5) * 0.15;
    } else {
      buyRatio = 0.55 - (1 - relativePos) * 0.3 + (prng() - 0.5) * 0.15;
    }
    buyRatio = Math.max(0.1, Math.min(0.9, buyRatio));

    const askVol = Math.round(totalLevelVol * buyRatio);
    const bidVol = Math.max(1, totalLevelVol - askVol);
    const delta = askVol - bidVol;

    candleDelta += delta;
    runningDelta += delta;
    if (runningDelta > maxDelta) maxDelta = runningDelta;
    if (runningDelta < minDelta) minDelta = runningDelta;

    if (totalLevelVol > maxVolume) {
      maxVolume = totalLevelVol;
      pocPrice = price;
    }

    levelVolumes.push({
      price,
      bidVolume: bidVol,
      askVolume: askVol,
      totalVolume: totalLevelVol,
      delta,
      isPOC: false, // will mark after loop
      isImbalanceBuy: false,
      isImbalanceSell: false,
    });
  }

  // Mark POC
  for (const lvl of levelVolumes) {
    if (Math.abs(lvl.price - pocPrice) < tickSize * 0.5) {
      lvl.isPOC = true;
      break;
    }
  }

  // Calculate diagonal imbalances if enabled
  // Standard Footprint diagonal comparison: Ask at (P + tick) vs Bid at P
  if (settings.showImbalances) {
    const ratio = settings.imbalanceRatio || 3.0;
    const minVol = settings.minImbalanceVolume || 10;

    for (let i = 0; i < levelVolumes.length - 1; i++) {
      const lowerLvl = levelVolumes[i];
      const upperLvl = levelVolumes[i + 1];

      // Buy Imbalance: Ask volume above is >= Bid volume below * ratio
      if (upperLvl.askVolume >= lowerLvl.bidVolume * ratio && upperLvl.askVolume >= minVol) {
        upperLvl.isImbalanceBuy = true;
      }

      // Sell Imbalance: Bid volume below is >= Ask volume above * ratio
      if (lowerLvl.bidVolume >= upperLvl.askVolume * ratio && lowerLvl.bidVolume >= minVol) {
        lowerLvl.isImbalanceSell = true;
      }
    }
  }

  return {
    timestamp: candle.timestamp,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    totalVolume: candle.volume,
    delta: candleDelta,
    minDelta,
    maxDelta,
    cumDelta: prevCumDelta + candleDelta,
    pocPrice,
    levels: levelVolumes,
  };
}

/**
 * Generate full session footprints and Cumulative Volume Delta (CVD)
 * for a list of visible candles.
 */
export function generateSessionFootprints(
  candles: OHLCV[],
  symbol: Symbol,
  settings: OrderFlowSettings = DEFAULT_ORDERFLOW_SETTINGS
): { footprints: CandleFootprint[]; cvdPoints: { time: number; delta: number; cumDelta: number }[] } {
  const footprints: CandleFootprint[] = [];
  const cvdPoints: { time: number; delta: number; cumDelta: number }[] = [];
  let cumDelta = 0;

  for (const candle of candles) {
    const fp = generateCandleFootprint(candle, symbol, settings, cumDelta);
    cumDelta = fp.cumDelta;
    footprints.push(fp);
    cvdPoints.push({
      time: Math.floor(candle.timestamp / 1000),
      delta: fp.delta,
      cumDelta: fp.cumDelta,
    });
  }

  return { footprints, cvdPoints };
}

/**
 * Compute Session Volume Profile (POC, VAH 70%, VAL 70%)
 * from candle footprints or raw OHLCV.
 */
export function calculateVolumeProfile(
  footprints: CandleFootprint[],
  symbol: Symbol,
  valueAreaPercent: number = 70
): VolumeProfileData {
  const tickSize = symbol.tickSize || 0.25;
  const precision = symbol.pricePrecision || 2;
  const levelMap = new Map<number, VolumeProfileLevel>();

  let totalVolume = 0;
  let totalDelta = 0;

  for (const fp of footprints) {
    for (const lvl of fp.levels) {
      const existing = levelMap.get(lvl.price);
      if (existing) {
        existing.volume += lvl.totalVolume;
        existing.bidVolume += lvl.bidVolume;
        existing.askVolume += lvl.askVolume;
        existing.delta += lvl.delta;
      } else {
        levelMap.set(lvl.price, {
          price: lvl.price,
          volume: lvl.totalVolume,
          bidVolume: lvl.bidVolume,
          askVolume: lvl.askVolume,
          delta: lvl.delta,
        });
      }
      totalVolume += lvl.totalVolume;
      totalDelta += lvl.delta;
    }
  }

  const sortedLevels = Array.from(levelMap.values()).sort((a, b) => a.price - b.price);

  if (sortedLevels.length === 0) {
    return { poc: 0, vah: 0, val: 0, totalVolume: 0, totalDelta: 0, levels: [] };
  }

  // Find POC
  let maxVol = -1;
  let pocIndex = 0;
  for (let i = 0; i < sortedLevels.length; i++) {
    if (sortedLevels[i].volume > maxVol) {
      maxVol = sortedLevels[i].volume;
      pocIndex = i;
    }
  }
  const pocPrice = sortedLevels[pocIndex].price;

  // Calculate Value Area (default 70% of total volume)
  const targetVAVolume = totalVolume * (valueAreaPercent / 100);
  let vaVolume = sortedLevels[pocIndex].volume;
  let upperIdx = pocIndex;
  let lowerIdx = pocIndex;

  while (vaVolume < targetVAVolume && (upperIdx < sortedLevels.length - 1 || lowerIdx > 0)) {
    const nextUpperVol = upperIdx < sortedLevels.length - 1 ? sortedLevels[upperIdx + 1].volume : 0;
    const nextLowerVol = lowerIdx > 0 ? sortedLevels[lowerIdx - 1].volume : 0;

    if (nextUpperVol >= nextLowerVol && upperIdx < sortedLevels.length - 1) {
      upperIdx++;
      vaVolume += sortedLevels[upperIdx].volume;
    } else if (lowerIdx > 0) {
      lowerIdx--;
      vaVolume += sortedLevels[lowerIdx].volume;
    } else if (upperIdx < sortedLevels.length - 1) {
      upperIdx++;
      vaVolume += sortedLevels[upperIdx].volume;
    } else {
      break;
    }
  }

  const vah = sortedLevels[upperIdx].price;
  const val = sortedLevels[lowerIdx].price;

  return {
    poc: Number(pocPrice.toFixed(precision)),
    vah: Number(vah.toFixed(precision)),
    val: Number(val.toFixed(precision)),
    totalVolume,
    totalDelta,
    levels: sortedLevels,
  };
}

/**
 * Generate realistic Level 2 Depth of Market (DOM) book
 * centered around current market price.
 */
export function generateDOMBook(
  symbol: Symbol,
  currentPrice: number,
  workingOrders: { price: number; side: 'long' | 'short'; quantity: number }[] = [],
  numLevels: number = 20
): DOMBook {
  const tickSize = symbol.tickSize || 0.25;
  const precision = symbol.pricePrecision || 2;
  const prng = mulberry32(Math.floor(currentPrice * 100) ^ numLevels);

  const levels: DOMLevel[] = [];
  const currentTick = Math.round(currentPrice / tickSize);

  let totalBidDepth = 0;
  let totalAskDepth = 0;

  for (let i = -numLevels; i <= numLevels; i++) {
    const tick = currentTick + i;
    const price = Number((tick * tickSize).toFixed(precision));
    const isCurrentPrice = i === 0;
    const isInsideBid = i === -1;
    const isInsideAsk = i === 1;

    // Resting size increases away from inside market with realistic liquidity tiers
    const distFromMarket = Math.abs(i);
    let bidSize = 0;
    let askSize = 0;

    if (i <= 0) {
      // Bids (at and below current price)
      const baseBid = Math.floor(15 + distFromMarket * 12 + prng() * 40);
      bidSize = i === 0 ? 0 : baseBid;
      totalBidDepth += bidSize;
    }

    if (i >= 0) {
      // Asks (at and above current price)
      const baseAsk = Math.floor(15 + distFromMarket * 12 + prng() * 40);
      askSize = i === 0 ? 0 : baseAsk;
      totalAskDepth += askSize;
    }

    const volumeAtPrice = Math.floor(200 + (numLevels - distFromMarket) * 80 + prng() * 150);

    // Check my working orders at this price
    const myBuys = workingOrders
      .filter((o) => o.side === 'long' && Math.abs(o.price - price) < tickSize * 0.5)
      .reduce((sum, o) => sum + o.quantity, 0);

    const mySells = workingOrders
      .filter((o) => o.side === 'short' && Math.abs(o.price - price) < tickSize * 0.5)
      .reduce((sum, o) => sum + o.quantity, 0);

    levels.push({
      price,
      bidSize,
      askSize,
      volumeAtPrice,
      isCurrentPrice,
      isInsideBid,
      isInsideAsk,
      myWorkingBuys: myBuys > 0 ? myBuys : undefined,
      myWorkingSells: mySells > 0 ? mySells : undefined,
    });
  }

  return {
    symbol: symbol.id,
    currentPrice,
    spread: tickSize,
    levels: levels.sort((a, b) => b.price - a.price), // highest price at top for DOM ladder
    totalBidDepth,
    totalAskDepth,
  };
}

/**
 * Generate Time & Sales tape prints for the current candle.
 */
export function generateTapePrints(
  candle: OHLCV,
  symbol: Symbol,
  count: number = 15
): TapePrint[] {
  const tickSize = symbol.tickSize || 0.25;
  const precision = symbol.pricePrecision || 2;
  const prng = mulberry32(candle.timestamp ^ count);

  const prints: TapePrint[] = [];
  const startTs = candle.timestamp;
  const duration = 5 * 60 * 1000; // 5 min default bar span

  for (let i = 0; i < count; i++) {
    const progress = i / count;
    const ts = startTs + Math.floor(progress * duration);

    // Interpolate price path between open, low, high, and close
    let estPrice = candle.open;
    if (progress < 0.3) {
      estPrice = candle.open + (candle.low - candle.open) * (progress / 0.3);
    } else if (progress < 0.7) {
      estPrice = candle.low + (candle.high - candle.low) * ((progress - 0.3) / 0.4);
    } else {
      estPrice = candle.high + (candle.close - candle.high) * ((progress - 0.7) / 0.3);
    }

    const quantized = Math.round(estPrice / tickSize) * tickSize;
    const price = Number(quantized.toFixed(precision));
    const side: 'buy' | 'sell' = prng() > (candle.close >= candle.open ? 0.45 : 0.55) ? 'buy' : 'sell';

    // Contract size: mostly 1-5 lots with occasional institutional block (10-50 lots)
    const isBlock = prng() < 0.08;
    const size = isBlock ? Math.floor(prng() * 40) + 10 : Math.floor(prng() * 6) + 1;

    prints.push({
      id: `print_${candle.timestamp}_${i}`,
      timestamp: ts,
      price,
      size,
      side,
    });
  }

  // Return prints in reverse chronological order (newest at top)
  return prints.reverse();
}
