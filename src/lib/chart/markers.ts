import type { SeriesMarker, UTCTimestamp } from 'lightweight-charts';
import type { Position, Trade } from '@/types/trading';
import type { Symbol } from '@/types/market-data';

/**
 * Generates sorted chart markers for trade entries and exits
 */
export function generateTradeMarkers(
  closedTrades: Trade[],
  openPositions: Position[],
  symbol: Symbol
): SeriesMarker<UTCTimestamp>[] {
  const markers: SeriesMarker<UTCTimestamp>[] = [];

  // 1. Add markers for open positions (entry only)
  openPositions
    .filter((p) => p.symbol === symbol.id)
    .forEach((pos) => {
      const isLong = pos.side === 'long';
      markers.push({
        time: (pos.entryTime / 1000) as UTCTimestamp,
        position: isLong ? 'belowBar' : 'aboveBar',
        color: isLong ? '#22c55e' : '#ef4444',
        shape: isLong ? 'arrowUp' : 'arrowDown',
        text: `${isLong ? 'BUY' : 'SELL'} ${pos.quantity} @ ${pos.entryPrice.toFixed(symbol.pricePrecision)}`,
      });
    });

  // 2. Add markers for closed trades (entry + exit)
  closedTrades
    .filter((t) => t.symbol === symbol.id)
    .forEach((trade) => {
      const isLong = trade.side === 'long';

      // Entry Marker
      markers.push({
        time: (trade.entryTime / 1000) as UTCTimestamp,
        position: isLong ? 'belowBar' : 'aboveBar',
        color: isLong ? '#22c55e' : '#ef4444',
        shape: isLong ? 'arrowUp' : 'arrowDown',
        text: `${isLong ? 'BUY' : 'SELL'} ${trade.quantity}`,
      });

      // Exit Marker
      if (trade.exitTime && trade.exitPrice !== null) {
        const isWin = trade.netPnL >= 0;
        const exitTag = trade.setup || (isWin ? 'TP' : 'SL');
        const pnlStr = isWin ? `+$${trade.netPnL.toFixed(0)}` : `-$${Math.abs(trade.netPnL).toFixed(0)}`;

        markers.push({
          time: (trade.exitTime / 1000) as UTCTimestamp,
          position: isLong ? (isWin ? 'aboveBar' : 'belowBar') : (isWin ? 'belowBar' : 'aboveBar'),
          color: isWin ? '#22c55e' : '#ef4444',
          shape: exitTag === 'TP' ? 'circle' : exitTag === 'SL' ? 'square' : 'circle',
          text: `${exitTag} (${pnlStr}${trade.rMultiple !== null ? ` / ${trade.rMultiple > 0 ? `+${trade.rMultiple}` : trade.rMultiple}R` : ''})`,
        });
      }
    });

  // Lightweight Charts requires markers to be strictly sorted by timestamp ascending
  return markers.sort((a, b) => (Number(a.time) - Number(b.time)));
}
