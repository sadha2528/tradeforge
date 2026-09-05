'use client';

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { ChartManager } from '@/lib/chart/chart-manager';
import { useChartStore } from '@/store/chart-store';
import { useReplayStore } from '@/store/replay-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import {
  generateSessionFootprints,
  calculateVolumeProfile,
} from '@/lib/orderflow/orderflow-engine';
import type { Symbol, OHLCV } from '@/types/market-data';
import type { CandleFootprint, VolumeProfileData } from '@/types/orderflow';

interface FootprintCanvasProps {
  chartManager: ChartManager | null;
  width: number;
  height: number;
}

export function FootprintCanvas({ chartManager, width, height }: FootprintCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [symbolObj, setSymbolObj] = React.useState<Symbol | null>(null);

  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const showFootprint = useChartStore((s) => s.showFootprint);
  const showVolumeProfile = useChartStore((s) => s.showVolumeProfile);
  const orderFlowSettings = useChartStore((s) => s.orderFlowSettings);

  const allCandles = useReplayStore((s) => s.allCandles);
  const currentIndex = useReplayStore((s) => s.currentIndex);
  const preloadCount = useReplayStore((s) => s.preloadCount);

  // Fetch symbol definition
  useEffect(() => {
    marketDataService.getSymbol(activeSymbol).then(setSymbolObj);
  }, [activeSymbol]);

  // Visible candles up to replay timestamp
  const visibleCandles = useMemo(() => {
    return allCandles.slice(0, preloadCount + currentIndex + 1);
  }, [allCandles, preloadCount, currentIndex]);

  // Generate footprints and volume profile for visible slice
  const { footprints, volumeProfile } = useMemo(() => {
    if (!symbolObj || visibleCandles.length === 0) {
      return { footprints: [], volumeProfile: null };
    }
    const { footprints: fps } = generateSessionFootprints(
      visibleCandles,
      symbolObj,
      orderFlowSettings
    );
    const vp = calculateVolumeProfile(
      fps,
      symbolObj,
      orderFlowSettings.valueAreaPercent || 70
    );
    return { footprints: fps, volumeProfile: vp };
  }, [visibleCandles, symbolObj, orderFlowSettings]);

  // Render on canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !chartManager || (!showFootprint && !showVolumeProfile)) {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, width, height);
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // ─────────────────────────────────────────────────────────────
    // 1. RENDER SESSION VOLUME PROFILE (VP)
    // ─────────────────────────────────────────────────────────────
    if (showVolumeProfile && volumeProfile && volumeProfile.levels.length > 0) {
      const maxVol = Math.max(1, ...volumeProfile.levels.map((l) => l.volume));
      const profileWidth = Math.min(180, width * 0.18);
      const isRightSide = orderFlowSettings.volumeProfileSide === 'right';
      const startX = isRightSide ? width - 55 - profileWidth : 50;

      // Draw Value Area background shading
      const vahY = chartManager.priceToCoordinate(volumeProfile.vah);
      const valY = chartManager.priceToCoordinate(volumeProfile.val);

      if (vahY !== null && valY !== null) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.04)';
        ctx.fillRect(
          isRightSide ? startX : 0,
          Math.min(vahY, valY),
          isRightSide ? profileWidth + 55 : startX + profileWidth,
          Math.abs(valY - vahY)
        );
      }

      // Draw Volume Profile bars at each level
      const tickSize = symbolObj?.tickSize || 0.25;
      for (const lvl of volumeProfile.levels) {
        const y = chartManager.priceToCoordinate(lvl.price);
        if (y === null || y < -10 || y > height + 10) continue;

        const nextY = chartManager.priceToCoordinate(lvl.price + tickSize);
        const barH = Math.max(2, nextY !== null ? Math.abs(y - nextY) : 4);
        const barW = (lvl.volume / maxVol) * profileWidth;

        const inValueArea = lvl.price >= volumeProfile.val && lvl.price <= volumeProfile.vah;
        const isPOC = Math.abs(lvl.price - volumeProfile.poc) < tickSize * 0.5;

        if (isPOC) {
          ctx.fillStyle = 'rgba(234, 179, 8, 0.7)'; // Yellow POC
        } else if (inValueArea) {
          ctx.fillStyle = lvl.delta >= 0 ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.45)';
        } else {
          ctx.fillStyle = 'rgba(100, 116, 139, 0.25)'; // Outside VA
        }

        const barX = isRightSide ? width - 55 - barW : startX;
        ctx.fillRect(barX, y - barH / 2, barW, barH - 1);
      }

      // Draw POC line
      const pocY = chartManager.priceToCoordinate(volumeProfile.poc);
      if (pocY !== null && pocY >= 0 && pocY <= height) {
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, pocY);
        ctx.lineTo(width - 55, pocY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = '#eab308';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`POC ${volumeProfile.poc}`, isRightSide ? startX - 60 : startX + profileWidth + 5, pocY - 2);
      }

      // Draw VAH line
      if (vahY !== null && vahY >= 0 && vahY <= height) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, vahY);
        ctx.lineTo(width - 55, vahY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
        ctx.font = '9px monospace';
        ctx.fillText(`VAH ${volumeProfile.vah}`, isRightSide ? startX - 60 : startX + profileWidth + 5, vahY - 2);
      }

      // Draw VAL line
      if (valY !== null && valY >= 0 && valY <= height) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, valY);
        ctx.lineTo(width - 55, valY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
        ctx.font = '9px monospace';
        ctx.fillText(`VAL ${volumeProfile.val}`, isRightSide ? startX - 60 : startX + profileWidth + 5, valY - 2);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. RENDER CANDLE FOOTPRINTS (BID x ASK CLUSTERS)
    // ─────────────────────────────────────────────────────────────
    if (showFootprint && footprints.length > 0 && symbolObj) {
      const tickSize = symbolObj.tickSize || 0.25;

      // Only render visible recent candles to maintain 60fps
      const recentFps = footprints.slice(-40);

      for (const fp of recentFps) {
        const x = chartManager.timeToCoordinate(fp.timestamp);
        if (x === null || x < -50 || x > width + 50) continue;

        const clusterWidth = 56; // width of bid x ask box
        const halfW = clusterWidth / 2;

        for (const lvl of fp.levels) {
          const y = chartManager.priceToCoordinate(lvl.price);
          if (y === null || y < -10 || y > height + 10) continue;

          const nextY = chartManager.priceToCoordinate(lvl.price + tickSize);
          const cellH = Math.max(10, nextY !== null ? Math.abs(y - nextY) : 12);
          const topY = y - cellH / 2;

          // Background for imbalance
          if (lvl.isImbalanceBuy) {
            ctx.fillStyle = 'rgba(34, 197, 94, 0.35)'; // Bright green for aggressive buying
            ctx.fillRect(x, topY, halfW, cellH);
          } else if (lvl.isImbalanceSell) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.35)'; // Bright red for aggressive selling
            ctx.fillRect(x - halfW, topY, halfW, cellH);
          }

          // Candle POC border
          if (lvl.isPOC && orderFlowSettings.showCandlePOC) {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x - halfW, topY, clusterWidth, cellH);
          }

          // Text numbers: Bid (left) x Ask (right)
          ctx.font = '9px monospace';
          ctx.textAlign = 'right';
          ctx.fillStyle = lvl.isImbalanceSell ? '#fca5a5' : '#94a3b8';
          ctx.fillText(String(lvl.bidVolume), x - 2, topY + cellH - 2);

          ctx.textAlign = 'left';
          ctx.fillStyle = lvl.isImbalanceBuy ? '#86efac' : '#e2e8f0';
          ctx.fillText(String(lvl.askVolume), x + 3, topY + cellH - 2);

          // Divider between bid and ask
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x, topY);
          ctx.lineTo(x, topY + cellH);
          ctx.stroke();
        }

        // ── CANDLE STATS FOOTER (Delta & Total Volume beneath candle) ──
        if (orderFlowSettings.showCandleStats) {
          const lowY = chartManager.priceToCoordinate(fp.low);
          if (lowY !== null && lowY < height - 30) {
            const statsY = lowY + 14;

            // Delta Badge
            const isPos = fp.delta >= 0;
            ctx.fillStyle = isPos ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
            ctx.strokeStyle = isPos ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x - halfW, statsY, clusterWidth, 14);
            ctx.fillRect(x - halfW, statsY, clusterWidth, 14);

            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = isPos ? '#4ade80' : '#f87171';
            ctx.fillText(`${isPos ? '+' : ''}${fp.delta}`, x, statsY + 10);

            // Volume text below delta
            ctx.font = '8px monospace';
            ctx.fillStyle = '#64748b';
            ctx.fillText(`Vol: ${fp.totalVolume}`, x, statsY + 23);
          }
        }
      }
    }
  }, [
    chartManager,
    width,
    height,
    showFootprint,
    showVolumeProfile,
    footprints,
    volumeProfile,
    symbolObj,
    orderFlowSettings,
  ]);

  // Request Animation Frame loop synchronized with chart pan/zoom
  useEffect(() => {
    let animId: number;
    const loop = () => {
      render();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [render]);

  if (!showFootprint && !showVolumeProfile) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-15"
    />
  );
}
