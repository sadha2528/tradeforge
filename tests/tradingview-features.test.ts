import { calculateHeikinAshi } from '../src/lib/chart/heikin-ashi';
import { snapToCandleOHLC } from '../src/lib/chart/magnet';
import { useChartStore } from '../src/store/chart-store';
import type { OHLCV } from '../src/types/market-data';
import type { DrawingPoint } from '../src/types/chart';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- RUNNING TRADINGVIEW FEATURES UNIT TESTS ---');

// Test 1: Heikin-Ashi Smoothing Logic
console.log('1. Testing Heikin-Ashi calculation...');
const sampleCandles: OHLCV[] = [
  { timestamp: 1700000000000, open: 100, high: 110, low: 95, close: 105, volume: 1000 },
  { timestamp: 1700000300000, open: 105, high: 115, low: 102, close: 112, volume: 1500 },
  { timestamp: 1700000600000, open: 112, high: 114, low: 98, close: 100, volume: 2000 },
];

const haResult = calculateHeikinAshi(sampleCandles);
assert(haResult.length === sampleCandles.length, 'HA candle count matches input');

// Candle 0
// haClose = (100 + 110 + 95 + 105) / 4 = 102.5
// haOpen = (100 + 105) / 2 = 102.5
// haHigh = max(110, 102.5, 102.5) = 110
// haLow = min(95, 102.5, 102.5) = 95
assert(haResult[0].close === 102.5, `Candle 0 haClose expected 102.5, got ${haResult[0].close}`);
assert(haResult[0].open === 102.5, `Candle 0 haOpen expected 102.5, got ${haResult[0].open}`);
assert(haResult[0].high === 110, `Candle 0 haHigh expected 110, got ${haResult[0].high}`);
assert(haResult[0].low === 95, `Candle 0 haLow expected 95, got ${haResult[0].low}`);

// Candle 1
// haOpen = (102.5 + 102.5) / 2 = 102.5
// haClose = (105 + 115 + 102 + 112) / 4 = 108.5
// haHigh = max(115, 102.5, 108.5) = 115
// haLow = min(102, 102.5, 108.5) = 102
assert(haResult[1].open === 102.5, `Candle 1 haOpen expected 102.5, got ${haResult[1].open}`);
assert(haResult[1].close === 108.5, `Candle 1 haClose expected 108.5, got ${haResult[1].close}`);
assert(haResult[1].high === 115, `Candle 1 haHigh expected 115, got ${haResult[1].high}`);
assert(haResult[1].low === 102, `Candle 1 haLow expected 102, got ${haResult[1].low}`);
console.log('✓ Heikin-Ashi formulas verified successfully.');

// Test 2: Magnet Snapping Logic
console.log('2. Testing Magnet Mode snapping...');
const magnetCandles: OHLCV[] = [
  { timestamp: 1700000000000, open: 5000, high: 5020, low: 4980, close: 5010, volume: 500 },
];

const rawPointNearHigh: DrawingPoint = {
  time: 1700000002, // seconds
  price: 5018.5,    // close to high: 5020
};

// Off mode: point should remain exactly as given
const snappedOff = snapToCandleOHLC(rawPointNearHigh, 'off', magnetCandles);
assert(snappedOff.time === rawPointNearHigh.time && snappedOff.price === rawPointNearHigh.price, 'Off mode keeps raw coordinates');

// Strong mode: should snap unconditionally to high (5020) and candle timestamp (1700000000)
const snappedStrong = snapToCandleOHLC(rawPointNearHigh, 'strong', magnetCandles);
assert(snappedStrong.price === 5020, `Strong magnet expected price 5020, got ${snappedStrong.price}`);
assert(snappedStrong.time === 1700000000, `Strong magnet expected time 1700000000, got ${snappedStrong.time}`);

// Weak mode when within range: should snap to high
const snappedWeak = snapToCandleOHLC(rawPointNearHigh, 'weak', magnetCandles);
assert(snappedWeak.price === 5020, `Weak magnet expected price 5020, got ${snappedWeak.price}`);

// Weak mode when far away from any OHLC level: should not snap price
const rawPointFarAway: DrawingPoint = {
  time: 1700000002,
  price: 5200, // far from 5020
};
const snappedWeakFar = snapToCandleOHLC(rawPointFarAway, 'weak', magnetCandles);
assert(snappedWeakFar.price === 5200, `Weak magnet far away should keep raw price, got ${snappedWeakFar.price}`);
console.log('✓ Magnet Mode snapping verified successfully.');

// Test 3: Chart Store TradingView State Transitions
console.log('3. Testing Chart Store TradingView state management...');
const store = useChartStore.getState();

// Chart Style
useChartStore.getState().setChartStyle('heikin-ashi');
assert(useChartStore.getState().chartStyle === 'heikin-ashi', 'Chart style set to heikin-ashi');

useChartStore.getState().setChartStyle('bar');
assert(useChartStore.getState().chartStyle === 'bar', 'Chart style set to bar');

// Price Scale Mode
assert(useChartStore.getState().priceScaleMode.autoScale === true, 'Default autoScale is true');

useChartStore.getState().toggleLogScale();
assert(useChartStore.getState().priceScaleMode.logScale === true, 'Log scale toggled ON');
assert(useChartStore.getState().priceScaleMode.percentageScale === false, 'Percentage scale is OFF when Log is ON');

useChartStore.getState().togglePercentageScale();
assert(useChartStore.getState().priceScaleMode.percentageScale === true, 'Percentage scale toggled ON');
assert(useChartStore.getState().priceScaleMode.logScale === false, 'Log scale is OFF when Percentage is ON');

useChartStore.getState().toggleInvertScale();
assert(useChartStore.getState().priceScaleMode.inverted === true, 'Invert scale toggled ON');

// Drawing controls
assert(useChartStore.getState().areDrawingsLocked === false, 'Default areDrawingsLocked is false');
useChartStore.getState().toggleLockDrawings();
assert(useChartStore.getState().areDrawingsLocked === true, 'Lock drawings toggled ON');

assert(useChartStore.getState().areDrawingsHidden === false, 'Default areDrawingsHidden is false');
useChartStore.getState().toggleHideDrawings();
assert(useChartStore.getState().areDrawingsHidden === true, 'Hide drawings toggled ON');

// Benchmark comparison
useChartStore.getState().setCompareSymbol('NQ');
assert(useChartStore.getState().compareSymbol === 'NQ', 'Compare symbol set to NQ');
useChartStore.getState().setCompareSymbol(null);
assert(useChartStore.getState().compareSymbol === null, 'Compare symbol cleared');

console.log('✓ Chart store TradingView actions verified successfully.');

console.log('\n✅ ALL TRADINGVIEW FEATURE TESTS PASSED!');
