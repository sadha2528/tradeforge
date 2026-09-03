'use client';

import { useEffect, useRef, useState } from 'react';
import { TradingChart } from './TradingChart';
import { TradingViewAdvancedWidget } from './TradingViewAdvancedWidget';
import { ReplayEngine } from '@/lib/backtesting/replay-engine';
import { useReplayStore } from '@/store/replay-store';
import { useChartStore } from '@/store/chart-store';
import { useTradingStore } from '@/store/trading-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import { INITIAL_VISIBLE_CANDLES } from '@/config/constants';
import { Loader2 } from 'lucide-react';
import type { Symbol } from '@/types/market-data';

export function ChartContainer() {
  const replayEngineRef = useRef<ReplayEngine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [symbolObj, setSymbolObj] = useState<Symbol | null>(null);

  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const activeTimeframe = useChartStore((s) => s.activeTimeframe);
  const chartMode = useChartStore((s) => s.chartMode);

  const state = useReplayStore((s) => s.state);
  const speed = useReplayStore((s) => s.speed);
  const nextCandle = useReplayStore((s) => s.nextCandle);
  const loadCandles = useReplayStore((s) => s.loadCandles);
  const allCandles = useReplayStore((s) => s.allCandles);
  const currentIndex = useReplayStore((s) => s.currentIndex);
  const preloadCount = useReplayStore((s) => s.preloadCount);

  const onCandleTick = useTradingStore((s) => s.onCandleTick);

  // Fetch symbol definition
  useEffect(() => {
    marketDataService.getSymbol(activeSymbol).then(setSymbolObj);
  }, [activeSymbol]);

  // Load historical market data whenever symbol or timeframe changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    marketDataService
      .getHistoricalBars(activeSymbol, activeTimeframe)
      .then((bars) => {
        if (!isCancelled && bars.length > 0) {
          const preload = Math.min(INITIAL_VISIBLE_CANDLES, Math.floor(bars.length * 0.4));
          loadCandles(bars, preload);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load market data for symbol:', activeSymbol, err);
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeSymbol, activeTimeframe, loadCandles]);

  // Evaluate trading engine rules whenever current candle changes
  useEffect(() => {
    if (!symbolObj || allCandles.length === 0) return;
    const currentCandle = allCandles[preloadCount + currentIndex];
    if (currentCandle) {
      onCandleTick(currentCandle, symbolObj);
    }
  }, [currentIndex, preloadCount, allCandles, symbolObj, onCandleTick]);

  // Manage replay engine lifecycle
  useEffect(() => {
    const engine = new ReplayEngine();
    engine.setOnTick(nextCandle);
    replayEngineRef.current = engine;
    return () => engine.dispose();
  }, [nextCandle]);

  // Start/stop based on replay state
  useEffect(() => {
    const engine = replayEngineRef.current;
    if (!engine) return;
    if (state === 'playing') {
      engine.start();
    } else {
      engine.stop();
    }
  }, [state]);

  // Update speed
  useEffect(() => {
    replayEngineRef.current?.setSpeed(speed);
  }, [speed]);

  return (
    <div className="relative w-full h-full bg-[#131722]">
      {isLoading && chartMode === 'replay' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#070a12]/80 backdrop-blur-xs">
          <div className="flex items-center space-x-2 text-blue-400 font-mono text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading {activeSymbol} ({activeTimeframe})...</span>
          </div>
        </div>
      )}

      {chartMode === 'tradingview' ? (
        <TradingViewAdvancedWidget symbol={activeSymbol} timeframe={activeTimeframe} />
      ) : (
        <TradingChart />
      )}
    </div>
  );
}
