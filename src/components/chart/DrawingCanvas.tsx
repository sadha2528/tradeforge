'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useChartStore } from '@/store/chart-store';
import { useTradingStore } from '@/store/trading-store';
import { useReplayStore } from '@/store/replay-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import { ChartManager } from '@/lib/chart/chart-manager';
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
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
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

    // 1. Draw Active Open Positions SL / TP Lines & Draggable Handles
    positions.forEach((pos) => {
      if (pos.symbol !== activeSymbol) return;

      const entryY = chartManager.priceToCoordinate(pos.entryPrice);
      if (entryY !== null) {
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
        ctx.fillStyle = pos.side === 'long' ? '#3b82f6' : '#ec4899';
        ctx.fillRect(width - 100, entryY - 9, 95, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.fillText(
          `${pos.side.toUpperCase()} ${pos.quantity} @ ${pos.entryPrice.toFixed(symbolObj?.pricePrecision || 2)}`,
          width - 95,
          entryY + 4
        );
      }

      // Stop Loss Line & Draggable Handle
      if (pos.stopLoss) {
        const slY = chartManager.priceToCoordinate(pos.stopLoss);
        if (slY !== null) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 2]);
          ctx.beginPath();
          ctx.moveTo(0, slY);
          ctx.lineTo(width, slY);
          ctx.stroke();
          ctx.setLineDash([]);

          // SL Price Badge & Drag Handle
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(width - 85, slY - 9, 80, 18);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px JetBrains Mono';
          ctx.fillText(`SL: ${pos.stopLoss.toFixed(2)}`, width - 80, slY + 4);

          // Drag Handle Dot
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(width - 95, slY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Take Profit Line & Draggable Handle
      if (pos.takeProfit) {
        const tpY = chartManager.priceToCoordinate(pos.takeProfit);
        if (tpY !== null) {
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 2]);
          ctx.beginPath();
          ctx.moveTo(0, tpY);
          ctx.lineTo(width, tpY);
          ctx.stroke();
          ctx.setLineDash([]);

          // TP Price Badge & Drag Handle
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(width - 85, tpY - 9, 80, 18);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px JetBrains Mono';
          ctx.fillText(`TP: ${pos.takeProfit.toFixed(2)}`, width - 80, tpY + 4);

          // Drag Handle Dot
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(width - 95, tpY, 4, 0, Math.PI * 2);
          ctx.fill();
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
    getPixelFromCoordinates,
  ]);

  // Handle Canvas Mouse Clicks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
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

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pt = getCoordinatesFromPixel(x, y);
    if (pt) setHoverPoint(pt);
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
        onMouseMove={handleMouseMove}
        className={`absolute inset-0 z-10 ${
          activeTool ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-auto cursor-default'
        }`}
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
