export interface SessionTimes {
  start: string; // e.g. '09:30'
  end: string;   // e.g. '16:00'
  timezone: string; // e.g. 'America/New_York'
}

export interface FuturesInstrument {
  symbol: string;
  name: string;
  exchange: string;
  tickSize: number;
  tickValue: number;
  pointValue: number;
  contractMultiplier: number;
  currency: string;
  initialMargin: number;
  maintenanceMargin: number;
  rthSession: SessionTimes;
  ethSession: SessionTimes;
  commissionModel: {
    roundTurnPerContract: number;
  };
  slippageModel: {
    defaultTicks: number;
  };
  category: 'indices' | 'energies' | 'metals' | 'currencies' | 'interest_rates' | 'agriculturals';
  pricePrecision: number;
}

const REGISTRY: Map<string, FuturesInstrument> = new Map();

// Standard CME / CBOT / NYMEX / COMEX contracts
const INITIAL_INSTRUMENTS: FuturesInstrument[] = [
  // Equity Index Futures
  {
    symbol: 'ES',
    name: 'E-mini S&P 500',
    exchange: 'CME',
    tickSize: 0.25,
    tickValue: 12.50,
    pointValue: 50,
    contractMultiplier: 50,
    currency: 'USD',
    initialMargin: 12650,
    maintenanceMargin: 11500,
    rthSession: { start: '09:30', end: '16:15', timezone: 'America/New_York' },
    ethSession: { start: '18:00', end: '17:00', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 2.50 },
    slippageModel: { defaultTicks: 1 },
    category: 'indices',
    pricePrecision: 2,
  },
  {
    symbol: 'MES',
    name: 'Micro E-mini S&P 500',
    exchange: 'CME',
    tickSize: 0.25,
    tickValue: 1.25,
    pointValue: 5,
    contractMultiplier: 5,
    currency: 'USD',
    initialMargin: 1265,
    maintenanceMargin: 1150,
    rthSession: { start: '09:30', end: '16:15', timezone: 'America/New_York' },
    ethSession: { start: '18:00', end: '17:00', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 0.60 },
    slippageModel: { defaultTicks: 1 },
    category: 'indices',
    pricePrecision: 2,
  },
  {
    symbol: 'NQ',
    name: 'E-mini Nasdaq-100',
    exchange: 'CME',
    tickSize: 0.25,
    tickValue: 5.00,
    pointValue: 20,
    contractMultiplier: 20,
    currency: 'USD',
    initialMargin: 18700,
    maintenanceMargin: 17000,
    rthSession: { start: '09:30', end: '16:15', timezone: 'America/New_York' },
    ethSession: { start: '18:00', end: '17:00', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 2.50 },
    slippageModel: { defaultTicks: 1 },
    category: 'indices',
    pricePrecision: 2,
  },
  {
    symbol: 'MNQ',
    name: 'Micro E-mini Nasdaq-100',
    exchange: 'CME',
    tickSize: 0.25,
    tickValue: 0.50,
    pointValue: 2,
    contractMultiplier: 2,
    currency: 'USD',
    initialMargin: 1870,
    maintenanceMargin: 1700,
    rthSession: { start: '09:30', end: '16:15', timezone: 'America/New_York' },
    ethSession: { start: '18:00', end: '17:00', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 0.60 },
    slippageModel: { defaultTicks: 1 },
    category: 'indices',
    pricePrecision: 2,
  },
  {
    symbol: 'YM',
    name: 'E-mini Dow Jones ($5)',
    exchange: 'CBOT',
    tickSize: 1.00,
    tickValue: 5.00,
    pointValue: 5,
    contractMultiplier: 5,
    currency: 'USD',
    initialMargin: 9350,
    maintenanceMargin: 8500,
    rthSession: { start: '09:30', end: '16:15', timezone: 'America/New_York' },
    ethSession: { start: '18:00', end: '17:00', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 2.50 },
    slippageModel: { defaultTicks: 1 },
    category: 'indices',
    pricePrecision: 0,
  },
  {
    symbol: 'MYM',
    name: 'Micro E-mini Dow Jones',
    exchange: 'CBOT',
    tickSize: 1.00,
    tickValue: 0.50,
    pointValue: 0.50,
    contractMultiplier: 0.50,
    currency: 'USD',
    initialMargin: 935,
    maintenanceMargin: 850,
    rthSession: { start: '09:30', end: '16:15', timezone: 'America/New_York' },
    ethSession: { start: '18:00', end: '17:00', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 0.60 },
    slippageModel: { defaultTicks: 1 },
    category: 'indices',
    pricePrecision: 0,
  },
  {
    symbol: 'RTY',
    name: 'E-mini Russell 2000',
    exchange: 'CME',
    tickSize: 0.10,
    tickValue: 5.00,
    pointValue: 50,
    contractMultiplier: 50,
    currency: 'USD',
    initialMargin: 7150,
    maintenanceMargin: 6500,
    rthSession: { start: '09:30', end: '16:15', timezone: 'America/New_York' },
    ethSession: { start: '18:00', end: '17:00', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 2.50 },
    slippageModel: { defaultTicks: 1 },
    category: 'indices',
    pricePrecision: 2,
  },
  {
    symbol: 'M2K',
    name: 'Micro E-mini Russell 2000',
    exchange: 'CME',
    tickSize: 0.10,
    tickValue: 0.50,
    pointValue: 5,
    contractMultiplier: 5,
    currency: 'USD',
    initialMargin: 715,
    maintenanceMargin: 650,
    rthSession: { start: '09:30', end: '16:15', timezone: 'America/New_York' },
    ethSession: { start: '18:00', end: '17:00', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 0.60 },
    slippageModel: { defaultTicks: 1 },
    category: 'indices',
    pricePrecision: 2,
  },

  // Commodity & Energy Futures
  {
    symbol: 'CL',
    name: 'Crude Oil Futures (1,000 bbl)',
    exchange: 'NYMEX',
    tickSize: 0.01,
    tickValue: 10.00,
    pointValue: 1000,
    contractMultiplier: 1000,
    currency: 'USD',
    initialMargin: 6600,
    maintenanceMargin: 6000,
    rthSession: { start: '09:00', end: '14:30', timezone: 'America/New_York' },
    ethSession: { start: '18:00', end: '17:00', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 2.50 },
    slippageModel: { defaultTicks: 1 },
    category: 'energies',
    pricePrecision: 2,
  },
  {
    symbol: 'NG',
    name: 'Natural Gas Futures (10,000 MMBtu)',
    exchange: 'NYMEX',
    tickSize: 0.001,
    tickValue: 10.00,
    pointValue: 10000,
    contractMultiplier: 10000,
    currency: 'USD',
    initialMargin: 4400,
    maintenanceMargin: 4000,
    rthSession: { start: '09:00', end: '14:30', timezone: 'America/New_York' },
    ethSession: { start: '18:00', end: '17:00', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 2.50 },
    slippageModel: { defaultTicks: 2 },
    category: 'energies',
    pricePrecision: 3,
  },
  {
    symbol: 'GC',
    name: 'Gold Futures (100 troy oz)',
    exchange: 'COMEX',
    tickSize: 0.10,
    tickValue: 10.00,
    pointValue: 100,
    contractMultiplier: 100,
    currency: 'USD',
    initialMargin: 10450,
    maintenanceMargin: 9500,
    rthSession: { start: '08:20', end: '13:30', timezone: 'America/New_York' },
    ethSession: { start: '18:00', end: '17:00', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 2.50 },
    slippageModel: { defaultTicks: 1 },
    category: 'metals',
    pricePrecision: 2,
  },

  // FX Currency Futures
  {
    symbol: '6E',
    name: 'Euro FX Futures (125,000 EUR)',
    exchange: 'CME',
    tickSize: 0.00005,
    tickValue: 6.25,
    pointValue: 125000,
    contractMultiplier: 125000,
    currency: 'USD',
    initialMargin: 2750,
    maintenanceMargin: 2500,
    rthSession: { start: '08:20', end: '15:00', timezone: 'America/New_York' },
    ethSession: { start: '18:00', end: '17:00', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 2.50 },
    slippageModel: { defaultTicks: 1 },
    category: 'currencies',
    pricePrecision: 5,
  },
  {
    symbol: '6J',
    name: 'Japanese Yen Futures (12,500,000 JPY)',
    exchange: 'CME',
    tickSize: 0.0000005,
    tickValue: 6.25,
    pointValue: 12500000,
    contractMultiplier: 12500000,
    currency: 'USD',
    initialMargin: 3520,
    maintenanceMargin: 3200,
    rthSession: { start: '08:20', end: '15:00', timezone: 'America/New_York' },
    ethSession: { start: '18:00', end: '17:00', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 2.50 },
    slippageModel: { defaultTicks: 1 },
    category: 'currencies',
    pricePrecision: 7,
  },
  {
    symbol: '6B',
    name: 'British Pound Futures (62,500 GBP)',
    exchange: 'CME',
    tickSize: 0.0001,
    tickValue: 6.25,
    pointValue: 62500,
    contractMultiplier: 62500,
    currency: 'USD',
    initialMargin: 2530,
    maintenanceMargin: 2300,
    rthSession: { start: '08:20', end: '15:00', timezone: 'America/New_York' },
    ethSession: { start: '18:00', end: '17:00', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 2.50 },
    slippageModel: { defaultTicks: 1 },
    category: 'currencies',
    pricePrecision: 4,
  },

  // US Treasury Interest Rate Futures
  {
    symbol: 'ZB',
    name: '30-Year U.S. Treasury Bond Futures',
    exchange: 'CBOT',
    tickSize: 0.03125, // 1/32
    tickValue: 31.25,
    pointValue: 1000,
    contractMultiplier: 1000,
    currency: 'USD',
    initialMargin: 4950,
    maintenanceMargin: 4500,
    rthSession: { start: '08:20', end: '15:00', timezone: 'America/New_York' },
    ethSession: { start: '18:00', end: '17:00', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 2.50 },
    slippageModel: { defaultTicks: 1 },
    category: 'interest_rates',
    pricePrecision: 5,
  },
  {
    symbol: 'ZN',
    name: '10-Year U.S. Treasury Note Futures',
    exchange: 'CBOT',
    tickSize: 0.015625, // 1/64
    tickValue: 15.625,
    pointValue: 1000,
    contractMultiplier: 1000,
    currency: 'USD',
    initialMargin: 2420,
    maintenanceMargin: 2200,
    rthSession: { start: '08:20', end: '15:00', timezone: 'America/New_York' },
    ethSession: { start: '18:00', end: '17:00', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 2.50 },
    slippageModel: { defaultTicks: 1 },
    category: 'interest_rates',
    pricePrecision: 6,
  },
  {
    symbol: 'ZF',
    name: '5-Year U.S. Treasury Note Futures',
    exchange: 'CBOT',
    tickSize: 0.0078125, // 1/128
    tickValue: 7.8125,
    pointValue: 1000,
    contractMultiplier: 1000,
    currency: 'USD',
    initialMargin: 1540,
    maintenanceMargin: 1400,
    rthSession: { start: '08:20', end: '15:00', timezone: 'America/New_York' },
    ethSession: { start: '18:00', end: '17:00', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 2.50 },
    slippageModel: { defaultTicks: 1 },
    category: 'interest_rates',
    pricePrecision: 7,
  },

  // Agricultural Futures
  {
    symbol: 'ZC',
    name: 'Corn Futures (5,000 bu)',
    exchange: 'CBOT',
    tickSize: 0.25,
    tickValue: 12.50,
    pointValue: 50,
    contractMultiplier: 50,
    currency: 'USD',
    initialMargin: 1870,
    maintenanceMargin: 1700,
    rthSession: { start: '09:30', end: '14:20', timezone: 'America/New_York' },
    ethSession: { start: '20:00', end: '08:45', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 2.50 },
    slippageModel: { defaultTicks: 1 },
    category: 'agriculturals',
    pricePrecision: 2,
  },
  {
    symbol: 'ZS',
    name: 'Soybean Futures (5,000 bu)',
    exchange: 'CBOT',
    tickSize: 0.25,
    tickValue: 12.50,
    pointValue: 50,
    contractMultiplier: 50,
    currency: 'USD',
    initialMargin: 3520,
    maintenanceMargin: 3200,
    rthSession: { start: '09:30', end: '14:20', timezone: 'America/New_York' },
    ethSession: { start: '20:00', end: '08:45', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 2.50 },
    slippageModel: { defaultTicks: 1 },
    category: 'agriculturals',
    pricePrecision: 2,
  },
  {
    symbol: 'ZW',
    name: 'Wheat Futures (5,000 bu)',
    exchange: 'CBOT',
    tickSize: 0.25,
    tickValue: 12.50,
    pointValue: 50,
    contractMultiplier: 50,
    currency: 'USD',
    initialMargin: 2750,
    maintenanceMargin: 2500,
    rthSession: { start: '09:30', end: '14:20', timezone: 'America/New_York' },
    ethSession: { start: '20:00', end: '08:45', timezone: 'America/New_York' },
    commissionModel: { roundTurnPerContract: 2.50 },
    slippageModel: { defaultTicks: 1 },
    category: 'agriculturals',
    pricePrecision: 2,
  },
];

