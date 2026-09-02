import { DEFAULT_SYMBOLS, getSymbolById } from '../src/config/symbols';
import {
  calculateGrossPnL,
  calculateRMultiple,
  calculatePositionSize,
} from '../src/lib/trading-engine/calculations';
import {
  evaluatePropFirmRules,
  PROP_FIRM_PRESETS,
} from '../src/lib/prop-firm/evaluation-engine';
import type { Trade } from '../src/types/trading';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

function runTests() {
  console.log('🧪 Starting TradeForge Futures & Prop-Firm Engine Tests...\n');

  // TEST 1: Futures Contract Specifications
  console.log('1️⃣ Testing Futures Contract Specifications (ES, NQ, YM, RTY, GC, CL)...');
  const es = getSymbolById('ES')!;
  assert(es.tickSize === 0.25, 'ES tickSize should be 0.25');
  assert(es.pointValue === 50, 'ES pointValue should be 50');
  assert(es.tickValue === 12.50, 'ES tickValue should be 12.50');

  const mes = getSymbolById('MES')!;
  assert(mes.tickValue === 1.25, 'MES tickValue should be 1.25');

  const nq = getSymbolById('NQ')!;
  assert(nq.tickValue === 5.00, 'NQ tickValue should be 5.00');

  const ym = getSymbolById('YM')!;
  assert(ym.tickSize === 1.00, 'YM tickSize should be 1.00');
  assert(ym.tickValue === 5.00, 'YM tickValue should be 5.00');

  const rty = getSymbolById('RTY')!;
  assert(rty.tickSize === 0.10, 'RTY tickSize should be 0.10');
  assert(rty.tickValue === 5.00, 'RTY tickValue should be 5.00');

  const gc = getSymbolById('GC')!;
  assert(gc.tickValue === 10.00, 'GC tickValue should be 10.00');

  const cl = getSymbolById('CL')!;
  assert(cl.tickValue === 10.00, 'CL tickValue should be 10.00');
  console.log('   ✅ All futures contracts verified with correct tick values!\n');

  // TEST 2: Futures Tick-Based P&L Formulas
  console.log('2️⃣ Testing Tick-Based Gross P&L Calculation...');
  // 2 contracts ES Long: Entry 5800.00, Exit 5810.00 (10 points = 40 ticks = +$500 per contract = +$1000 total)
  const esLongPnL = calculateGrossPnL(es, 'long', 5800.00, 5810.00, 2);
  assert(esLongPnL === 1000, `Expected ES Long P&L 1000, got ${esLongPnL}`);

  // 1 contract NQ Short: Entry 20500.00, Exit 20450.00 (50 points = 200 ticks * $5 = +$1000)
  const nqShortPnL = calculateGrossPnL(nq, 'short', 20500.00, 20450.00, 1);
  assert(nqShortPnL === 1000, `Expected NQ Short P&L 1000, got ${nqShortPnL}`);

  // 3 contracts YM Long: Entry 40000, Exit 40100 (100 points * $5 * 3 = +$1500)
  const ymLongPnL = calculateGrossPnL(ym, 'long', 40000, 40100, 3);
  assert(ymLongPnL === 1500, `Expected YM Long P&L 1500, got ${ymLongPnL}`);
  console.log('   ✅ Gross P&L math verified exactly across multiple asset contracts!\n');

  // TEST 3: Risk-Based Position Sizing for Futures
  console.log('3️⃣ Testing Risk-Based Position Sizing...');
  // $100,000 balance, 1% risk ($1,000 risk), ES Entry 5800, SL 5795 (5 points = 20 ticks = $250 risk/contract)
  // Expected contracts = 1000 / 250 = 4 contracts
  const sizing = calculatePositionSize(100000, 1.0, 5800.00, 5795.00, es);
  assert(sizing.quantity === 4, `Expected 4 contracts, got ${sizing.quantity}`);
  assert(sizing.dollarRisk === 1000, `Expected dollarRisk 1000, got ${sizing.dollarRisk}`);
  console.log('   ✅ Position sizing correctly quantizes contract count according to tick risk!\n');

  // TEST 4: Prop Firm Rule Evaluation Engine
  console.log('4️⃣ Testing Prop-Firm Challenge Engine (50k Tier)...');
  const dummyTrades: Trade[] = [
    {
      id: 't1',
      orderId: 'o1',
      symbol: 'ES',
      side: 'long',
      status: 'closed',
      entryPrice: 5800,
      entryTime: Date.parse('2025-08-16T14:00:00Z'),
      exitPrice: 5815,
      exitTime: Date.parse('2025-08-16T15:00:00Z'),
      quantity: 2,
      stopLoss: 5790,
      takeProfit: 5820,
      fees: 5,
      slippage: 0,
      grossPnL: 1500,
      netPnL: 1495,
      riskAmount: 1000,
      rMultiple: 1.5,
      duration: 3600000,
      setup: 'ORB',
      notes: null,
      emotion: 'Disciplined',
      tags: ['ES'],
      screenshotUrl: null,
    },
    {
      id: 't2',
      orderId: 'o2',
      symbol: 'ES',
      side: 'long',
      status: 'closed',
      entryPrice: 5820,
      entryTime: Date.parse('2025-08-17T14:00:00Z'),
      exitPrice: 5836,
      exitTime: Date.parse('2025-08-17T15:00:00Z'),
      quantity: 2,
      stopLoss: 5810,
      takeProfit: 5840,
      fees: 5,
      slippage: 0,
      grossPnL: 1600,
      netPnL: 1595,
      riskAmount: 1000,
      rMultiple: 1.6,
      duration: 3600000,
      setup: 'FVG',
      notes: null,
      emotion: 'Calm',
      tags: ['ES'],
      screenshotUrl: null,
    },
  ];

  const evalResult = evaluatePropFirmRules(dummyTrades, PROP_FIRM_PRESETS['50k-challenge']);
  assert(evalResult.netProfit === 3090, `Expected netProfit 3090, got ${evalResult.netProfit}`);
  assert(evalResult.isProfitTargetHit === true, 'Profit target should be hit (3090 >= 3000)');
  assert(evalResult.isDailyLossBreached === false, 'Daily loss should not be breached');
  assert(evalResult.isMaxDrawdownBreached === false, 'Max drawdown should not be breached');
  console.log('   ✅ Prop Firm rule tracking and challenge status evaluated accurately!\n');

  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! 🚀');
}

runTests();
