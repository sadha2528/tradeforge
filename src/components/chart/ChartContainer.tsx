'use client';

import { useEffect, useRef, useState } from 'react';
import { TradingChart } from './TradingChart';
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
  const layout = useChartStore((s) => s.layout);
  const tiles = useChartStore((s) => s.tiles);

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
    <div className="relative w-full h-full bg-[#131722] overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#070a12]/80 backdrop-blur-xs">
          <div className="flex items-center space-x-2 text-blue-400 font-mono text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading {activeSymbol} ({activeTimeframe})...</span>
          </div>
        </div>
      )}

      {layout === '1x1' && <TradingChart />}

      {layout === '2x1' && (
        <div className="grid grid-cols-2 h-full w-full gap-1 bg-[#0b0e14]">
          <TradingChart tileIndex={0} customSymbol={tiles[0]?.symbol} customTimeframe={tiles[0]?.timeframe} isMultiChart />
          <TradingChart tileIndex={1} customSymbol={tiles[1]?.symbol} customTimeframe={tiles[1]?.timeframe} isMultiChart />
        </div>
      )}

      {layout === '1x2' && (
        <div className="grid grid-rows-2 h-full w-full gap-1 bg-[#0b0e14]">
          <TradingChart tileIndex={0} customSymbol={tiles[0]?.symbol} customTimeframe={tiles[0]?.timeframe} isMultiChart />
          <TradingChart tileIndex={1} customSymbol={tiles[1]?.symbol} customTimeframe={tiles[1]?.timeframe} isMultiChart />
        </div>
      )}

      {layout === '2x2' && (
        <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-1 bg-[#0b0e14]">
          <TradingChart tileIndex={0} customSymbol={tiles[0]?.symbol} customTimeframe={tiles[0]?.timeframe} isMultiChart />
          <TradingChart tileIndex={1} customSymbol={tiles[1]?.symbol} customTimeframe={tiles[1]?.timeframe} isMultiChart />
          <TradingChart tileIndex={2} customSymbol={tiles[2]?.symbol} customTimeframe={tiles[2]?.timeframe} isMultiChart />
          <TradingChart tileIndex={3} customSymbol={tiles[3]?.symbol} customTimeframe={tiles[3]?.timeframe} isMultiChart />
        </div>
      )}
    </div>
  );
}
