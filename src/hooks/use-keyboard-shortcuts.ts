'use client';

import { useEffect } from 'react';
import { useReplayStore } from '@/store/replay-store';
import { useChartStore } from '@/store/chart-store';
import { useUIStore } from '@/store/ui-store';
import { soundEngine } from '@/lib/audio/sound-engine';
import { REPLAY_SPEEDS } from '@/config/constants';
import type { ReplaySpeed } from '@/types/common';

export function useKeyboardShortcuts() {
  const togglePlayPause = useReplayStore((s) => s.togglePlayPause);
  const nextCandle = useReplayStore((s) => s.nextCandle);
  const previousCandle = useReplayStore((s) => s.previousCandle);
  const reset = useReplayStore((s) => s.reset);
  const setSpeed = useReplayStore((s) => s.setSpeed);

  const setActiveTool = useChartStore((s) => s.setActiveTool);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const toggleFullscreen = useUIStore((s) => s.toggleFullscreen);

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

      // Replay Speeds (1 to 7)
      if (['1', '2', '3', '4', '5', '6', '7'].includes(e.key) && !e.metaKey && !e.ctrlKey) {
        const num = parseInt(e.key, 10) - 1;
        if (num >= 0 && num < REPLAY_SPEEDS.length) {
          setSpeed(REPLAY_SPEEDS[num] as ReplaySpeed);
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
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    togglePlayPause,
    nextCandle,
    previousCandle,
    reset,
    setSpeed,
    setActiveTool,
    setCommandPaletteOpen,
    toggleFullscreen,
  ]);
}
