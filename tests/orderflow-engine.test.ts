import {
  generateCandleFootprint,
  generateSessionFootprints,
  calculateVolumeProfile,
  generateDOMBook,
  generateTapePrints,
} from '../src/lib/orderflow/orderflow-engine';
import type { Symbol, OHLCV } from '../src/types/market-data';

// ES Futures Symbol Definition
const ES_SYMBOL: Symbol = {
  id: 'ES',
  name: 'ES',
  displayName: 'E-mini S&P 500',
  exchange: 'CME',
  assetClass: 'futures',
  pricePrecision: 2,
  quantityPrecision: 0,
  minQuantity: 1,
  tickSize: 0.25,
  pointValue: 50,
  tickValue: 12.5,
};

const SAMPLE_CANDLE: OHLCV = {
  timestamp: 1726146000000, // 2024-09-12 13:00:00 UTC
  open: 5820.0,
  high: 5825.0,
  low: 5818.0,
  close: 5823.5,
  volume: 12500,
};

const SAMPLE_SESSION_CANDLES: OHLCV[] = [
  { timestamp: 1726146000000, open: 5820.0, high: 5825.0, low: 5818.0, close: 5823.5, volume: 10000 },
  { timestamp: 1726146300000, open: 5823.5, high: 5828.0, low: 5822.0, close: 5827.0, volume: 14000 },
  { timestamp: 1726146600000, open: 5827.0, high: 5829.5, low: 5824.0, close: 5825.0, volume: 11000 },
  { timestamp: 1726146900000, open: 5825.0, high: 5826.5, low: 5819.0, close: 5820.5, volume: 16000 },
];

console.log('🧪 Starting TradeForge Order Flow Engine Tests...\n');

// ─────────────────────────────────────────────────────────────
// 1. Footprint Cluster Generation
// ─────────────────────────────────────────────────────────────
console.log('1️⃣ Testing Intra-Candle Footprint Cluster Generation...');
const fp = generateCandleFootprint(SAMPLE_CANDLE, ES_SYMBOL);

if (!fp.levels || fp.levels.length === 0) {
  throw new Error('❌ Footprint levels should not be empty');
}

// Expected price levels for 5818.0 to 5825.0 at 0.25 tick = (5825 - 5818)/0.25 + 1 = 29 levels
const expectedLevels = Math.round((SAMPLE_CANDLE.high - SAMPLE_CANDLE.low) / ES_SYMBOL.tickSize) + 1;
if (fp.levels.length !== expectedLevels) {
  throw new Error(`❌ Expected ${expectedLevels} levels, got ${fp.levels.length}`);
}

// Check that level sum matches total volume
const sumVol = fp.levels.reduce((acc, l) => acc + l.totalVolume, 0);
if (sumVol !== SAMPLE_CANDLE.volume) {
  throw new Error(`❌ Level volume sum ${sumVol} does not equal candle volume ${SAMPLE_CANDLE.volume}`);
}

// Check level delta arithmetic: delta = askVolume - bidVolume
for (const lvl of fp.levels) {
  if (lvl.delta !== lvl.askVolume - lvl.bidVolume) {
    throw new Error(`❌ Level delta mismatch: ${lvl.delta} !== ${lvl.askVolume} - ${lvl.bidVolume}`);
  }
}

console.log(`   ✅ Footprint generated ${fp.levels.length} price levels with exact volume conservation!`);

// ─────────────────────────────────────────────────────────────
// 2. Point of Control (POC) Verification
// ─────────────────────────────────────────────────────────────
console.log('\n2️⃣ Testing Point of Control (POC) Identification...');
const pocLevels = fp.levels.filter((l) => l.isPOC);
if (pocLevels.length !== 1) {
  throw new Error(`❌ Expected exactly 1 POC level, got ${pocLevels.length}`);
}

const maxLevelVol = Math.max(...fp.levels.map((l) => l.totalVolume));
if (pocLevels[0].totalVolume !== maxLevelVol) {
  throw new Error(`❌ POC level volume ${pocLevels[0].totalVolume} is not the max level volume ${maxLevelVol}`);
}
console.log(`   ✅ POC correctly identified at ${pocLevels[0].price} with peak volume ${pocLevels[0].totalVolume}!`);

