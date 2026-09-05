export interface PriceLevelVolume {
  price: number;
  bidVolume: number;       // Aggressive market sell hitting the bid
  askVolume: number;       // Aggressive market buy lifting the ask
  totalVolume: number;     // bidVolume + askVolume
  delta: number;           // askVolume - bidVolume
  isPOC: boolean;          // Highest volume price level in the candle
  isImbalanceBuy: boolean; // Diagonal ask volume > bid volume * threshold
  isImbalanceSell: boolean;// Diagonal bid volume > ask volume * threshold
}

export interface CandleFootprint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  totalVolume: number;
  delta: number;
  minDelta: number;
  maxDelta: number;
  cumDelta: number;
  pocPrice: number;
  levels: PriceLevelVolume[];
}

export interface DOMLevel {
  price: number;
  bidSize: number;
  askSize: number;
  volumeAtPrice: number;
  isCurrentPrice: boolean;
  isInsideBid: boolean;
  isInsideAsk: boolean;
  myWorkingBuys?: number;
  myWorkingSells?: number;
}

export interface DOMBook {
  symbol: string;
  currentPrice: number;
  spread: number;
  levels: DOMLevel[];
  totalBidDepth: number;
  totalAskDepth: number;
}

export interface TapePrint {
  id: string;
  timestamp: number;
  price: number;
  size: number;
  side: 'buy' | 'sell';
}

export interface VolumeProfileLevel {
  price: number;
  volume: number;
  bidVolume: number;
  askVolume: number;
  delta: number;
}

export interface VolumeProfileData {
  poc: number;
  vah: number; // Value Area High (70% of total volume)
  val: number; // Value Area Low (70% of total volume)
  totalVolume: number;
  totalDelta: number;
  levels: VolumeProfileLevel[];
}

export interface OrderFlowSettings {
  imbalanceRatio: number;      // e.g. 3.0 for 300% (3:1 diagonal imbalance)
  minImbalanceVolume: number;  // min volume to trigger imbalance flag
  showImbalances: boolean;
  showCandlePOC: boolean;
  showCandleStats: boolean;
  showVolumeProfile: boolean;
  volumeProfileSide: 'left' | 'right';
  valueAreaPercent: number;    // e.g. 70
}

export const DEFAULT_ORDERFLOW_SETTINGS: OrderFlowSettings = {
  imbalanceRatio: 3.0,
  minImbalanceVolume: 10,
  showImbalances: true,
  showCandlePOC: true,
  showCandleStats: true,
  showVolumeProfile: true,
  volumeProfileSide: 'right',
  valueAreaPercent: 70,
};
