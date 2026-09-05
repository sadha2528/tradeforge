'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChartManager } from '@/lib/chart/chart-manager';
import { useReplayStore } from '@/store/replay-store';
import { useChartStore } from '@/store/chart-store';
import { useTradingStore } from '@/store/trading-store';
import { useIndicatorStore } from '@/store/indicator-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import { generateTradeMarkers } from '@/lib/chart/markers';
import {
  calculateEMA,
  calculateSMA,
  calculateVWAP,
  calculateBollingerBands,
} from '@/lib/indicators/calculations';
import { DrawingCanvas } from './DrawingCanvas';
import { ChartLegend } from './ChartLegend';
import { OnChartTradingWidget } from './OnChartTradingWidget';
import { FootprintCanvas } from '@/components/orderflow/FootprintCanvas';
import { TIMEFRAMES } from '@/config/constants';
import type { UTCTimestamp, LineData } from 'lightweight-charts';
import type { Symbol, Timeframe, OHLCV } from '@/types/market-data';
import { cn } from '@/lib/utils';

interface TradingChartProps {
  className?: string;
  tileIndex?: number;
  customSymbol?: string;
  customTimeframe?: Timeframe;
  isMultiChart?: boolean;
}

export function TradingChart({
  className,
  tileIndex = 0,
  customSymbol,
  customTimeframe,
  isMultiChart = false,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager | null>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 800, height: 600 });
  const [symbolObj, setSymbolObj] = useState<Symbol | null>(null);
  const [tileBars, setTileBars] = useState<OHLCV[]>([]);

  const activeSymbolStore = useChartStore((s) => s.activeSymbol);
  const activeTimeframeStore = useChartStore((s) => s.activeTimeframe);
  const activeTileIndex = useChartStore((s) => s.activeTileIndex);
  const setActiveTileIndex = useChartStore((s) => s.setActiveTileIndex);
  const setTileTimeframe = useChartStore((s) => s.setTileTimeframe);

  const activeIndicators = useIndicatorStore((s) => s.activeIndicators);

  const activeSymbol = customSymbol || activeSymbolStore;
  const activeTimeframe = customTimeframe || activeTimeframeStore;
  const isTileFocused = isMultiChart ? activeTileIndex === tileIndex : true;

  const allCandles = useReplayStore((s) => s.allCandles);
  const currentIndex = useReplayStore((s) => s.currentIndex);
  const preloadCount = useReplayStore((s) => s.preloadCount);

  const positions = useTradingStore((s) => s.positions);
  const orders = useTradingStore((s) => s.orders);
  const closedTrades = useTradingStore((s) => s.closedTrades);

  // Initialize chart on mount
  useEffect(() => {
    if (!containerRef.current) return;
    const manager = new ChartManager({ container: containerRef.current });
    chartManagerRef.current = manager;
    return () => manager.dispose();
  }, []);

  // Update symbol precision and tick formatting when symbol changes
  useEffect(() => {
    if (!chartManagerRef.current) return;
    marketDataService.getSymbol(activeSymbol).then((sym) => {
      setSymbolObj(sym);
      chartManagerRef.current?.setPricePrecision(sym.pricePrecision, sym.tickSize);
    });
  }, [activeSymbol]);

  // Fetch historical bars for this specific tile's symbol and timeframe
  useEffect(() => {
    let isCancelled = false;
    marketDataService.getHistoricalBars(activeSymbol, activeTimeframe).then((bars) => {
      if (!isCancelled) {
        setTileBars(bars);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [activeSymbol, activeTimeframe]);

  // Synchronize Replay Timestamp: filter candles up to the current active replay timestamp
  useEffect(() => {
    if (!chartManagerRef.current || tileBars.length === 0 || allCandles.length === 0) return;

    // Get the timestamp of the latest revealed candle from the primary replay engine
    const activeReplayCandle = allCandles[preloadCount + currentIndex];
    const currentReplayTs = activeReplayCandle ? activeReplayCandle.timestamp : tileBars[0].timestamp;

    // Filter tile bars to only those <= currentReplayTs (Strict Zero Lookahead)
    const visibleTileBars = tileBars.filter((b) => b.timestamp <= currentReplayTs);
    if (visibleTileBars.length === 0) return;

    const chartData = visibleTileBars.map((candle) => ({
      time: (candle.timestamp / 1000) as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    const volumeData = visibleTileBars.map((candle) => ({
      time: (candle.timestamp / 1000) as UTCTimestamp,
      value: candle.volume,
      color: candle.close >= candle.open ? '#22c55e' : '#ef4444',
    }));

    chartManagerRef.current.setData(chartData, volumeData);
    chartManagerRef.current.scrollToLatest();

    // Compute and attach Technical Indicator Line Series
    const manager = chartManagerRef.current;
    manager.removeAllIndicatorSeries();

    activeIndicators
      .filter((ind) => ind.visible && ind.isOverlay)
      .forEach((ind) => {
        if (ind.type === 'ema') {
          const period = ind.parameters.period || 20;
          const points = calculateEMA(visibleTileBars, period);
          if (points.length > 0) {
            manager.addIndicatorSeries(ind.id, ind.color, ind.lineWidth);
            manager.setIndicatorData(
              ind.id,
              points.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
            );
          }
        } else if (ind.type === 'sma') {
          const period = ind.parameters.period || 20;
          const points = calculateSMA(visibleTileBars, period);
          if (points.length > 0) {
            manager.addIndicatorSeries(ind.id, ind.color, ind.lineWidth);
            manager.setIndicatorData(
              ind.id,
              points.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
            );
          }
        } else if (ind.type === 'vwap') {
          const points = calculateVWAP(visibleTileBars);
          if (points.length > 0) {
            manager.addIndicatorSeries(ind.id, ind.color, ind.lineWidth);
            manager.setIndicatorData(
              ind.id,
              points.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
            );
          }
        } else if (ind.type === 'bollinger') {
          const period = ind.parameters.period || 20;
          const std = ind.parameters.stdDevMultiplier || 2;
          const points = calculateBollingerBands(visibleTileBars, period, std);
          if (points.length > 0) {
            const upId = `${ind.id}_upper`;
            const midId = `${ind.id}_mid`;
            const lowId = `${ind.id}_lower`;

            manager.addIndicatorSeries(upId, ind.parameters.upperColor || ind.color, 1);
            manager.addIndicatorSeries(midId, ind.color, ind.lineWidth);
            manager.addIndicatorSeries(lowId, ind.parameters.lowerColor || ind.color, 1);

            manager.setIndicatorData(
              upId,
              points.map((p) => ({ time: p.time as UTCTimestamp, value: p.upper }))
            );
            manager.setIndicatorData(
              midId,
              points.map((p) => ({ time: p.time as UTCTimestamp, value: p.middle }))
            );
            manager.setIndicatorData(
              lowId,
              points.map((p) => ({ time: p.time as UTCTimestamp, value: p.lower }))
            );
          }
        }
      });
  }, [tileBars, allCandles, currentIndex, preloadCount, activeIndicators]);

  // Synchronize price lines for Open Positions and Pending Orders
  useEffect(() => {
    if (!chartManagerRef.current) return;
    const manager = chartManagerRef.current;
    manager.removeAllPriceLines();

    positions
      .filter((p) => p.symbol === activeSymbol)
      .forEach((pos) => {
        const sideTag = pos.side.toUpperCase();
        manager.addPriceLine(`${pos.id}_entry`, pos.entryPrice, '#3b82f6', `${sideTag} ${pos.quantity} @ ${pos.entryPrice}`);
        if (pos.stopLoss) manager.addPriceLine(`${pos.id}_sl`, pos.stopLoss, '#ef4444', `SL: ${pos.stopLoss}`);
        if (pos.takeProfit) manager.addPriceLine(`${pos.id}_tp`, pos.takeProfit, '#22c55e', `TP: ${pos.takeProfit}`);
      });

    orders
      .filter((o) => o.status === 'pending' && o.symbol === activeSymbol && o.price !== null)
      .forEach((ord) => {
        manager.addPriceLine(`${ord.id}_order`, ord.price!, '#a855f7', `${ord.type.toUpperCase()} ${ord.side.toUpperCase()} ${ord.quantity} @ ${ord.price}`);
      });
  }, [positions, orders, activeSymbol]);

  // Synchronize Trade Markers
  useEffect(() => {
    if (!chartManagerRef.current || !symbolObj) return;
    const markers = generateTradeMarkers(closedTrades, positions, symbolObj);
    chartManagerRef.current.setMarkers(markers);
  }, [closedTrades, positions, symbolObj]);

  // Handle Resize
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setChartDimensions({ width, height });
        chartManagerRef.current?.resize(width, height);
      }
    });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      onClick={() => isMultiChart && setActiveTileIndex(tileIndex)}
      className={cn(
        'relative w-full h-full overflow-hidden select-none bg-[#070a12] flex flex-col',
        isMultiChart && 'border border-[#182236] transition-all',
        isMultiChart && isTileFocused && 'border-blue-500/80 shadow-md shadow-blue-500/10',
        className
      )}
    >
      {/* Multi-Chart Mini Header Bar */}
      {isMultiChart && (
        <div className="h-6 bg-[#0a0e17] border-b border-[#182236] px-2 flex items-center justify-between z-20 flex-shrink-0 text-[11px] font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-white">{activeSymbol}</span>
            <span className="text-gray-500">·</span>
            <span className="text-blue-400 font-semibold">{activeTimeframe}</span>
          </div>

          <div className="flex items-center space-x-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={(e) => {
                  e.stopPropagation();
                  setTileTimeframe(tileIndex, tf as Timeframe);
                }}
                className={cn(
                  'px-1 py-0.2 rounded text-[10px] transition',
                  activeTimeframe === tf ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Chart Container */}
      <div className="flex-1 relative overflow-hidden">
        {!isMultiChart && <ChartLegend symbolObj={symbolObj} />}
        {(!isMultiChart || isTileFocused) && <OnChartTradingWidget />}
        <div ref={containerRef} className="w-full h-full" />
        <DrawingCanvas
          chartManager={chartManagerRef.current}
          width={chartDimensions.width}
          height={chartDimensions.height}
        />
        <FootprintCanvas
          chartManager={chartManagerRef.current}
          width={chartDimensions.width}
          height={chartDimensions.height}
        />
      </div>
    </div>
  );
}
