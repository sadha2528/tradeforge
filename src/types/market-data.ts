import { UTCTimestamp } from 'lightweight-charts';

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1D';

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandleData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type AssetClass = 'futures' | 'forex' | 'crypto' | 'stocks' | 'options';

export interface Symbol {
  id: string;
  name: string;
  displayName: string;
  exchange: string;
  assetClass: AssetClass;
  pricePrecision: number;
  quantityPrecision: number;
  minQuantity: number;
  tickSize: number;
  pointValue: number;          // Multiplier / dollar value per 1.00 full point move (e.g., $50 for ES)
  tickValue: number;           // Dollar value per tick = tickSize * pointValue (e.g., $12.50 for ES)
  contractSize?: number;       // Contract unit size (e.g. 100 shares, 100,000 currency units)
  contractMonth?: string;      // Futures contract month/year (e.g., 'U24', 'Z24', 'Continuous')
  marginRequirement?: number;  // Initial margin requirement per contract (e.g. $12,500)
  description?: string;
  sessionType?: 'CME_ETH' | 'CME_RTH' | 'FOREX_24_5' | 'CRYPTO_24_7' | 'US_EQUITIES';
}

export interface MarketDataProvider {
  id: string;
  name: string;
  getSymbols(): Promise<Symbol[]>;
  getHistoricalBars(symbol: string, timeframe: Timeframe, from?: number, to?: number): Promise<OHLCV[]>;
  getLatestBar(symbol: string, timeframe: Timeframe): Promise<OHLCV | null>;
  getAvailableTimeframes(symbol: string): Promise<Timeframe[]>;
}

export interface MarketSession {
  name: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  timezone: string;
}

export interface CSVColumnMapping {
  timestampCol: string;
  openCol: string;
  highCol: string;
  lowCol: string;
  closeCol: string;
  volumeCol?: string;
  timeFormat?: 'auto' | 'iso' | 'unix_ms' | 'unix_sec' | 'datetime_standard';
}

export interface DataValidationError {
  row: number;
  message: string;
  rawData?: string;
}

export interface DataImportResult {
  success: boolean;
  symbol: Symbol;
  timeframe: Timeframe;
  totalRows: number;
  importedBars: OHLCV[];
  errors: DataValidationError[];
  warnings: string[];
  startDate: number | null;
  endDate: number | null;
}
