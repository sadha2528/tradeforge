import type { Trade } from '@/types/trading';
import type { PerformanceMetrics } from './metrics-engine';

/**
 * Exports closed trades array into downloadable CSV file
 */
export function exportTradesToCSV(trades: Trade[], filename: string = 'tradeforge-trades.csv'): void {
  if (trades.length === 0) return;

  const headers = [
    'Trade ID',
    'Symbol',
    'Side',
    'Quantity',
    'Entry Price',
    'Entry Time',
    'Exit Price',
    'Exit Time',
    'Stop Loss',
    'Take Profit',
    'Duration (ms)',
    'Gross PnL ($)',
    'Net PnL ($)',
    'R-Multiple',
    'Exit Reason',
  ];

  const rows = trades.map((t) => [
    t.id,
    t.symbol,
    t.side.toUpperCase(),
    t.quantity,
    t.entryPrice,
    new Date(t.entryTime).toISOString(),
    t.exitPrice ?? '',
    t.exitTime ? new Date(t.exitTime).toISOString() : '',
    t.stopLoss ?? '',
    t.takeProfit ?? '',
    t.duration ?? '',
    t.grossPnL.toFixed(2),
    t.netPnL.toFixed(2),
    t.rMultiple ?? '',
    t.setup ?? 'MANUAL',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(csvContent, 'text/csv', filename);
}

/**
 * Exports full backtest quantitative analytics report to JSON
 */
export function exportPerformanceReportToJSON(
  metrics: PerformanceMetrics,
  trades: Trade[],
  sessionName: string = 'TradeForge Backtest'
): void {
  const report = {
    sessionName,
    exportedAt: new Date().toISOString(),
    summary: {
      startingBalance: metrics.startingBalance,
      finalEquity: metrics.currentEquity,
      netProfit: metrics.netProfit,
      returnPercent: `${metrics.netReturnPercent}%`,
      totalTrades: metrics.totalTrades,
      winRate: `${metrics.winRatePercent}%`,
      profitFactor: metrics.profitFactor,
      expectedValue: `$${metrics.expectedValue}`,
      maxDrawdownDollars: `$${metrics.maxDrawdownDollars}`,
      maxDrawdownPercent: `${metrics.maxDrawdownPercent}%`,
      sharpeRatio: metrics.sharpeRatio,
      sortinoRatio: metrics.sortinoRatio,
      maxConsecutiveWins: metrics.maxConsecutiveWins,
      maxConsecutiveLosses: metrics.maxConsecutiveLosses,
    },
    longVsShort: metrics.longVsShort,
    trades,
  };

  const jsonContent = JSON.stringify(report, null, 2);
  downloadBlob(jsonContent, 'application/json', `${sessionName.toLowerCase().replace(/\s+/g, '-')}-report.json`);
}

function downloadBlob(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
