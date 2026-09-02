import type { Trade } from '@/types/trading';

export interface EquityPoint {
  tradeIndex: number;
  equity: number;
  peakEquity: number;
  drawdownDollars: number;
  drawdownPercent: number;
  timestamp: number;
  pnl: number;
}

export interface BreakdownItem {
  name: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  netPnL: number;
  profitFactor: number;
  avgR: number | null;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRatePercent: number;
  lossRatePercent: number;

  grossProfit: number;
  grossLoss: number;
  netProfit: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  winLossRatio: number;
  expectedValue: number;
  avgRMultiple: number | null;

  startingBalance: number;
  currentEquity: number;
  netReturnPercent: number;

  maxDrawdownDollars: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;

  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  avgTradeDurationMs: number;
  bestTradePnL: number;
  worstTradePnL: number;

  equityTrajectory: EquityPoint[];
  longVsShort: {
    long: BreakdownItem;
    short: BreakdownItem;
  };
  dayOfWeekBreakdown: Record<string, BreakdownItem>;
  sessionBreakdown: Record<string, BreakdownItem>;
}

export function calculatePerformanceMetrics(
  trades: Trade[],
  startingBalance: number = 100000
): PerformanceMetrics {
  const totalTrades = trades.length;

  if (totalTrades === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      winRatePercent: 0,
      lossRatePercent: 0,
      grossProfit: 0,
      grossLoss: 0,
      netProfit: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      winLossRatio: 0,
      expectedValue: 0,
      avgRMultiple: null,
      startingBalance,
      currentEquity: startingBalance,
      netReturnPercent: 0,
      maxDrawdownDollars: 0,
      maxDrawdownPercent: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      avgTradeDurationMs: 0,
      bestTradePnL: 0,
      worstTradePnL: 0,
      equityTrajectory: [
        {
          tradeIndex: 0,
          equity: startingBalance,
          peakEquity: startingBalance,
          drawdownDollars: 0,
          drawdownPercent: 0,
          timestamp: Date.now(),
          pnl: 0,
        },
      ],
      longVsShort: {
        long: createEmptyBreakdown('Long'),
        short: createEmptyBreakdown('Short'),
      },
      dayOfWeekBreakdown: {},
      sessionBreakdown: {},
    };
  }

  // Sort trades chronologically
  const sorted = [...trades].sort((a, b) => a.entryTime - b.entryTime);

  const winning = sorted.filter((t) => t.netPnL > 0);
  const losing = sorted.filter((t) => t.netPnL < 0);
  const breakEven = sorted.filter((t) => t.netPnL === 0);

  const grossProfit = winning.reduce((acc, t) => acc + t.netPnL, 0);
  const grossLoss = Math.abs(losing.reduce((acc, t) => acc + t.netPnL, 0));
  const netProfit = grossProfit - grossLoss;

  const winRatePercent = (winning.length / totalTrades) * 100;
  const lossRatePercent = (losing.length / totalTrades) * 100;

  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999.99 : 0;
  const avgWin = winning.length > 0 ? grossProfit / winning.length : 0;
  const avgLoss = losing.length > 0 ? grossLoss / losing.length : 0;
  const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 999.99 : 0;

  // Expected Value: (WinRate * AvgWin) - (LossRate * AvgLoss)
  const expectedValue = (winRatePercent / 100) * avgWin - (lossRatePercent / 100) * avgLoss;

  // Average R-Multiple
  const rMultiples = sorted.map((t) => t.rMultiple).filter((r): r is number => r !== null);
  const avgRMultiple =
    rMultiples.length > 0 ? Number((rMultiples.reduce((a, b) => a + b, 0) / rMultiples.length).toFixed(2)) : null;

  // Equity Curve & Drawdown Trajectory
  let runningEquity = startingBalance;
  let peakEquity = startingBalance;
  let maxDrawdownDollars = 0;
  let maxDrawdownPercent = 0;

  const equityTrajectory: EquityPoint[] = [
    {
      tradeIndex: 0,
      equity: startingBalance,
      peakEquity: startingBalance,
      drawdownDollars: 0,
      drawdownPercent: 0,
      timestamp: sorted[0].entryTime - 60000,
      pnl: 0,
    },
  ];

  const tradeReturns: number[] = [];

  sorted.forEach((t, idx) => {
    const prevEquity = runningEquity;
    runningEquity += t.netPnL;
    if (runningEquity > peakEquity) {
      peakEquity = runningEquity;
    }

    const ddDollars = Math.max(0, peakEquity - runningEquity);
    const ddPercent = peakEquity > 0 ? (ddDollars / peakEquity) * 100 : 0;

    if (ddDollars > maxDrawdownDollars) maxDrawdownDollars = ddDollars;
    if (ddPercent > maxDrawdownPercent) maxDrawdownPercent = ddPercent;

    tradeReturns.push(prevEquity > 0 ? t.netPnL / prevEquity : 0);

    equityTrajectory.push({
      tradeIndex: idx + 1,
      equity: runningEquity,
      peakEquity,
      drawdownDollars: ddDollars,
      drawdownPercent: Number(ddPercent.toFixed(2)),
      timestamp: t.exitTime || t.entryTime,
      pnl: t.netPnL,
    });
  });

  // Sharpe and Sortino Ratios
  const meanReturn = tradeReturns.reduce((a, b) => a + b, 0) / tradeReturns.length;
  const variance =
    tradeReturns.reduce((acc, r) => acc + Math.pow(r - meanReturn, 2), 0) / (tradeReturns.length || 1);
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;

  const downsideVariance =
    tradeReturns.filter((r) => r < 0).reduce((acc, r) => acc + Math.pow(r, 2), 0) /
    (tradeReturns.filter((r) => r < 0).length || 1);
  const downsideStdDev = Math.sqrt(downsideVariance);
  const sortinoRatio = downsideStdDev > 0 ? (meanReturn / downsideStdDev) * Math.sqrt(252) : 0;

  // Consecutive Streaks
  let curWins = 0,
    maxWins = 0,
    curLoss = 0,
    maxLoss = 0;

  sorted.forEach((t) => {
    if (t.netPnL > 0) {
      curWins++;
      curLoss = 0;
      if (curWins > maxWins) maxWins = curWins;
    } else if (t.netPnL < 0) {
      curLoss++;
      curWins = 0;
      if (curLoss > maxLoss) maxLoss = curLoss;
    } else {
      curWins = 0;
      curLoss = 0;
    }
  });

  // Durations and Extremes
  const durations = sorted.map((t) => t.duration || 0).filter((d) => d > 0);
  const avgTradeDurationMs = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

  const bestTradePnL = Math.max(...sorted.map((t) => t.netPnL));
  const worstTradePnL = Math.min(...sorted.map((t) => t.netPnL));

  // Multi-dimensional Breakdowns
  const longTrades = sorted.filter((t) => t.side === 'long');
  const shortTrades = sorted.filter((t) => t.side === 'short');

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeekBreakdown: Record<string, BreakdownItem> = {};
  daysOfWeek.slice(1, 6).forEach((day) => {
    dayOfWeekBreakdown[day] = createEmptyBreakdown(day);
  });

  sorted.forEach((t) => {
    const day = daysOfWeek[new Date(t.entryTime).getUTCDay()];
    if (dayOfWeekBreakdown[day]) {
      accumulateBreakdown(dayOfWeekBreakdown[day], t);
    }
  });

  const sessionBreakdown: Record<string, BreakdownItem> = {
    'London Open (08-12 UTC)': createEmptyBreakdown('London Open'),
    'NY Morning (13-17 UTC)': createEmptyBreakdown('NY Morning'),
    'NY Afternoon (17-21 UTC)': createEmptyBreakdown('NY Afternoon'),
    'Asian Session (00-08 UTC)': createEmptyBreakdown('Asian Session'),
  };

  sorted.forEach((t) => {
    const hour = new Date(t.entryTime).getUTCHours();
    if (hour >= 8 && hour < 12) accumulateBreakdown(sessionBreakdown['London Open (08-12 UTC)'], t);
    else if (hour >= 13 && hour < 17) accumulateBreakdown(sessionBreakdown['NY Morning (13-17 UTC)'], t);
    else if (hour >= 17 && hour < 21) accumulateBreakdown(sessionBreakdown['NY Afternoon (17-21 UTC)'], t);
    else accumulateBreakdown(sessionBreakdown['Asian Session (00-08 UTC)'], t);
  });

  return {
    totalTrades,
    winningTrades: winning.length,
    losingTrades: losing.length,
    breakEvenTrades: breakEven.length,
    winRatePercent: Number(winRatePercent.toFixed(1)),
    lossRatePercent: Number(lossRatePercent.toFixed(1)),
    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    avgWin: Number(avgWin.toFixed(2)),
    avgLoss: Number(avgLoss.toFixed(2)),
    winLossRatio: Number(winLossRatio.toFixed(2)),
    expectedValue: Number(expectedValue.toFixed(2)),
    avgRMultiple,
    startingBalance,
    currentEquity: Number(runningEquity.toFixed(2)),
    netReturnPercent: Number((((runningEquity - startingBalance) / startingBalance) * 100).toFixed(2)),
    maxDrawdownDollars: Number(maxDrawdownDollars.toFixed(2)),
    maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    sortinoRatio: Number(sortinoRatio.toFixed(2)),
    maxConsecutiveWins: maxWins,
    maxConsecutiveLosses: maxLoss,
    avgTradeDurationMs,
    bestTradePnL,
    worstTradePnL,
    equityTrajectory,
    longVsShort: {
      long: calculateItemBreakdown('Long', longTrades),
      short: calculateItemBreakdown('Short', shortTrades),
    },
    dayOfWeekBreakdown,
    sessionBreakdown,
  };
}