// Initialize registry
INITIAL_INSTRUMENTS.forEach((inst) => {
  REGISTRY.set(inst.symbol.toUpperCase(), inst);
});

export class InstrumentRegistry {
  public static getInstrument(symbol: string): FuturesInstrument | undefined {
    return REGISTRY.get(symbol.toUpperCase());
  }

  public static getAllInstruments(): FuturesInstrument[] {
    return Array.from(REGISTRY.values());
  }

  public static registerInstrument(instrument: FuturesInstrument): void {
    REGISTRY.set(instrument.symbol.toUpperCase(), instrument);
  }

  public static calculateTickRisk(
    symbol: string,
    entryPrice: number,
    stopPrice: number
  ): { points: number; ticks: number; dollarRiskPerContract: number } {
    const inst = this.getInstrument(symbol);
    const tickSize = inst?.tickSize || 0.25;
    const tickValue = inst?.tickValue || 12.50;

    const points = Math.abs(entryPrice - stopPrice);
    const ticks = Math.round(points / tickSize);
    const dollarRiskPerContract = ticks * tickValue;

    return { points, ticks, dollarRiskPerContract };
  }

  public static calculateGrossPnL(
    symbol: string,
    side: 'long' | 'short',
    entryPrice: number,
    exitPrice: number,
    contracts: number
  ): number {
    const inst = this.getInstrument(symbol);
    const tickSize = inst?.tickSize || 0.25;
    const tickValue = inst?.tickValue || 12.50;

    const delta = side === 'long' ? exitPrice - entryPrice : entryPrice - exitPrice;
    const ticks = delta / tickSize;
    return ticks * tickValue * contracts;
  }

