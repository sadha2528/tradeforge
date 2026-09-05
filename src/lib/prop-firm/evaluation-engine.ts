import type { Trade } from '@/types/trading';

export interface PropFirmChallengeConfig {
  accountSize: number;           // e.g. 50000, 100000, 150000
  profitTarget: number;          // e.g. 3000, 6000, 9000
  dailyLossLimit: number;        // e.g. 1000, 2000, 3000
  maxTrailingDrawdown: number;   // e.g. 2000, 3000, 4500
  maxContracts: number;          // e.g. 5 standard / 50 micro
  minTradingDays: number;        // e.g. 5
  maxSingleDayProfitPercent?: number; // e.g. 40% consistency rule
}

export const PROP_FIRM_PRESETS: Record<string, PropFirmChallengeConfig> = {
  '50k-challenge': {
    accountSize: 50000,
    profitTarget: 3000,
    dailyLossLimit: 1000,
    maxTrailingDrawdown: 2000,
    maxContracts: 5,
    minTradingDays: 5,
    maxSingleDayProfitPercent: 40,
  },
  '100k-challenge': {
    accountSize: 100000,
    profitTarget: 6000,
    dailyLossLimit: 2000,
    maxTrailingDrawdown: 3000,
    maxContracts: 10,
    minTradingDays: 5,
    maxSingleDayProfitPercent: 40,
  },
  '150k-challenge': {
    accountSize: 150000,
    profitTarget: 9000,
    dailyLossLimit: 3000,
    maxTrailingDrawdown: 4500,
    maxContracts: 15,
    minTradingDays: 5,
    maxSingleDayProfitPercent: 40,
  },
};

export interface PropFirmEvaluationResult {
  status: 'PASSED' | 'IN_PROGRESS' | 'FAILED_DAILY_LOSS' | 'FAILED_MAX_DRAWDOWN' | 'FAILED_CONSISTENCY';
  currentBalance: number;
  currentEquity: number;
  highWaterMark: number;
  netProfit: number;
  profitTargetProgress: number; // 0 to 100%
  dailyLossUsed: number;
  dailyLossRemaining: number;
  trailingDrawdownUsed: number;
  trailingDrawdownRemaining: number;
  tradingDaysCount: number;
  isProfitTargetHit: boolean;
  isDailyLossBreached: boolean;
  isMaxDrawdownBreached: boolean;
  isMinDaysMet: boolean;
  bestDayProfit: number;
  bestDayProfitPercent: number;
  maxSingleDayProfitPercent: number;
  isConsistencyBreached: boolean;
}

export function evaluatePropFirmRules(
  trades: Trade[],
  config: PropFirmChallengeConfig = PROP_FIRM_PRESETS['50k-challenge']
): PropFirmEvaluationResult {
  const { accountSize, profitTarget, dailyLossLimit, maxTrailingDrawdown, minTradingDays } = config;

  let currentBalance = accountSize;
  let highWaterMark = accountSize;
  let maxDrawdownObserved = 0;

  // Track daily P&L by calendar date
  const dailyPnLMap = new Map<string, number>();

  trades.forEach((t) => {
    currentBalance += t.netPnL;
    if (currentBalance > highWaterMark) {
      highWaterMark = currentBalance;
    }

    const currentDrawdown = highWaterMark - currentBalance;
    if (currentDrawdown > maxDrawdownObserved) {
      maxDrawdownObserved = currentDrawdown;
    }

    const d = new Date(t.entryTime);
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    const prevDayPnL = dailyPnLMap.get(dayKey) || 0;
    dailyPnLMap.set(dayKey, prevDayPnL + t.netPnL);
  });

  const netProfit = currentBalance - accountSize;
  const profitTargetProgress = Math.min(100, Math.max(0, (netProfit / profitTarget) * 100));

  // Find worst day loss
  let worstDailyLoss = 0;
  dailyPnLMap.forEach((dayPnL) => {
    if (dayPnL < 0 && Math.abs(dayPnL) > worstDailyLoss) {
      worstDailyLoss = Math.abs(dayPnL);
    }
  });

  // Best day profit for consistency rule evaluation (max 40% of total profit)
  let bestDayProfit = 0;
  dailyPnLMap.forEach((dayPnL) => {
    if (dayPnL > bestDayProfit) {
      bestDayProfit = dayPnL;
    }
  });

  const tradingDaysCount = dailyPnLMap.size;
  const isProfitTargetHit = netProfit >= profitTarget;
  const isDailyLossBreached = worstDailyLoss > dailyLossLimit;
  const isMaxDrawdownBreached = maxDrawdownObserved > maxTrailingDrawdown;
  const isMinDaysMet = tradingDaysCount >= minTradingDays;

  const maxSingleDayProfitPercent = config.maxSingleDayProfitPercent ?? 40;
  const bestDayProfitPercent = netProfit > 0 ? (bestDayProfit / netProfit) * 100 : 0;
  const isConsistencyBreached =
    isProfitTargetHit &&
    bestDayProfitPercent > maxSingleDayProfitPercent;

  let status: PropFirmEvaluationResult['status'] = 'IN_PROGRESS';
  if (isDailyLossBreached) {
    status = 'FAILED_DAILY_LOSS';
  } else if (isMaxDrawdownBreached) {
    status = 'FAILED_MAX_DRAWDOWN';
  } else if (isProfitTargetHit && isMinDaysMet) {
    status = isConsistencyBreached ? 'FAILED_CONSISTENCY' : 'PASSED';
  }

  return {
    status,
    currentBalance,
    currentEquity: currentBalance,
    highWaterMark,
    netProfit,
    profitTargetProgress,
    dailyLossUsed: worstDailyLoss,
    dailyLossRemaining: Math.max(0, dailyLossLimit - worstDailyLoss),
    trailingDrawdownUsed: maxDrawdownObserved,
    trailingDrawdownRemaining: Math.max(0, maxTrailingDrawdown - maxDrawdownObserved),
    tradingDaysCount,
    isProfitTargetHit,
    isDailyLossBreached,
    isMaxDrawdownBreached,
    isMinDaysMet,
    bestDayProfit,
    bestDayProfitPercent,
    maxSingleDayProfitPercent,
    isConsistencyBreached,
  };
}
