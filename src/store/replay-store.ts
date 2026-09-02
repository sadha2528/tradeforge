import { create } from 'zustand';
import type { OHLCV } from '@/types/market-data';
import type { ReplayState, ReplaySpeed } from '@/types/common';

interface ReplayStore {
  // State
  state: ReplayState;
  speed: ReplaySpeed;
  currentIndex: number;
  allCandles: OHLCV[];
  preloadCount: number;

  // Actions
  loadCandles: (candles: OHLCV[], preloadCount?: number) => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  nextCandle: () => void;
  previousCandle: () => void;
  setSpeed: (speed: ReplaySpeed) => void;
  reset: () => void;
  restartReplay: () => void;
  jumpTo: (index: number) => void;
  jumpToTimestamp: (timestamp: number, contextBars?: number) => boolean;
}

export const useReplayStore = create<ReplayStore>((set, get) => ({
  state: 'idle',
  speed: 1,
  currentIndex: 0,
  allCandles: [],
  preloadCount: 100,

  loadCandles: (candles, preloadCount = 100) => {
    const safePreload = Math.min(preloadCount, Math.max(10, Math.floor(candles.length * 0.3)));
    set({
      allCandles: candles,
      preloadCount: safePreload,
      currentIndex: 0,
      state: 'idle',
    });
  },

  play: () => set({ state: 'playing' }),

  pause: () => set({ state: 'paused' }),

  togglePlayPause: () =>
    set((state) => ({
      state: state.state === 'playing' ? 'paused' : 'playing',
    })),

  nextCandle: () =>
    set((state) => {
      const replayableCount = Math.max(0, state.allCandles.length - state.preloadCount - 1);
      if (state.currentIndex >= replayableCount) {
        return { currentIndex: replayableCount, state: 'finished' };
      }
      return { currentIndex: state.currentIndex + 1 };
    }),

  previousCandle: () =>
    set((state) => ({
      currentIndex: Math.max(0, state.currentIndex - 1),
      state: state.state === 'finished' ? 'paused' : state.state,
    })),

  setSpeed: (speed) => set({ speed }),

  reset: () => set({ currentIndex: 0, state: 'idle' }),

  restartReplay: () => set({ currentIndex: 0, state: 'idle' }),

  jumpTo: (index) =>
    set((state) => {
      const replayableCount = Math.max(0, state.allCandles.length - state.preloadCount - 1);
      const boundedIndex = Math.max(0, Math.min(index, replayableCount));
      return {
        currentIndex: boundedIndex,
        state: boundedIndex >= replayableCount ? 'finished' : state.state,
      };
    }),

  jumpToTimestamp: (targetTimestamp, contextBars = 60) => {
    const { allCandles } = get();
    if (allCandles.length === 0) return false;

    // Binary search or find closest candle <= targetTimestamp
    let targetIdx = allCandles.findIndex((c) => c.timestamp >= targetTimestamp);
    if (targetIdx === -1) {
      targetIdx = allCandles.length - 1;
    }

    // Allocate context bars before targetIdx
    const safePreload = Math.max(10, Math.min(contextBars, targetIdx));
    const newCurrentIndex = targetIdx - safePreload;

    set({
      preloadCount: safePreload,
      currentIndex: Math.max(0, newCurrentIndex),
      state: 'paused',
    });

    return true;
  },
}));
