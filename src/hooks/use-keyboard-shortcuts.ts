'use client';

import { useEffect } from 'react';
import { useReplayStore } from '@/store/replay-store';
import { useChartStore } from '@/store/chart-store';
import { useUIStore } from '@/store/ui-store';
import { useTradingStore } from '@/store/trading-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import { soundEngine } from '@/lib/audio/sound-engine';
import { REPLAY_SPEEDS } from '@/config/constants';
import type { ReplaySpeed } from '@/types/common';

export function useKeyboardShortcuts() {
  const togglePlayPause = useReplayStore((s) => s.togglePlayPause);
  const nextCandle = useReplayStore((s) => s.nextCandle);
  const previousCandle = useReplayStore((s) => s.previousCandle);
  const reset = useReplayStore((s) => s.reset);
  const setSpeed = useReplayStore((s) => s.setSpeed);
  const allCandles = useReplayStore((s) => s.allCandles);
  const currentIndex = useReplayStore((s) => s.currentIndex);
  const preloadCount = useReplayStore((s) => s.preloadCount);

  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const setActiveTool = useChartStore((s) => s.setActiveTool);
  const selectedDrawingId = useChartStore((s) => s.selectedDrawingId);
  const setSelectedDrawingId = useChartStore((s) => s.setSelectedDrawingId);
  const deleteDrawing = useChartStore((s) => s.deleteDrawing);

  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setJumpToDateModalOpen = useUIStore((s) => s.setJumpToDateModalOpen);
  const toggleFullscreen = useUIStore((s) => s.toggleFullscreen);

  const positions = useTradingStore((s) => s.positions);
  const placeMarketOrder = useTradingStore((s) => s.placeMarketOrder);
  const closePosition = useTradingStore((s) => s.closePosition);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Global Command Palette Shortcut: Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Ignore standard hotkeys when typing in form inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Go To Date/Time Modal Shortcut: G
      if ((e.key === 'g' || e.key === 'G') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setJumpToDateModalOpen(true);
        return;
      }

      // Replay Navigation
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        soundEngine.playStep();
        if (e.shiftKey) {
          // Advance 5 candles
          for (let i = 0; i < 5; i++) nextCandle();
        } else {
          nextCandle();
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        previousCandle();
      } else if (e.key === 'r' || e.key === 'R') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          reset();
        }
      }

      // Fullscreen shortcut
      if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggleFullscreen();
      }

      // Replay Speeds (1 to 9)
      if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key) && !e.metaKey && !e.ctrlKey) {
        const num = parseInt(e.key, 10) - 1;
        if (num >= 0 && num < REPLAY_SPEEDS.length) {
          setSpeed(REPLAY_SPEEDS[num] as ReplaySpeed);
        }
      }

      // Hotkey B: Buy Market 1 Contract
      if ((e.key === 'b' || e.key === 'B') && !e.metaKey && !e.ctrlKey) {
        const currentCandle = allCandles[preloadCount + currentIndex];
        if (currentCandle) {
          marketDataService.getSymbol(activeSymbol).then((sym) => {
            placeMarketOrder({
              symbol: sym,
              side: 'long',
              quantity: sym.minQuantity || 1,
              currentPrice: currentCandle.close,
              timestamp: currentCandle.timestamp,
              stopLoss: currentCandle.close - sym.tickSize * 20,
              takeProfit: currentCandle.close + sym.tickSize * 40,
            });
          });
        }
      }

      // Hotkey S: Sell Market 1 Contract
      if ((e.key === 's' || e.key === 'S') && !e.metaKey && !e.ctrlKey) {
        const currentCandle = allCandles[preloadCount + currentIndex];
        if (currentCandle) {
          marketDataService.getSymbol(activeSymbol).then((sym) => {
            placeMarketOrder({
              symbol: sym,
              side: 'short',
              quantity: sym.minQuantity || 1,
              currentPrice: currentCandle.close,
              timestamp: currentCandle.timestamp,
              stopLoss: currentCandle.close + sym.tickSize * 20,
              takeProfit: currentCandle.close - sym.tickSize * 40,
            });
          });
        }
      }

      // Hotkey C: Close Active Position
      if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey) {
        const activePos = positions.find((p) => p.symbol === activeSymbol) || positions[0];
        const currentCandle = allCandles[preloadCount + currentIndex];
        if (activePos && currentCandle) {
          marketDataService.getSymbol(activePos.symbol).then((sym) => {
            closePosition(activePos.id, currentCandle.close, currentCandle.timestamp, sym);
          });
        }
      }

      // Drawing Tools
      if (e.key === 't' || e.key === 'T') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setActiveTool('trendline');
        }
      } else if (e.key === 'h' || e.key === 'H') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setActiveTool('horizontal-line');
        }
      } else if (e.key === 'm' || e.key === 'M') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setActiveTool('measure');
        }
      } else if (e.key === 'p' || e.key === 'P') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setActiveTool('long-position');
        }
      } else if (e.code === 'Escape') {
        setActiveTool(null);
      }

      // Delete / Backspace: delete selected drawing
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.metaKey && !e.ctrlKey) {
        if (selectedDrawingId) {
          e.preventDefault();
          deleteDrawing(selectedDrawingId);
          setSelectedDrawingId(null);
          soundEngine.playStep();
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    togglePlayPause,
    nextCandle,
    previousCandle,
    reset,
    setSpeed,
    allCandles,
    currentIndex,
    preloadCount,
    activeSymbol,
    positions,
    placeMarketOrder,
    closePosition,
    setActiveTool,
    selectedDrawingId,
    setSelectedDrawingId,
    deleteDrawing,
    setCommandPaletteOpen,
    setJumpToDateModalOpen,
    toggleFullscreen,
  ]);
}
