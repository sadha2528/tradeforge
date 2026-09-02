'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useChartStore } from '@/store/chart-store';
import { useTradingStore } from '@/store/trading-store';
import { useReplayStore } from '@/store/replay-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import { ChartManager } from '@/lib/chart/chart-manager';
import type { Drawing, DrawingTool, DrawingPoint } from '@/types/chart';
import type { Symbol } from '@/types/market-data';

interface DrawingCanvasProps {
  chartManager: ChartManager | null;
  width: number;
  height: number;
}

type DragHandle = 'entry' | 'target' | 'stop' | 'p1' | 'p2' | null;

export function DrawingCanvas({ chartManager, width, height }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activePoints, setActivePoints] = useState<DrawingPoint[]>([]);
  const [hoverPoint, setHoverPoint] = useState<DrawingPoint | null>(null);
  const [draggingDrawingId, setDraggingDrawingId] = useState<string | null>(null);
  const [draggingHandle, setDraggingHandle] = useState<DragHandle>(null);
  const [symbolObj, setSymbolObj] = useState<Symbol | null>(null);

  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const activeTool = useChartStore((s) => s.activeTool);
  const setActiveTool = useChartStore((s) => s.setActiveTool);
  const drawings = useChartStore((s) => s.drawings);
  const addDrawing = useChartStore((s) => s.addDrawing);
  const updateDrawing = useChartStore((s) => s.updateDrawing);
  const deleteDrawing = useChartStore((s) => s.deleteDrawing);
  const selectedDrawingId = useChartStore((s) => s.selectedDrawingId);
  const setSelectedDrawingId = useChartStore((s) => s.setSelectedDrawingId);

  const positions = useTradingStore((s) => s.positions);
  const updateStopLossTakeProfit = useTradingStore((s) => s.updateStopLossTakeProfit);

  useEffect(() => {
    marketDataService.getSymbol(activeSymbol).then(setSymbolObj);
  }, [activeSymbol]);

  // Convert pixel (x, y) on canvas to (timestamp, price) using ChartManager
  const getCoordinatesFromPixel = useCallback(
    (x: number, y: number): DrawingPoint | null => {
      if (!chartManager) return null;
      const price = chartManager.coordinateToPrice(y);
      const time = chartManager.coordinateToTime(x);
      if (price === null || time === null) return null;
      return { time, price };
    },
    [chartManager]
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

  // Main canvas render loop
  const renderDrawings = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !chartManager) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Active Open Positions SL / TP Lines & Live Floating P&L Badges
    positions.forEach((pos) => {
      if (pos.symbol !== activeSymbol) return;

      const entryY = chartManager.priceToCoordinate(pos.entryPrice);
      if (entryY !== null) {
        // Entry Price Line
        ctx.strokeStyle = pos.side === 'long' ? '#3b82f6' : '#ec4899';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, entryY);
        ctx.lineTo(width, entryY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Entry Badge
        ctx.fillStyle = pos.side === 'long' ? '#3b82f6' : '#ec4899';
        ctx.fillRect(width - 95, entryY - 9, 90, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.fillText(`${pos.side.toUpperCase()} ${pos.quantity} @ ${pos.entryPrice.toFixed(2)}`, width - 90, entryY + 4);
      }

      // Stop Loss Line
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

          ctx.fillStyle = '#ef4444';
          ctx.fillRect(width - 80, slY - 9, 75, 18);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px JetBrains Mono';
          ctx.fillText(`SL: ${pos.stopLoss.toFixed(2)}`, width - 75, slY + 4);
        }
      }

      // Take Profit Line
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

          ctx.fillStyle = '#22c55e';
          ctx.fillRect(width - 80, tpY - 9, 75, 18);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px JetBrains Mono';
          ctx.fillText(`TP: ${pos.takeProfit.toFixed(2)}`, width - 75, tpY + 4);
        }
      }
    });

    // 2. Draw Committed Drawings
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

          if (isSelected) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(p1.x - 3, p1.y - 3, 6, 6);
            ctx.fillRect(p2.x - 3, p2.y - 3, 6, 6);
          }
        }
      }
      // Ray Line
      else if (d.type === 'ray' && d.points.length >= 2) {
        const p1 = getPixelFromCoordinates(d.points[0]);
        const p2 = getPixelFromCoordinates(d.points[1]);
        if (p1 && p2) {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const extX = p1.x + (dx !== 0 ? (width * 2) * Math.sign(dx) : 0);
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
      // Long Position Tool (TradingView Style)
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
      // Short Position Tool (TradingView Style)
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

    // 3. Draw in-progress preview
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
        }
      }
      ctx.setLineDash([]);
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
    width,
    height,
    symbolObj,
    getPixelFromCoordinates,
  ]);

  // Handle Canvas Mouse Clicks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeTool || activeTool === 'crosshair') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pt = getCoordinatesFromPixel(x, y);
    if (!pt) return;

    if (activeTool === 'delete') {
      // Find closest drawing to click
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
      // 2-point tools (trendline, ray, rectangle, measure, arrow)
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

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      className={`absolute inset-0 z-10 ${
        activeTool ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
      }`}
    />
  );
}
