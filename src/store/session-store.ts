import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BacktestSession } from '@/types/common';
import type { Timeframe } from '@/types/market-data';

interface CreateSessionInput {
  name: string;
  strategyName?: string | null;
  symbol: string;
  timeframe: Timeframe;
  startingBalance: number;
  riskPerTrade: number;
  startDate: number;
  endDate: number;
  currentTimestamp: number;
  currentIndex: number;
  preloadCount: number;
  description?: string;
}

interface SessionStore {
  currentSession: BacktestSession | null;
  sessions: BacktestSession[];

  createSession: (input: CreateSessionInput) => BacktestSession;
  updateSession: (id: string, updates: Partial<BacktestSession>) => void;
  deleteSession: (id: string) => void;
  duplicateSession: (id: string) => BacktestSession | null;
  setCurrentSession: (session: BacktestSession | null) => void;
  saveCurrentSessionSnapshot: (currentCandleTimestamp: number, currentIndex: number) => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      currentSession: null,
      sessions: [
        {
          id: 'default-es-session',
          name: 'ES London & NY Open Replay',
          strategyName: 'Opening Range Breakout (ORB)',
          symbol: 'ES',
          timeframe: '5m',
          startingBalance: 100000,
          riskPerTrade: 1,
          currentTimestamp: Date.UTC(2024, 8, 16, 13, 30, 0),
          currentIndex: 40,
          preloadCount: 60,
          startDate: Date.UTC(2024, 8, 16, 0, 0, 0),
          endDate: Date.UTC(2024, 8, 18, 23, 59, 0),
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now() - 86400000,
          description: 'E-mini S&P 500 session testing 5m opening range expansions with $12.50 tick quantization.',
          tradesCount: 4,
          winRate: 75,
        },
      ],

      createSession: (input) => {
        const newSession: BacktestSession = {
          id: crypto.randomUUID(),
          name: input.name,
          strategyName: input.strategyName || null,
          symbol: input.symbol,
          timeframe: input.timeframe,
          startingBalance: input.startingBalance,
          riskPerTrade: input.riskPerTrade,
          startDate: input.startDate,
          endDate: input.endDate,
          currentTimestamp: input.currentTimestamp,
          currentIndex: input.currentIndex,
          preloadCount: input.preloadCount,
          description: input.description,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tradesCount: 0,
        };

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSession: newSession,
        }));

        return newSession;
      },

      updateSession: (id, updates) =>
        set((state) => {
          const updated = state.sessions.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
          );
          const current = state.currentSession?.id === id ? { ...state.currentSession, ...updates, updatedAt: Date.now() } : state.currentSession;
          return { sessions: updated, currentSession: current };
        }),

      deleteSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          currentSession: state.currentSession?.id === id ? null : state.currentSession,
        })),

      duplicateSession: (id) => {
        const { sessions } = get();
        const target = sessions.find((s) => s.id === id);
        if (!target) return null;

        const duplicated: BacktestSession = {
          ...target,
          id: crypto.randomUUID(),
          name: `${target.name} (Copy)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          sessions: [duplicated, ...state.sessions],
        }));

        return duplicated;
      },

      setCurrentSession: (session) => set({ currentSession: session }),

      saveCurrentSessionSnapshot: (currentCandleTimestamp, currentIndex) => {
        const { currentSession, updateSession, createSession } = get();
        if (currentSession) {
          updateSession(currentSession.id, {
            currentTimestamp: currentCandleTimestamp,
            currentIndex,
          });
        }
      },
    }),
    {
      name: 'tradeforge-sessions-v1',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
