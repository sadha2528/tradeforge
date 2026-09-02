export type IndicatorType = 'sma' | 'ema' | 'rsi' | 'macd' | 'bollinger' | 'atr' | 'vwap';

export type IndicatorCategory = 'trend' | 'momentum' | 'volatility' | 'volume';

export interface IndicatorConfig {
  id: string;
  type: IndicatorType;
  name: string;
  shortName: string;
  category: IndicatorCategory;
  isOverlay: boolean;
  visible: boolean;
  color: string;
  lineWidth: number;
  parameters: {
    period?: number;
    fastPeriod?: number;
    slowPeriod?: number;
    signalPeriod?: number;
    stdDevMultiplier?: number;
    upperColor?: string;
    lowerColor?: string;
    signalColor?: string;
    histUpColor?: string;
    histDownColor?: string;
  };
}