// ─────────────────────────────────────────────────────────────
// 3. Diagonal Imbalance Detection
// ─────────────────────────────────────────────────────────────
console.log('\n3️⃣ Testing Diagonal Imbalance Detection...');
const hasImbalance = fp.levels.some((l) => l.isImbalanceBuy || l.isImbalanceSell);
console.log(`   ✅ Imbalance evaluation completed (Detected imbalances: ${hasImbalance ? 'YES' : 'NONE in test bar'})!`);

// ─────────────────────────────────────────────────────────────
// 4. Cumulative Volume Delta (CVD)
// ─────────────────────────────────────────────────────────────
console.log('\n4️⃣ Testing Cumulative Volume Delta (CVD) Calculation...');
const { footprints: sessionFps, cvdPoints } = generateSessionFootprints(SAMPLE_SESSION_CANDLES, ES_SYMBOL);

if (sessionFps.length !== SAMPLE_SESSION_CANDLES.length) {
  throw new Error(`❌ Expected ${SAMPLE_SESSION_CANDLES.length} footprints, got ${sessionFps.length}`);
}

let runningCvd = 0;
for (let i = 0; i < sessionFps.length; i++) {
  runningCvd += sessionFps[i].delta;
  if (sessionFps[i].cumDelta !== runningCvd) {
    throw new Error(`❌ CumDelta mismatch at bar ${i}: expected ${runningCvd}, got ${sessionFps[i].cumDelta}`);
  }
}
console.log(`   ✅ CVD successfully verified across ${sessionFps.length} session bars (End CVD: ${runningCvd})!`);

// ─────────────────────────────────────────────────────────────
// 5. Session Volume Profile & Value Area (VAH / VAL 70%)
// ─────────────────────────────────────────────────────────────
console.log('\n5️⃣ Testing Session Volume Profile & Value Area (70%)...');
const vp = calculateVolumeProfile(sessionFps, ES_SYMBOL, 70);

if (vp.totalVolume !== SAMPLE_SESSION_CANDLES.reduce((s, c) => s + c.volume, 0)) {
  throw new Error('❌ Total profile volume mismatch');
}

if (vp.vah < vp.poc || vp.val > vp.poc) {
  throw new Error(`❌ Invalid Value Area bounds: VAL (${vp.val}) <= POC (${vp.poc}) <= VAH (${vp.vah}) violated`);
}
console.log(`   ✅ Volume Profile verified! POC: ${vp.poc}, VAH: ${vp.vah}, VAL: ${vp.val}`);

// ─────────────────────────────────────────────────────────────
// 6. Level 2 Depth of Market (DOM) Price Ladder
// ─────────────────────────────────────────────────────────────
console.log('\n6️⃣ Testing Level 2 Depth of Market (DOM) Book...');
const dom = generateDOMBook(ES_SYMBOL, 5823.5, [{ price: 5822.0, side: 'long', quantity: 2 }]);

if (dom.levels.length === 0) {
  throw new Error('❌ DOM levels should not be empty');
}

if (dom.spread !== ES_SYMBOL.tickSize) {
  throw new Error(`❌ Expected spread ${ES_SYMBOL.tickSize}, got ${dom.spread}`);
}

if (dom.totalBidDepth <= 0 || dom.totalAskDepth <= 0) {
  throw new Error('❌ DOM Bid/Ask depth should be greater than 0');
}

// Verify working order mapped correctly
const workingLvl = dom.levels.find((l) => l.price === 5822.0);
if (!workingLvl || workingLvl.myWorkingBuys !== 2) {
  throw new Error('❌ Working buy order not mapped correctly to DOM price row');
}
console.log(`   ✅ DOM Ladder generated ${dom.levels.length} levels with working order tracking!`);

// ─────────────────────────────────────────────────────────────
// 7. Time & Sales (Tape)
// ─────────────────────────────────────────────────────────────
console.log('\n7️⃣ Testing Time & Sales (Tape) Prints...');
const tape = generateTapePrints(SAMPLE_CANDLE, ES_SYMBOL, 20);

if (tape.length !== 20) {
  throw new Error(`❌ Expected 20 tape prints, got ${tape.length}`);
}

for (const print of tape) {
  if (print.price < SAMPLE_CANDLE.low || print.price > SAMPLE_CANDLE.high) {
    throw new Error(`❌ Tape print price ${print.price} outside candle bounds [${SAMPLE_CANDLE.low}, ${SAMPLE_CANDLE.high}]`);
  }
}
console.log(`   ✅ Time & Sales tape verified with ${tape.length} transaction prints within candle bounds!`);

console.log('\n🎉 ALL ORDER FLOW ENGINE TESTS PASSED! 🚀');
