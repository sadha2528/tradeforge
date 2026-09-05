'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useChartStore } from '@/store/chart-store';
import { useTradingStore } from '@/store/trading-store';
import { useReplayStore } from '@/store/replay-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import { ChartManager } from '@/lib/chart/chart-manager';
import { InstrumentRegistry } from '@/lib/trading-engine/instrument-registry';
import { soundEngine } from '@/lib/audio/sound-engine';
import { formatCurrency, formatPnL, formatDuration } from '@/lib/utils/formatting';
import { snapToCandleOHLC } from '@/lib/chart/magnet';
import type { Drawing, DrawingTool, DrawingPoint } from '@/types/chart';
import type { Symbol } from '@/types/market-data';
import type { Trade } from '@/types/trading';
import {
  Play,
  Clock,
  Bookmark,
  FileText,
  Ruler,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawingCanvasProps {
  chartManager: ChartManager | null;
  width: number;
  height: number;
}

type DragTarget =
  | { type: 'position_sl'; positionId: string }
  | { type: 'position_tp'; positionId: string }
  | { type: 'drawing_point'; drawingId: string; pointIndex: number }
  | { type: 'drawing_sl'; drawingId: string }
  | { type: 'drawing_tp'; drawingId: string }
  | null;

interface DragState {
  target: DragTarget;
  startY: number;
  currentPrice: number;
  isDragging: boolean;
}

interface ContextMenuState {
  x: number;
  y: number;
  time: number;
  price: number;
}

export function DrawingCanvas({ chartManager, width, height }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activePoints, setActivePoints] = useState<DrawingPoint[]>([]);
  const [hoverPoint, setHoverPoint] = useState<DrawingPoint | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [cursorStyle, setCursorStyle] = useState<string>('default');
  const [symbolObj, setSymbolObj] = useState<Symbol | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Selected Trade Review Card State
  const [selectedTradeIndex, setSelectedTradeIndex] = useState<number | null>(null);

  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const activeTool = useChartStore((s) => s.activeTool);
  const setActiveTool = useChartStore((s) => s.setActiveTool);
  const drawings = useChartStore((s) => s.drawings);
  const addDrawing = useChartStore((s) => s.addDrawing);
  const updateDrawing = useChartStore((s) => s.updateDrawing);
  const deleteDrawing = useChartStore((s) => s.deleteDrawing);
  const selectedDrawingId = useChartStore((s) => s.selectedDrawingId);
  const setSelectedDrawingId = useChartStore((s) => s.setSelectedDrawingId);
  const magnetMode = useChartStore((s) => s.magnetMode);
  const areDrawingsLocked = useChartStore((s) => s.areDrawingsLocked);
  const areDrawingsHidden = useChartStore((s) => s.areDrawingsHidden);

  const positions = useTradingStore((s) => s.positions);
  const closedTrades = useTradingStore((s) => s.closedTrades);
  const updateStopLossTakeProfit = useTradingStore((s) => s.updateStopLossTakeProfit);

  const jumpToTimestamp = useReplayStore((s) => s.jumpToTimestamp);
  const allCandles = useReplayStore((s) => s.allCandles);
  const currentIndex = useReplayStore((s) => s.currentIndex);
  const preloadCount = useReplayStore((s) => s.preloadCount);

  useEffect(() => {
    marketDataService.getSymbol(activeSymbol).then(setSymbolObj);
  }, [activeSymbol]);

  // Convert pixel (x, y) on canvas to (timestamp, price) using ChartManager, with optional Magnet snapping
  const getCoordinatesFromPixel = useCallback(
    (x: number, y: number): DrawingPoint | null => {
      if (!chartManager) return null;
      const price = chartManager.coordinateToPrice(y);
      const time = chartManager.coordinateToTime(x);
      if (price === null || time === null) return null;
      const rawPt: DrawingPoint = { time, price };
      const visibleCandles = allCandles.slice(0, preloadCount + currentIndex + 1);
      return snapToCandleOHLC(rawPt, magnetMode, visibleCandles, chartManager);
    },
    [chartManager, magnetMode, allCandles, preloadCount, currentIndex]
  );

  // Convert (timestamp, price) to pixel (x, y) using ChartManager
  const getPixelFromCoordinates = useCallback(
    (pt: DrawingPoint): { x: number; y: number } | null => {
      if (!chartManager) return null;
      const x = chartManager.timeToCoordinate(pt.time);
      const y = chartManager.priceToCoordinate(pt.price);
      if (x === null || y === null) return null;
      return { x, y };
    },
    [chartManager]
  );

  // Main Canvas Render Loop
  const renderDrawings = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !chartManager) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Active Open Positions SL / TP Lines, Shaded Risk/Reward Zones & Draggable Handles
    const inst = InstrumentRegistry.getInstrument(activeSymbol);
    const tickSz = inst?.tickSize || symbolObj?.tickSize || 0.25;
    const tickVal = inst?.tickValue || symbolObj?.tickValue || 12.50;
    const precision = inst?.pricePrecision || symbolObj?.pricePrecision || 2;

    positions.forEach((pos) => {
      if (pos.symbol !== activeSymbol) return;

      const isSlDragging = dragState?.target?.type === 'position_sl' && dragState.target.positionId === pos.id;
      const isTpDragging = dragState?.target?.type === 'position_tp' && dragState.target.positionId === pos.id;
      const currentSl = isSlDragging ? dragState.currentPrice : pos.stopLoss;
      const currentTp = isTpDragging ? dragState.currentPrice : pos.takeProfit;

      const entryY = chartManager.priceToCoordinate(pos.entryPrice);
      if (entryY !== null) {
        // Translucent Shaded Risk Band (Red)
        if (currentSl !== null && currentSl !== undefined) {
          const slY = chartManager.priceToCoordinate(currentSl);
          if (slY !== null) {
            const topY = Math.min(entryY, slY);
            const bandH = Math.abs(slY - entryY);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
            ctx.fillRect(0, topY, width, bandH);
          }
        }

        // Translucent Shaded Reward Band (Green)
        if (currentTp !== null && currentTp !== undefined) {
          const tpY = chartManager.priceToCoordinate(currentTp);
          if (tpY !== null) {
            const topY = Math.min(entryY, tpY);
            const bandH = Math.abs(tpY - entryY);
            ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
            ctx.fillRect(0, topY, width, bandH);
          }
        }

        // Entry Price Line
        ctx.strokeStyle = pos.side === 'long' ? '#3b82f6' : '#ec4899';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, entryY);
        ctx.lineTo(width, entryY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Entry Badge
        const entryText = `${pos.side.toUpperCase()} ${pos.quantity} @ ${pos.entryPrice.toFixed(precision)}`;
        ctx.font = 'bold 10px JetBrains Mono';
        const entryW = ctx.measureText(entryText).width + 16;
        ctx.fillStyle = pos.side === 'long' ? '#3b82f6' : '#ec4899';
        ctx.fillRect(width - entryW - 10, entryY - 10, entryW, 20);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(entryText, width - entryW - 2, entryY + 4);
      }

      // Stop Loss Line & Draggable Handle
      if (currentSl !== null && currentSl !== undefined) {
        const slY = chartManager.priceToCoordinate(currentSl);
        if (slY !== null) {
          ctx.strokeStyle = isSlDragging ? '#f87171' : '#ef4444';
          ctx.lineWidth = isSlDragging ? 2 : 1.5;
          ctx.setLineDash([4, 2]);
          ctx.beginPath();
          ctx.moveTo(0, slY);
          ctx.lineTo(width, slY);
          ctx.stroke();
          ctx.setLineDash([]);

          const points = Math.abs(pos.entryPrice - currentSl);
          const ticks = Math.round(points / tickSz);
          const dollarRisk = ticks * tickVal * pos.quantity;

          // Drag Handle Dot with Halo Ring
          ctx.fillStyle = isSlDragging ? '#f87171' : '#ef4444';
          ctx.beginPath();
          ctx.arc(width - 250, slY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(width - 250, slY, 3, 0, Math.PI * 2);
          ctx.fill();

          // SL Price & Risk Badge
          const slText = `SL: ${currentSl.toFixed(precision)} (-${ticks}t · -$${dollarRisk.toFixed(0)})`;
          ctx.font = 'bold 10px JetBrains Mono';
          const badgeW = ctx.measureText(slText).width + 16;
          const badgeX = width - badgeW - 10;
          ctx.fillStyle = isSlDragging ? '#dc2626' : '#ef4444';
          ctx.fillRect(badgeX, slY - 10, badgeW, 20);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(slText, badgeX + 8, slY + 4);
        }
      }

      // Take Profit Line & Draggable Handle
      if (currentTp !== null && currentTp !== undefined) {
        const tpY = chartManager.priceToCoordinate(currentTp);
        if (tpY !== null) {
          ctx.strokeStyle = isTpDragging ? '#4ade80' : '#22c55e';
          ctx.lineWidth = isTpDragging ? 2 : 1.5;
          ctx.setLineDash([4, 2]);
          ctx.beginPath();
          ctx.moveTo(0, tpY);
          ctx.lineTo(width, tpY);
          ctx.stroke();
          ctx.setLineDash([]);

          const points = Math.abs(currentTp - pos.entryPrice);
          const ticks = Math.round(points / tickSz);
          const dollarReward = ticks * tickVal * pos.quantity;

          // Drag Handle Dot with Halo Ring
          ctx.fillStyle = isTpDragging ? '#4ade80' : '#22c55e';
          ctx.beginPath();
          ctx.arc(width - 250, tpY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(width - 250, tpY, 3, 0, Math.PI * 2);
          ctx.fill();

          // TP Price & Reward Badge
          const tpText = `TP: ${currentTp.toFixed(precision)} (+${ticks}t · +$${dollarReward.toFixed(0)})`;
          ctx.font = 'bold 10px JetBrains Mono';
          const badgeW = ctx.measureText(tpText).width + 16;
          const badgeX = width - badgeW - 10;
          ctx.fillStyle = isTpDragging ? '#16a34a' : '#22c55e';
          ctx.fillRect(badgeX, tpY - 10, badgeW, 20);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(tpText, badgeX + 8, tpY + 4);
        }
      }

      // R:R Indicator Pill
      if (
        currentSl !== null &&
        currentSl !== undefined &&
        currentTp !== null &&
        currentTp !== undefined &&
        entryY !== null
      ) {
        const slPts = Math.abs(pos.entryPrice - currentSl);
        const tpPts = Math.abs(currentTp - pos.entryPrice);
        if (slPts > 0) {
          const ratio = (tpPts / slPts).toFixed(2);
          const rrText = `R:R 1 : ${ratio}`;
          ctx.font = 'bold 9px JetBrains Mono';
          const rrW = ctx.measureText(rrText).width + 12;
          const rrX = width - 270 - rrW;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(rrX, entryY - 9, rrW, 18);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.strokeRect(rrX, entryY - 9, rrW, 18);
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(rrText, rrX + 6, entryY + 3);
        }
      }
    });

    // 2. Draw Committed Drawings
    if (!areDrawingsHidden) {
      drawings.forEach((d) => {
        if (!d.visible) return;
        const isSelected = selectedDrawingId === d.id;
      ctx.strokeStyle = d.color || '#3b82f6';
      ctx.fillStyle = d.fillColor || 'rgba(59, 130, 246, 0.15)';
      ctx.lineWidth = isSelected ? (d.lineWidth || 2) + 1 : d.lineWidth || 2;

      // Trendline
      if (d.type === 'trendline' && d.points.length >= 2) {
        const p1 = getPixelFromCoordinates(d.points[0]);
        const p2 = getPixelFromCoordinates(d.points[1]);
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
      // Ray Line
      else if (d.type === 'ray' && d.points.length >= 2) {
        const p1 = getPixelFromCoordinates(d.points[0]);
        const p2 = getPixelFromCoordinates(d.points[1]);
        if (p1 && p2) {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const extX = p1.x + (dx !== 0 ? width * 2 * Math.sign(dx) : 0);
          const extY = p1.y + (dx !== 0 ? (dy / dx) * (extX - p1.x) : height * Math.sign(dy));

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(extX, extY);
          ctx.stroke();
        }
      }
      // Horizontal Line
      else if (d.type === 'horizontal-line' && d.points.length >= 1) {
        const p1 = getPixelFromCoordinates(d.points[0]);
        if (p1) {
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(0, p1.y);
          ctx.lineTo(width, p1.y);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = d.color || '#3b82f6';
          ctx.fillRect(width - 65, p1.y - 8, 60, 16);
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px JetBrains Mono';
          ctx.fillText(d.points[0].price.toFixed(2), width - 60, p1.y + 4);
        }
      }
      // Vertical Line
      else if (d.type === 'vertical-line' && d.points.length >= 1) {
        const p1 = getPixelFromCoordinates(d.points[0]);
        if (p1) {
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(p1.x, 0);
          ctx.lineTo(p1.x, height);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      // Rectangle / Order Block
      else if (d.type === 'rectangle' && d.points.length >= 2) {
        const p1 = getPixelFromCoordinates(d.points[0]);
        const p2 = getPixelFromCoordinates(d.points[1]);
        if (p1 && p2) {
          const x = Math.min(p1.x, p2.x);
          const y = Math.min(p1.y, p2.y);
          const w = Math.abs(p2.x - p1.x);
          const h = Math.abs(p2.y - p1.y);
          ctx.fillRect(x, y, w, h);
          ctx.strokeRect(x, y, w, h);
        }
      }
      // Circle / Area
      else if (d.type === 'circle' && d.points.length >= 2) {
        const p1 = getPixelFromCoordinates(d.points[0]);
        const p2 = getPixelFromCoordinates(d.points[1]);
        if (p1 && p2) {
          const radius = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
      // Arrow
      else if (d.type === 'arrow' && d.points.length >= 2) {
        const p1 = getPixelFromCoordinates(d.points[0]);
        const p2 = getPixelFromCoordinates(d.points[1]);
        if (p1 && p2) {
          const headlen = 10;
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const angle = Math.atan2(dy, dx);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p2.x - headlen * Math.cos(angle - Math.PI / 6), p2.y - headlen * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(p2.x, p2.y);
          ctx.lineTo(p2.x - headlen * Math.cos(angle + Math.PI / 6), p2.y - headlen * Math.sin(angle + Math.PI / 6));
          ctx.stroke();
        }
      }
      // Long Position Tool (TradingView Style with Draggable Handles)
      else if (d.type === 'long-position' && d.points.length >= 1) {
        const entryPt = getPixelFromCoordinates(d.points[0]);
        if (entryPt) {
          const entryPrice = d.points[0].price;
          const stopPrice = d.stopPrice ?? entryPrice * 0.995;
          const targetPrice = d.targetPrice ?? entryPrice * 1.01;

          const stopPt = chartManager.priceToCoordinate(stopPrice);
          const targetPt = chartManager.priceToCoordinate(targetPrice);

          if (stopPt !== null && targetPt !== null) {
            const boxW = Math.min(220, Math.max(120, width - entryPt.x));
            const stopTicks = Math.round(Math.abs(entryPrice - stopPrice) / (symbolObj?.tickSize || 0.25));
            const targetTicks = Math.round(Math.abs(targetPrice - entryPrice) / (symbolObj?.tickSize || 0.25));
            const ratio = stopTicks > 0 ? (targetTicks / stopTicks).toFixed(2) : '0';

            // Target Green Box
            ctx.fillStyle = 'rgba(34, 197, 94, 0.18)';
            ctx.strokeStyle = '#22c55e';
            ctx.fillRect(entryPt.x, targetPt, boxW, entryPt.y - targetPt);
            ctx.strokeRect(entryPt.x, targetPt, boxW, entryPt.y - targetPt);

            // Stop Red Box
            ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
            ctx.strokeStyle = '#ef4444';
            ctx.fillRect(entryPt.x, entryPt.y, boxW, stopPt - entryPt.y);
            ctx.strokeRect(entryPt.x, entryPt.y, boxW, stopPt - entryPt.y);

            // Entry Line
            ctx.strokeStyle = '#94a3b8';
            ctx.beginPath();
            ctx.moveTo(entryPt.x, entryPt.y);
            ctx.lineTo(entryPt.x + boxW, entryPt.y);
            ctx.stroke();

            // Header R:R Card
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(entryPt.x + 4, targetPt + 4, boxW - 8, 28);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px JetBrains Mono';
            ctx.fillText(`LONG R:R 1 : ${ratio}`, entryPt.x + 8, targetPt + 15);
            ctx.fillStyle = '#22c55e';
            ctx.fillText(`TP +${targetTicks}t`, entryPt.x + 8, targetPt + 26);
            ctx.fillStyle = '#ef4444';
            ctx.fillText(`SL -${stopTicks}t`, entryPt.x + 75, targetPt + 26);
          }
        }
      }
      // Short Position Tool (TradingView Style with Draggable Handles)
      else if (d.type === 'short-position' && d.points.length >= 1) {
        const entryPt = getPixelFromCoordinates(d.points[0]);
        if (entryPt) {
          const entryPrice = d.points[0].price;
          const stopPrice = d.stopPrice ?? entryPrice * 1.005;
          const targetPrice = d.targetPrice ?? entryPrice * 0.99;

          const stopPt = chartManager.priceToCoordinate(stopPrice);
          const targetPt = chartManager.priceToCoordinate(targetPrice);

          if (stopPt !== null && targetPt !== null) {
            const boxW = Math.min(220, Math.max(120, width - entryPt.x));
            const stopTicks = Math.round(Math.abs(stopPrice - entryPrice) / (symbolObj?.tickSize || 0.25));
            const targetTicks = Math.round(Math.abs(entryPrice - targetPrice) / (symbolObj?.tickSize || 0.25));
            const ratio = stopTicks > 0 ? (targetTicks / stopTicks).toFixed(2) : '0';

            // Stop Red Box
            ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
            ctx.strokeStyle = '#ef4444';
            ctx.fillRect(entryPt.x, stopPt, boxW, entryPt.y - stopPt);
            ctx.strokeRect(entryPt.x, stopPt, boxW, entryPt.y - stopPt);

            // Target Green Box
            ctx.fillStyle = 'rgba(34, 197, 94, 0.18)';
            ctx.strokeStyle = '#22c55e';
            ctx.fillRect(entryPt.x, entryPt.y, boxW, targetPt - entryPt.y);
            ctx.strokeRect(entryPt.x, entryPt.y, boxW, targetPt - entryPt.y);

            // Entry Line
            ctx.strokeStyle = '#94a3b8';
            ctx.beginPath();
            ctx.moveTo(entryPt.x, entryPt.y);
            ctx.lineTo(entryPt.x + boxW, entryPt.y);
            ctx.stroke();

            // Header R:R Card
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(entryPt.x + 4, stopPt + 4, boxW - 8, 28);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px JetBrains Mono';
            ctx.fillText(`SHORT R:R 1 : ${ratio}`, entryPt.x + 8, stopPt + 15);
            ctx.fillStyle = '#22c55e';
            ctx.fillText(`TP +${targetTicks}t`, entryPt.x + 8, stopPt + 26);
            ctx.fillStyle = '#ef4444';
            ctx.fillText(`SL -${stopTicks}t`, entryPt.x + 75, stopPt + 26);
          }
        }
      }
      // Measure Tool
      else if (d.type === 'measure' && d.points.length >= 2) {
        const p1 = getPixelFromCoordinates(d.points[0]);
        const p2 = getPixelFromCoordinates(d.points[1]);
        if (p1 && p2) {
          const deltaPrice = d.points[1].price - d.points[0].price;
          const pct = ((deltaPrice / d.points[0].price) * 100).toFixed(2);

          ctx.strokeStyle = '#a855f7';
          ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
          ctx.fillRect(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y));
          ctx.strokeRect(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y));

          ctx.fillStyle = '#a855f7';
          ctx.font = 'bold 10px JetBrains Mono';
          ctx.fillText(`Δ ${deltaPrice > 0 ? '+' : ''}${deltaPrice.toFixed(2)} (${pct}%)`, Math.min(p1.x, p2.x) + 6, Math.min(p1.y, p2.y) + 14);
        }
      }
      // Text
      else if (d.type === 'text' && d.points.length >= 1) {
        const p1 = getPixelFromCoordinates(d.points[0]);
        if (p1) {
          ctx.fillStyle = d.color || '#f3f4f6';
          ctx.font = '12px Inter';
          ctx.fillText(d.text || 'Note', p1.x, p1.y);
        }
      }
    });

    // 3. Draw in-progress drawing preview
    if (activePoints.length > 0 && hoverPoint) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([2, 2]);

      const p1 = getPixelFromCoordinates(activePoints[0]);
      const p2 = getPixelFromCoordinates(hoverPoint);

      if (p1 && p2) {
        if (activeTool === 'trendline' || activeTool === 'ray' || activeTool === 'measure' || activeTool === 'arrow') {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        } else if (activeTool === 'rectangle') {
          ctx.strokeRect(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y));
        } else if (activeTool === 'circle') {
          const radius = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    }

    // 4. Draw Floating Dragging HUD when dragging SL/TP
    if (dragState?.isDragging && dragState.currentPrice !== null) {
      const isSL = dragState.target?.type === 'position_sl';
      const isTP = dragState.target?.type === 'position_tp';
      if (isSL || isTP) {
        const pos = positions.find((p) => p.id === (dragState.target as any).positionId);
        if (pos) {
          const deltaPts = Math.abs(pos.entryPrice - dragState.currentPrice);
          const ticks = Math.round(deltaPts / tickSz);
          const dollars = ticks * tickVal * pos.quantity;
          const title = isSL ? 'ADJUSTING STOP LOSS' : 'ADJUSTING TAKE PROFIT';
          const color = isSL ? '#ef4444' : '#22c55e';

          const yCoord = chartManager.priceToCoordinate(dragState.currentPrice);
          const boxW = 220;
          const boxH = 48;
          const boxX = Math.max(10, Math.min(width - boxW - 10, width / 2 - boxW / 2));
          const boxY = yCoord !== null ? Math.max(10, Math.min(height - boxH - 10, yCoord - 58)) : 60;

          ctx.fillStyle = 'rgba(11, 16, 29, 0.95)';
          ctx.fillRect(boxX, boxY, boxW, boxH);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(boxX, boxY, boxW, boxH);

          ctx.fillStyle = color;
          ctx.font = 'bold 10px JetBrains Mono';
          ctx.fillText(title, boxX + 10, boxY + 16);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px JetBrains Mono';
          const detailText = `${dragState.currentPrice.toFixed(precision)} (${isSL ? '-' : '+'}${ticks}t · ${isSL ? '-' : '+'}$${dollars.toFixed(0)})`;
          ctx.fillText(detailText, boxX + 10, boxY + 35);
        }
      }
    }
    }
  }, [
    chartManager,
    drawings,
    positions,
    activeSymbol,
    activePoints,
    hoverPoint,
    activeTool,
    selectedDrawingId,
    areDrawingsHidden,
    width,
    height,
    symbolObj,
    dragState,
    getPixelFromCoordinates,
  ]);

  // Handle Canvas Mouse Clicks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragState?.isDragging) return;
    // Close context menu if open
    if (contextMenu) setContextMenu(null);

    if (!activeTool || activeTool === 'crosshair') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pt = getCoordinatesFromPixel(x, y);
    if (!pt) return;

    if (activeTool === 'delete') {
      if (areDrawingsLocked) return;
      for (const d of drawings) {
        if (d.points.length > 0) {
          const dPt = getPixelFromCoordinates(d.points[0]);
          if (dPt && Math.abs(dPt.x - x) < 25 && Math.abs(dPt.y - y) < 25) {
            deleteDrawing(d.id);
            break;
          }
        }
      }
      return;
    }

    if (activeTool === 'horizontal-line' || activeTool === 'vertical-line') {
      addDrawing({
        id: crypto.randomUUID(),
        type: activeTool,
        points: [pt],
        color: '#3b82f6',
        lineWidth: 2,
        visible: true,
      });
      setActiveTool(null);
    } else if (activeTool === 'long-position') {
      const entryPrice = pt.price;
      const stopPrice = entryPrice - (symbolObj ? symbolObj.tickSize * 20 : 5);
      const targetPrice = entryPrice + (symbolObj ? symbolObj.tickSize * 40 : 10);
      addDrawing({
        id: crypto.randomUUID(),
        type: 'long-position',
        points: [pt],
        entryPrice,
        stopPrice,
        targetPrice,
        color: '#3b82f6',
        lineWidth: 2,
        visible: true,
      });
      setActiveTool(null);
    } else if (activeTool === 'short-position') {
      const entryPrice = pt.price;
      const stopPrice = entryPrice + (symbolObj ? symbolObj.tickSize * 20 : 5);
      const targetPrice = entryPrice - (symbolObj ? symbolObj.tickSize * 40 : 10);
      addDrawing({
        id: crypto.randomUUID(),
        type: 'short-position',
        points: [pt],
        entryPrice,
        stopPrice,
        targetPrice,
        color: '#ec4899',
        lineWidth: 2,
        visible: true,
      });
      setActiveTool(null);
    } else if (activeTool === 'text') {
      const note = prompt('Enter annotation text:');
      if (note) {
        addDrawing({
          id: crypto.randomUUID(),
          type: 'text',
          points: [pt],
          text: note,
          color: '#ffffff',
          lineWidth: 1,
          visible: true,
        });
      }
      setActiveTool(null);
    } else {
      // 2-point tools (trendline, ray, rectangle, circle, measure, arrow)
      if (activePoints.length === 0) {
        setActivePoints([pt]);
      } else {
        addDrawing({
          id: crypto.randomUUID(),
          type: activeTool,
          points: [activePoints[0], pt],
          color: activeTool === 'measure' ? '#a855f7' : '#3b82f6',
          lineWidth: 2,
          visible: true,
        });
        setActivePoints([]);
        setActiveTool(null);
      }
    }
  };

  // Handle Right Click for Context Menu ("Replay from here", "Go to this candle", etc.)
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pt = getCoordinatesFromPixel(x, y);
    if (!pt) return;

    setContextMenu({
      x,
      y,
      time: pt.time,
      price: pt.price,
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only left click
    if (activeTool && activeTool !== 'crosshair') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !chartManager) return;
    const y = e.clientY - rect.top;

    // Check active positions for SL or TP line/handle clicks
    for (const pos of positions) {
      if (pos.symbol !== activeSymbol) continue;

      if (pos.stopLoss) {
        const slY = chartManager.priceToCoordinate(pos.stopLoss);
        if (slY !== null && Math.abs(y - slY) <= 12) {
          setDragState({
            target: { type: 'position_sl', positionId: pos.id },
            startY: y,
            currentPrice: pos.stopLoss,
            isDragging: false,
          });
          e.preventDefault();
          return;
        }
      }

      if (pos.takeProfit) {
        const tpY = chartManager.priceToCoordinate(pos.takeProfit);
        if (tpY !== null && Math.abs(y - tpY) <= 12) {
          setDragState({
            target: { type: 'position_tp', positionId: pos.id },
            startY: y,
            currentPrice: pos.takeProfit,
            isDragging: false,
          });
          e.preventDefault();
          return;
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !chartManager) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragState) {
      if (!dragState.isDragging && Math.abs(y - dragState.startY) > 3) {
        setDragState((prev) => (prev ? { ...prev, isDragging: true } : null));
      }

      const rawPrice = chartManager.coordinateToPrice(y);
      if (rawPrice !== null) {
        const inst = InstrumentRegistry.getInstrument(activeSymbol);
        const tick = inst?.tickSize || symbolObj?.tickSize || 0.25;
        const quantizedPrice = Math.round(rawPrice / tick) * tick;
        setDragState((prev) => (prev ? { ...prev, isDragging: true, currentPrice: quantizedPrice } : null));
      }
      return;
    }

    const pt = getCoordinatesFromPixel(x, y);
    if (pt) setHoverPoint(pt);

    // Dynamic cursor detection when hovering over SL/TP
    if (!activeTool || activeTool === 'crosshair') {
      let isNear = false;
      for (const pos of positions) {
        if (pos.symbol !== activeSymbol) continue;
        if (pos.stopLoss) {
          const slY = chartManager.priceToCoordinate(pos.stopLoss);
          if (slY !== null && Math.abs(y - slY) <= 10) {
            isNear = true;
            break;
          }
        }
        if (pos.takeProfit) {
          const tpY = chartManager.priceToCoordinate(pos.takeProfit);
          if (tpY !== null && Math.abs(y - tpY) <= 10) {
            isNear = true;
            break;
          }
        }
      }
      setCursorStyle(isNear ? 'ns-resize' : 'default');
    }
  };

  const handleMouseUp = () => {
    if (dragState && dragState.isDragging && dragState.currentPrice !== null && dragState.target) {
      const target = dragState.target;
      if (target.type === 'position_sl') {
        const pos = positions.find((p) => p.id === target.positionId);
        updateStopLossTakeProfit(target.positionId, dragState.currentPrice, pos?.takeProfit);
        soundEngine.playStep();
      } else if (target.type === 'position_tp') {
        const pos = positions.find((p) => p.id === target.positionId);
        updateStopLossTakeProfit(target.positionId, pos?.stopLoss, dragState.currentPrice);
        soundEngine.playStep();
      }
    }
    setDragState(null);
  };

  const handleMouseLeave = () => {
    if (dragState && dragState.isDragging && dragState.currentPrice !== null) {
      handleMouseUp();
    } else {
      setDragState(null);
    }
    setHoverPoint(null);
  };

  // Subscribe to chart visible range changes to redraw during pan/zoom
  useEffect(() => {
    if (!chartManager) return;
    const chartApi = chartManager.getChartApi();
    const handleRangeChange = () => renderDrawings();
    chartApi.timeScale().subscribeVisibleLogicalRangeChange(handleRangeChange);
    return () => {
      try {
        chartApi.timeScale().unsubscribeVisibleLogicalRangeChange(handleRangeChange);
      } catch {}
    };
  }, [chartManager, renderDrawings]);

  useEffect(() => {
    renderDrawings();
  }, [renderDrawings]);

  const activeReviewTrade: Trade | null =
    selectedTradeIndex !== null && closedTrades[selectedTradeIndex]
      ? closedTrades[selectedTradeIndex]
      : null;

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: activeTool ? 'crosshair' : cursorStyle }}
        className="absolute inset-0 z-10 pointer-events-auto"
      />

      {/* Right Click Context Menu */}
      {contextMenu && (
        <div
          style={{ left: contextMenu.x + 10, top: contextMenu.y + 10 }}
          className="absolute z-40 bg-[#0d1322]/95 backdrop-blur-md border border-[#1e2942] rounded-xl shadow-2xl p-1 text-xs font-mono text-gray-200 w-48 space-y-0.5 animate-fadeIn"
        >
          <button
            onClick={() => {
              jumpToTimestamp(contextMenu.time * 1000, 60);
              setContextMenu(null);
            }}
            className="w-full px-2.5 py-1.5 rounded-lg hover:bg-blue-600 text-left flex items-center space-x-2 text-white font-semibold cursor-pointer transition"
          >
            <Play className="w-3.5 h-3.5 text-amber-400" />
            <span>Replay From Here</span>
          </button>

          <button
            onClick={() => {
              jumpToTimestamp(contextMenu.time * 1000, 60);
              setContextMenu(null);
            }}
            className="w-full px-2.5 py-1.5 rounded-lg hover:bg-[#162035] text-left flex items-center space-x-2 text-gray-300 cursor-pointer transition"
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Go to this Candle</span>
          </button>

          <button
            onClick={() => {
              addDrawing({
                id: crypto.randomUUID(),
                type: 'text',
                points: [{ time: contextMenu.time, price: contextMenu.price }],
                text: `Note @ ${contextMenu.price.toFixed(2)}`,
                color: '#3b82f6',
                lineWidth: 1,
                visible: true,
              });
              setContextMenu(null);
            }}
            className="w-full px-2.5 py-1.5 rounded-lg hover:bg-[#162035] text-left flex items-center space-x-2 text-gray-300 cursor-pointer transition"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Note at Price</span>
          </button>

          <button
            onClick={() => {
              setActiveTool('measure');
              setActivePoints([{ time: contextMenu.time, price: contextMenu.price }]);
              setContextMenu(null);
            }}
            className="w-full px-2.5 py-1.5 rounded-lg hover:bg-[#162035] text-left flex items-center space-x-2 text-gray-300 cursor-pointer transition"
          >
            <Ruler className="w-3.5 h-3.5 text-purple-400" />
            <span>Measure from Here</span>
          </button>
        </div>
      )}

      {/* On-Chart Floating Trade Review Card */}
      {activeReviewTrade && (
        <div className="absolute bottom-4 right-4 z-30 bg-[#0c111e]/95 backdrop-blur-md border border-[#1e2942] rounded-xl shadow-2xl p-3 text-xs font-mono text-gray-200 w-80 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#182338] pb-1.5">
            <div className="flex items-center space-x-2">
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-black',
                  activeReviewTrade.side === 'long'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                )}
              >
                {activeReviewTrade.side.toUpperCase()} {activeReviewTrade.quantity} {activeReviewTrade.symbol}
              </span>
              <span className="text-gray-400 text-[10px]">Trade Review</span>
            </div>

            <button
              onClick={() => setSelectedTradeIndex(null)}
              className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#162035] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-400">Entry / Exit:</span>
              <span className="text-white">
                {activeReviewTrade.entryPrice.toFixed(2)} → {activeReviewTrade.exitPrice?.toFixed(2) || 'Open'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Net Realized P&amp;L:</span>
              <strong className={activeReviewTrade.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {formatPnL(activeReviewTrade.netPnL)}
              </strong>
            </div>
            {activeReviewTrade.rMultiple !== null && (
              <div className="flex justify-between">
                <span className="text-gray-400">R-Multiple:</span>
                <span className="text-blue-400 font-bold">
                  {activeReviewTrade.rMultiple >= 0 ? '+' : ''}{activeReviewTrade.rMultiple}R
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Duration:</span>
              <span className="text-gray-300">
                {activeReviewTrade.duration ? formatDuration(activeReviewTrade.duration) : '-'}
              </span>
            </div>
          </div>

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between pt-1 border-t border-[#182338]">
            <button
              disabled={selectedTradeIndex === 0}
              onClick={() => {
                if (selectedTradeIndex !== null && selectedTradeIndex > 0) {
                  const nextIdx = selectedTradeIndex - 1;
                  setSelectedTradeIndex(nextIdx);
                  const t = closedTrades[nextIdx];
                  if (t) jumpToTimestamp(t.entryTime, 60);
                }
              }}
              className="px-2 py-1 rounded bg-[#141b2c] hover:bg-[#1f2b44] text-gray-300 disabled:opacity-40 text-[10px] flex items-center space-x-1 cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Prev Trade</span>
            </button>

            <span className="text-[10px] text-gray-400">
              {(selectedTradeIndex ?? 0) + 1} of {closedTrades.length}
            </span>

            <button
              disabled={selectedTradeIndex === closedTrades.length - 1}
              onClick={() => {
                if (selectedTradeIndex !== null && selectedTradeIndex < closedTrades.length - 1) {
                  const nextIdx = selectedTradeIndex + 1;
                  setSelectedTradeIndex(nextIdx);
                  const t = closedTrades[nextIdx];
                  if (t) jumpToTimestamp(t.entryTime, 60);
                }
              }}
              className="px-2 py-1 rounded bg-[#141b2c] hover:bg-[#1f2b44] text-gray-300 disabled:opacity-40 text-[10px] flex items-center space-x-1 cursor-pointer"
            >
              <span>Next Trade</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
