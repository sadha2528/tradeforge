import type { OHLCV, Symbol, Timeframe, DataImportResult, DataValidationError, CSVColumnMapping } from '@/types/market-data';
import { quantizePrice } from './resampler';

export function parseTimestamp(value: string | number): number | null {
  if (!value) return null;

  // Numeric UNIX timestamp
  if (typeof value === 'number' || /^\d+$/.test(String(value).trim())) {
    const num = Number(value);
    // If seconds (< 10000000000), convert to ms
    if (num < 10000000000) {
      return num * 1000;
    }
    return num;
  }

  const str = String(value).trim();

  // Try standard ISO or JS date parsing
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    return parsed;
  }

  // Try formats like "2024.01.15 09:30:00" or "15.01.2024 09:30:00"
  const normalized = str.replace(/\./g, '-').replace(/\//g, '-');
  const normalizedParsed = Date.parse(normalized);
  if (!isNaN(normalizedParsed)) {
    return normalizedParsed;
  }

  // Regex format: YYYY-MM-DD HH:mm:ss
  const regex = /^(\d{4})-(\d{1,2})-(\d{1,2})[\sT](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/;
  const match = str.match(regex);
  if (match) {
    const [_, y, m, d, h, min, sec] = match;
    return Date.UTC(
      parseInt(y, 10),
      parseInt(m, 10) - 1,
      parseInt(d, 10),
      parseInt(h, 10),
      parseInt(min, 10),
      sec ? parseInt(sec, 10) : 0
    );
  }

  return null;
}

export function autoDetectColumnMapping(headers: string[]): CSVColumnMapping {
  const cleanHeaders = headers.map((h) => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));

  const findHeader = (patterns: string[]): string => {
    for (const pattern of patterns) {
      const idx = cleanHeaders.findIndex((h) => h.includes(pattern));
      if (idx !== -1) return headers[idx];
    }
    return '';
  };

  return {
    timestampCol: findHeader(['timestamp', 'datetime', 'date', 'time', 'dt', 'ts']) || headers[0] || '',
    openCol: findHeader(['open', 'o', 'first']) || headers[1] || '',
    highCol: findHeader(['high', 'h', 'max']) || headers[2] || '',
    lowCol: findHeader(['low', 'l', 'min']) || headers[3] || '',
    closeCol: findHeader(['close', 'c', 'last', 'price']) || headers[4] || '',
    volumeCol: findHeader(['volume', 'vol', 'v', 'qty', 'quantity']) || (headers[5] ? headers[5] : undefined),
  };
}

export function parseAndValidateCSV(
  csvContent: string,
  symbol: Symbol,
  timeframe: Timeframe,
  mappingOverride?: Partial<CSVColumnMapping>
): DataImportResult {
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const errors: DataValidationError[] = [];
  const warnings: string[] = [];

  if (lines.length < 2) {
    return {
      success: false,
      symbol,
      timeframe,
      totalRows: lines.length,
      importedBars: [],
      errors: [{ row: 0, message: 'CSV file is empty or does not contain data rows' }],
      warnings: [],
      startDate: null,
      endDate: null,
    };
  }

  // Parse header
  const headerLine = lines[0];
  const delimiter = headerLine.includes(',') ? ',' : headerLine.includes(';') ? ';' : '\t';
  const rawHeaders = headerLine.split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));

  const mapping: CSVColumnMapping = {
    ...autoDetectColumnMapping(rawHeaders),
    ...mappingOverride,
  };

  const getColIndex = (colName?: string) => (colName ? rawHeaders.indexOf(colName) : -1);

  const tsIdx = getColIndex(mapping.timestampCol);
  const oIdx = getColIndex(mapping.openCol);
  const hIdx = getColIndex(mapping.highCol);
  const lIdx = getColIndex(mapping.lowCol);
  const cIdx = getColIndex(mapping.closeCol);
  const vIdx = getColIndex(mapping.volumeCol);

  if (tsIdx === -1 || oIdx === -1 || hIdx === -1 || lIdx === -1 || cIdx === -1) {
    return {
      success: false,
      symbol,
      timeframe,
      totalRows: lines.length - 1,
      importedBars: [],
      errors: [
        {
          row: 1,
          message: `Missing required OHLC columns. Found headers: ${rawHeaders.join(', ')}`,
        },
      ],
      warnings: [],
      startDate: null,
      endDate: null,
    };
  }

  const rawBars: OHLCV[] = [];
  const seenTimestamps = new Set<number>();
  let duplicateCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));

    // Validate Timestamp
    const tsStr = cols[tsIdx];
    const timestamp = parseTimestamp(tsStr);
    if (!timestamp || isNaN(timestamp)) {
      errors.push({ row: rowNum, message: `Invalid timestamp format: "${tsStr}"`, rawData: line });
      continue;
    }

    // Check duplicate timestamp
    if (seenTimestamps.has(timestamp)) {
      duplicateCount++;
      continue; // skip duplicate row
    }

    // Parse Prices
    const rawO = parseFloat(cols[oIdx]);
    const rawH = parseFloat(cols[hIdx]);
    const rawL = parseFloat(cols[lIdx]);
    const rawC = parseFloat(cols[cIdx]);
    const rawV = vIdx !== -1 && cols[vIdx] ? parseFloat(cols[vIdx]) : 1000;

    if (isNaN(rawO) || isNaN(rawH) || isNaN(rawL) || isNaN(rawC)) {
      errors.push({ row: rowNum, message: 'Non-numeric price value found in OHLC', rawData: line });
      continue;
    }

    // Quantize to tick size
    const open = quantizePrice(rawO, symbol.tickSize, symbol.pricePrecision);
    const high = quantizePrice(rawH, symbol.tickSize, symbol.pricePrecision);
    const low = quantizePrice(rawL, symbol.tickSize, symbol.pricePrecision);
    const close = quantizePrice(rawC, symbol.tickSize, symbol.pricePrecision);
    const volume = isNaN(rawV) || rawV < 0 ? 0 : Math.round(rawV);

    // Validate OHLC logic
    if (high < low) {
      errors.push({ row: rowNum, message: `High (${high}) cannot be less than Low (${low})`, rawData: line });
      continue;
    }
    if (high < open || high < close) {
      errors.push({ row: rowNum, message: `High (${high}) must be >= Open (${open}) and Close (${close})`, rawData: line });
      continue;
    }
    if (low > open || low > close) {
      errors.push({ row: rowNum, message: `Low (${low}) must be <= Open (${open}) and Close (${close})`, rawData: line });
      continue;
    }

    seenTimestamps.add(timestamp);
    rawBars.push({ timestamp, open, high, low, close, volume });
  }

  // Sort chronologically ascending
  rawBars.sort((a, b) => a.timestamp - b.timestamp);

  if (duplicateCount > 0) {
    warnings.push(`Ignored ${duplicateCount} duplicate timestamp rows.`);
  }

  if (rawBars.length === 0) {
    return {
      success: false,
      symbol,
      timeframe,
      totalRows: lines.length - 1,
      importedBars: [],
      errors: errors.length > 0 ? errors : [{ row: 0, message: 'No valid OHLC rows found.' }],
      warnings,
      startDate: null,
      endDate: null,
    };
  }

  return {
    success: errors.length < rawBars.length, // successful if at least some valid rows
    symbol,
    timeframe,
    totalRows: lines.length - 1,
    importedBars: rawBars,
    errors,
    warnings,
    startDate: rawBars[0].timestamp,
    endDate: rawBars[rawBars.length - 1].timestamp,
  };
}
