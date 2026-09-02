import type { MarketDataProvider, OHLCV, Symbol, Timeframe } from '@/types/market-data';
import { resampleBars } from './resampler';

export class CSVMarketDataProvider implements MarketDataProvider {
  id = 'csv-provider';
  name = 'Custom Uploaded CSV Provider';

  private datasets: Map<string, { symbol: Symbol; baseBars: OHLCV[]; baseTimeframe: Timeframe }> = new Map();

  addDataset(symbol: Symbol, bars: OHLCV[], baseTimeframe: Timeframe = '1m'): void {
    this.datasets.set(symbol.id, {
      symbol,
      baseBars: bars,
      baseTimeframe,
    });
  }

  hasDataset(symbolId: string): boolean {
    return this.datasets.has(symbolId);
  }

  async getSymbols(): Promise<Symbol[]> {
    return Array.from(this.datasets.values()).map((d) => d.symbol);
  }

  async getHistoricalBars(symbolId: string, timeframe: Timeframe): Promise<OHLCV[]> {
    const dataset = this.datasets.get(symbolId);
    if (!dataset) return [];

    if (timeframe === dataset.baseTimeframe) {
      return [...dataset.baseBars];
    }

    return resampleBars(dataset.baseBars, timeframe);
  }

  async getLatestBar(symbolId: string, timeframe: Timeframe): Promise<OHLCV | null> {
    const bars = await this.getHistoricalBars(symbolId, timeframe);
    return bars.length > 0 ? bars[bars.length - 1] : null;
  }

  async getAvailableTimeframes(): Promise<Timeframe[]> {
    return ['1m', '5m', '15m', '30m', '1h', '4h', '1D'];
  }
}
