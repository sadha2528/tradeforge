import type { MarketDataProvider, OHLCV, Symbol, Timeframe } from '@/types/market-data';
import { MockMarketDataProvider } from './mock-provider';
import { CSVMarketDataProvider } from './csv-provider';
import { DEFAULT_SYMBOLS, getSymbolById } from '@/config/symbols';

class MarketDataService {
  private mockProvider: MockMarketDataProvider;
  private csvProvider: CSVMarketDataProvider;

  constructor() {
    this.mockProvider = new MockMarketDataProvider();
    this.csvProvider = new CSVMarketDataProvider();
  }

  async getAllSymbols(): Promise<Symbol[]> {
    const mockSymbols = await this.mockProvider.getSymbols();
    const csvSymbols = await this.csvProvider.getSymbols();

    // Deduplicate symbols by id
    const symbolMap = new Map<string, Symbol>();
    for (const s of mockSymbols) symbolMap.set(s.id, s);
    for (const s of csvSymbols) symbolMap.set(s.id, s);

    return Array.from(symbolMap.values());
  }

  async getSymbol(symbolId: string): Promise<Symbol> {
    const csvSymbols = await this.csvProvider.getSymbols();
    const custom = csvSymbols.find((s) => s.id === symbolId);
    if (custom) return custom;

    return getSymbolById(symbolId) || DEFAULT_SYMBOLS[0];
  }

  async getHistoricalBars(
    symbolId: string,
    timeframe: Timeframe,
    count?: number,
    fromTimestamp?: number,
    toTimestamp?: number
  ): Promise<OHLCV[]> {
    if (this.csvProvider.hasDataset(symbolId)) {
      return this.csvProvider.getHistoricalBars(symbolId, timeframe);
    }
    return this.mockProvider.getHistoricalBars(symbolId, timeframe, count, fromTimestamp, toTimestamp);
  }

  validateDataAvailability(
    symbolId: string,
    timeframe: Timeframe,
    fromTimestamp: number,
    toTimestamp: number
  ): { available: boolean; reason?: string; isSimulated: boolean; barEstimate?: number } {
    if (this.csvProvider.hasDataset(symbolId)) {
      return { available: true, isSimulated: false };
    }
    return this.mockProvider.validateDataAvailability(symbolId, timeframe, fromTimestamp, toTimestamp);
  }

  registerCustomDataset(symbol: Symbol, bars: OHLCV[], baseTimeframe: Timeframe = '1m'): void {
    this.csvProvider.addDataset(symbol, bars, baseTimeframe);
  }
}

export const marketDataService = new MarketDataService();

