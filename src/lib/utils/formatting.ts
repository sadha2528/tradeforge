export function formatPrice(price: number, precision: number = 5): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(price);
}

export function formatPnL(pnl: number, currency: string = 'USD'): string {
  const isPositive = pnl >= 0;
  const sign = isPositive ? '+' : '';
  const formattedAmount = formatCurrency(Math.abs(pnl), currency);
  return `${sign}${formattedAmount}`;
}

export function formatPercent(value: number, precision: number = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(precision)}%`;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatTimestamp(
  timestamp: number,
  format: 'date' | 'time' | 'datetime' = 'datetime'
): string {
  const date = new Date(timestamp);

  if (format === 'date') {
    return date.toLocaleDateString();
  }

  if (format === 'time') {
    return date.toLocaleTimeString();
  }

  return date.toLocaleString();
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours % 24 > 0) parts.push(`${hours % 24}h`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);

  if (parts.length === 0) {
    if (seconds > 0) return `${seconds}s`;
    return '0s';
  }

  return parts.join(' ');
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
}