  public static calculatePositionSizeByRisk(
    symbol: string,
    balance: number,
    riskPercent: number,
    entryPrice: number,
    stopPrice: number
  ): { contracts: number; dollarRisk: number; ticksRisk: number } {
    const dollarRiskBudget = balance * (riskPercent / 100);
    const { ticks, dollarRiskPerContract } = this.calculateTickRisk(symbol, entryPrice, stopPrice);

    if (dollarRiskPerContract <= 0) {
      return { contracts: 1, dollarRisk: dollarRiskBudget, ticksRisk: 0 };
    }

    const contracts = Math.max(1, Math.floor(dollarRiskBudget / dollarRiskPerContract));
    return {
      contracts,
      dollarRisk: contracts * dollarRiskPerContract,
      ticksRisk: ticks,
    };
  }

  public static calculateCommission(symbol: string, contracts: number): number {
    const inst = this.getInstrument(symbol);
    const rate = inst?.commissionModel.roundTurnPerContract || 2.50;
    return rate * contracts;
  }

  public static calculateSlippage(
    symbol: string,
    side: 'long' | 'short',
    requestedPrice: number,
    customTicks?: number
  ): number {
    const inst = this.getInstrument(symbol);
    const tickSize = inst?.tickSize || 0.25;
    const ticks = customTicks !== undefined ? customTicks : (inst?.slippageModel.defaultTicks || 1);

    if (side === 'long') {
      return requestedPrice + ticks * tickSize;
    } else {
      return requestedPrice - ticks * tickSize;
    }
  }
}
