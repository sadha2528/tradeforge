import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IndicatorConfig, IndicatorType } from '@/types/indicator';

export const INDICATOR_CATALOG: Omit<IndicatorConfig, 'id' | 'visible'>[] = [
  {
    type: 'ema',
    name: 'Exponential Moving Average (EMA)',
    shortName: 'EMA 20',
    category: 'trend',
    isOverlay: true,
    color: '#3b82f6',
    lineWidth: 2,
    parameters: { period: 20 },
  },
  {
    type: 'ema',
    name: 'Exponential Moving Average (EMA 50)',
    shortName: 'EMA 50',
    category: 'trend',
    isOverlay: true,
    color: '#f59e0b',
    lineWidth: 2,
    parameters: { period: 50 },
  },
  {
    type: 'ema',
    name: 'Exponential Moving Average (EMA 200)',
    shortName: 'EMA 200',
    category: 'trend',
    isOverlay: true,
    color: '#a855f7',
    lineWidth: 2,
    parameters: { period: 200 },
  },
  {
    type: 'sma',
    name: 'Simple Moving Average (SMA)',
    shortName: 'SMA 20',
    category: 'trend',
    isOverlay: true,
    color: '#06b6d4',
    lineWidth: 2,
    parameters: { period: 20 },
  },
  {
    type: 'vwap',
    name: 'Volume Weighted Average Price (VWAP)',
    shortName: 'VWAP',
    category: 'volume',
    isOverlay: true,
    color: '#ec4899',
    lineWidth: 2,
    parameters: {},
  },
  {
    type: 'bollinger',
    name: 'Bollinger Bands (BB)',
    shortName: 'BB (20, 2)',
    category: 'volatility',
    isOverlay: true,
    color: '#6366f1',
    lineWidth: 1,
    parameters: {
      period: 20,
      stdDevMultiplier: 2,
      upperColor: '#818cf8',
      lowerColor: '#818cf8',
    },
  },
  {
    type: 'rsi',
    name: 'Relative Strength Index (RSI)',
    shortName: 'RSI 14',
    category: 'momentum',
    isOverlay: false,
    color: '#a855f7',
    lineWidth: 2,
    parameters: { period: 14 },
  },
  {
    type: 'macd',
    name: 'Moving Average Convergence Divergence (MACD)',
    shortName: 'MACD (12, 26, 9)',
    category: 'momentum',
    isOverlay: false,
    color: '#3b82f6',
    lineWidth: 2,
    parameters: {
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      signalColor: '#f59e0b',
      histUpColor: '#22c55e',
      histDownColor: '#ef4444',
    },
  },
  {
    type: 'atr',
    name: 'Average True Range (ATR)',
    shortName: 'ATR 14',
    category: 'volatility',
    isOverlay: false,
    color: '#10b981',
    lineWidth: 2,
    parameters: { period: 14 },
  },
];

interface IndicatorStore {
  activeIndicators: IndicatorConfig[];
  addIndicator: (template: Omit<IndicatorConfig, 'id' | 'visible'>) => void;
  removeIndicator: (id: string) => void;
  updateIndicator: (id: string, updates: Partial<IndicatorConfig>) => void;
  toggleVisibility: (id: string) => void;
  resetToDefaults: () => void;
}

const DEFAULT_ACTIVE: IndicatorConfig[] = [
  {
    id: 'ind-ema-20',
    type: 'ema',
    name: 'Exponential Moving Average',
    shortName: 'EMA 20',
    category: 'trend',
    isOverlay: true,
    visible: true,
    color: '#3b82f6',
    lineWidth: 2,
    parameters: { period: 20 },
  },
  {
    id: 'ind-ema-50',
    type: 'ema',
    name: 'Exponential Moving Average',
    shortName: 'EMA 50',
    category: 'trend',
    isOverlay: true,
    visible: true,
    color: '#f59e0b',
    lineWidth: 2,
    parameters: { period: 50 },
  },
];

export const useIndicatorStore = create<IndicatorStore>()(
  persist(
    (set) => ({
      activeIndicators: DEFAULT_ACTIVE,

      addIndicator: (template) =>
        set((state) => ({
          activeIndicators: [
            ...state.activeIndicators,
            {
              ...template,
              id: `ind-${template.type}-${Date.now()}`,
              visible: true,
            },
          ],
        })),

      removeIndicator: (id) =>
        set((state) => ({
          activeIndicators: state.activeIndicators.filter((ind) => ind.id !== id),
        })),

      updateIndicator: (id, updates) =>
        set((state) => ({
          activeIndicators: state.activeIndicators.map((ind) =>
            ind.id === id ? { ...ind, ...updates } : ind
          ),
        })),

      toggleVisibility: (id) =>
        set((state) => ({
          activeIndicators: state.activeIndicators.map((ind) =>
            ind.id === id ? { ...ind, visible: !ind.visible } : ind
          ),
        })),

      resetToDefaults: () => set({ activeIndicators: DEFAULT_ACTIVE }),
    }),
    {
      name: 'tradeforge-indicators-v1',
    }
  )
);
