import type { Timeframe } from './market-data';

export type DrawingTool =
  | 'crosshair'
  | 'trendline'
  | 'ray'
  | 'horizontal-line'
  | 'vertical-line'
  | 'rectangle'
  | 'circle'
  | 'price-range'
  | 'date-range'
  | 'long-position'
  | 'short-position'
  | 'text'
  | 'arrow'
  | 'measure'
  | 'delete';

export type ChartLayout = '1x1' | '1x2' | '2x1' | '2x2';

export interface ChartTileConfig {
  id: string;
  symbol: string;
  timeframe: Timeframe;
}

export interface DrawingPoint {
  time: number; // Unix timestamp in seconds
  price: number;
}

export interface Drawing {
  id: string;
  type: DrawingTool;
  points: DrawingPoint[];
  color: string;
  lineWidth: number;
  text?: string;
  fillColor?: string;
  fillOpacity?: number;
  visible: boolean;
  entryPrice?: number;
  targetPrice?: number;
  stopPrice?: number;
  ratio?: number;
  riskDollars?: number;
  rewardDollars?: number;
  contracts?: number;
}

export interface ChartSettings {
  showVolume: boolean;
  showCrosshair: boolean;
  showGrid: boolean;
  candleUpColor: string;
  candleDownColor: string;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  showPositionsOnChart: boolean;
  showOrdersOnChart: boolean;
  showExecutionsOnChart: boolean;
  showPnLOnChart: boolean;
}
