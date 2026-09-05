import { InstrumentRegistry } from '../src/lib/trading-engine/instrument-registry';
import { marketDataService } from '../src/lib/market-data/market-data-service';
import { useSessionStore } from '../src/store/session-store';
import type { Timeframe } from '../src/types/market-data';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

async function runSessionSetupTests() {
  console.log('🧪 Starting TradeForge Session Setup & Lifecycle Architecture Tests...\n');

  // TEST 1: Instrument Registry Contract Specifications
  console.log('1️⃣ Verifying InstrumentRegistry Contract Specs for Session Setup...');
  const es = InstrumentRegistry.getInstrument('ES');
  assert(!!es, 'ES must exist in InstrumentRegistry');
  assert(es?.exchange === 'CME', 'ES exchange must be CME');
  assert(es?.tickSize === 0.25, 'ES tickSize must be 0.25');
  assert(es?.tickValue === 12.50, 'ES tickValue must be 12.50');
  assert(es?.pointValue === 50, 'ES pointValue must be 50');
  assert(es?.commissionModel.roundTurnPerContract === 2.50, 'ES commission must be 2.50');

  const nq = InstrumentRegistry.getInstrument('NQ');
  assert(!!nq, 'NQ must exist in InstrumentRegistry');
  assert(nq?.pointValue === 20, 'NQ pointValue must be 20');
  assert(nq?.tickValue === 5.00, 'NQ tickValue must be 5.00');

  const allInstruments = InstrumentRegistry.getAllInstruments();
  assert(allInstruments.length >= 10, 'Must have at least 10 institutional futures instruments');
  console.log(`   ✅ Verified ${allInstruments.length} institutional instruments in InstrumentRegistry.`);

  // TEST 2: Market Data Service Availability Validation
  console.log('\n2️⃣ Testing Market Data Availability Validation...');
  const validStart = new Date('2024-09-16T09:30:00Z').getTime();
  const validEnd = new Date('2024-09-20T16:15:00Z').getTime();

  const validAvailability = marketDataService.validateDataAvailability('ES', '5m', validStart, validEnd);
  assert(validAvailability.available === true, 'Data should be available for valid ES date range');
  assert(validAvailability.isSimulated === true, 'Mock feed should report simulated data');

  // Test invalid date bounds
  const invalidAvailability = marketDataService.validateDataAvailability('ES', '5m', validEnd, validStart);
  assert(invalidAvailability.available === false, 'Availability should fail when start >= end');
  assert(!!invalidAvailability.reason, 'Availability should give failure reason');

  // Test unsupported timeframe
  const invalidTf = marketDataService.validateDataAvailability('ES', 'invalid' as any, validStart, validEnd);
  assert(invalidTf.available === false, 'Availability should fail for invalid timeframe');
  console.log('   ✅ Data availability validation accurately gates session configuration.');

  // TEST 3: Session Store Lifecycle - Creation
  console.log('\n3️⃣ Testing Session Store Creation with Full Futures Configuration...');
  const { createSession, duplicateSession, restartSession, deleteSession, sessions } = useSessionStore.getState();

  const sessionInput = {
    name: 'NQ Opening Range Breakout Test',
    strategyName: 'ICT Silver Bullet',
    symbol: 'NQ',
    market: 'CME',
    timeframe: '5m' as Timeframe,
    startingBalance: 150000,
    mode: 'prop-firm' as const,
    riskMode: 'risk-pct' as const,
    riskValue: 1.5,
    commission: 3.00,
    slippage: 1,
    sameCandlePolicy: 'path-aware' as const,
    includeETH: true,
    timezone: 'America/New_York',
    startDate: validStart,
    endDate: validEnd,
    replayStartTime: validStart + 3600000, // 1 hour after start
    description: 'Evaluating 5m opening range expansions with strict Apex 5% trailing drawdown.',
  };

  const created = createSession(sessionInput);
  assert(!!created.id, 'Session should have a generated UUID');
  assert(created.name === sessionInput.name, 'Session name should match input');
  assert(created.symbol === 'NQ', 'Symbol should be NQ');
  assert(created.mode === 'prop-firm', 'Mode should be prop-firm');
  assert(created.startingBalance === 150000, 'Starting balance should be 150k');
  assert(created.currentTimestamp === sessionInput.replayStartTime, 'Current timestamp should initialize to replayStartTime');
  assert(created.currentIndex === 0, 'Current index should start at 0');
  assert(created.tradesCount === 0, 'Trades count should start at 0');
  assert(created.winRate === 0, 'Win rate should start at 0');
  console.log(`   ✅ Session "${created.name}" created with ID ${created.id}`);

  // TEST 4: Session Duplication
  console.log('\n4️⃣ Testing Session Duplication...');
  const duplicated = duplicateSession(created.id);
  assert(!!duplicated, 'Duplicated session must not be null');
  assert(duplicated?.id !== created.id, 'Duplicated session must have a unique UUID');
  assert(duplicated?.name === `${created.name} (Copy)`, 'Duplicated session name should have (Copy) suffix');
  assert(duplicated?.symbol === created.symbol, 'Duplicated session should retain instrument');
  assert(duplicated?.startingBalance === created.startingBalance, 'Duplicated session should retain capital');
  assert(duplicated?.sameCandlePolicy === created.sameCandlePolicy, 'Duplicated session should retain execution policy');
  console.log(`   ✅ Session duplicated cleanly with ID ${duplicated?.id}`);

  // TEST 5: Session Restart
  console.log('\n5️⃣ Testing Session Restart Lifecycle...');
  // Simulate some state progress on the created session
  useSessionStore.getState().updateSession(created.id, {
    currentIndex: 45,
    currentTimestamp: validStart + 86400000,
    tradesCount: 8,
    winRate: 62.5,
  });

  const progressed = useSessionStore.getState().sessions.find((s) => s.id === created.id);
  assert(progressed?.currentIndex === 45, 'Index should be progressed');
  assert(progressed?.tradesCount === 8, 'Trades count should be 8');

  // Restart session
  const restarted = restartSession(created.id);
  assert(!!restarted, 'Restarted session must not be null');
  assert(restarted?.currentIndex === 0, 'Restart must reset currentIndex to 0');
  assert(restarted?.tradesCount === 0, 'Restart must reset tradesCount to 0');
  assert(restarted?.winRate === 0, 'Restart must reset winRate to 0');
  assert(restarted?.currentTimestamp === created.replayStartTime, 'Restart must reset currentTimestamp to replayStartTime');
  console.log('   ✅ Session successfully restarted back to initial replay position.');

  // Clean up test sessions
  deleteSession(created.id);
  if (duplicated) deleteSession(duplicated.id);

  console.log('\n🎉 ALL SESSION SETUP & LIFECYCLE TESTS PASSED PERFECTLY!\n');
}

runSessionSetupTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