function createEmptyBreakdown(name: string): BreakdownItem {
  return {
    name,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    grossProfit: 0,
    grossLoss: 0,
    netPnL: 0,
    profitFactor: 0,
    avgR: null,
  };
}

function accumulateBreakdown(item: BreakdownItem, t: Trade) {
  item.totalTrades++;
  if (t.netPnL > 0) {
    item.winningTrades++;
    item.grossProfit += t.netPnL;
  } else if (t.netPnL < 0) {
    item.losingTrades++;
    item.grossLoss += Math.abs(t.netPnL);
  }
  item.netPnL += t.netPnL;
  item.winRate = item.totalTrades > 0 ? Number(((item.winningTrades / item.totalTrades) * 100).toFixed(1)) : 0;
  item.profitFactor =
    item.grossLoss > 0 ? Number((item.grossProfit / item.grossLoss).toFixed(2)) : item.grossProfit > 0 ? 999.99 : 0;
}

function calculateItemBreakdown(name: string, trades: Trade[]): BreakdownItem {
  const item = createEmptyBreakdown(name);
  trades.forEach((t) => accumulateBreakdown(item, t));
  const rMultiples = trades.map((t) => t.rMultiple).filter((r): r is number => r !== null);
  item.avgR = rMultiples.length > 0 ? Number((rMultiples.reduce((a, b) => a + b, 0) / rMultiples.length).toFixed(2)) : null;
  return item;
}
