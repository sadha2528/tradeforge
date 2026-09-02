import fs from 'fs';
import path from 'path';
import type { BacktestSession } from '@/types/common';
import type { Trade } from '@/types/trading';
import type { Drawing } from '@/types/chart';
import type { IndicatorConfig } from '@/types/indicator';

export interface FullSessionData {
  session: BacktestSession;
  trades: Trade[];
  drawings: Drawing[];
  indicators: IndicatorConfig[];
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify({}, null, 2), 'utf-8');
  }
}

function readAllSessions(): Record<string, FullSessionData> {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeAllSessions(data: Record<string, FullSessionData>): void {
  ensureDataDir();
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export const cloudStorage = {
  listSessions(): FullSessionData[] {
    const all = readAllSessions();
    return Object.values(all).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  getSession(id: string): FullSessionData | null {
    const all = readAllSessions();
    return all[id] || null;
  },

  saveSession(
    session: BacktestSession,
    trades: Trade[] = [],
    drawings: Drawing[] = [],
    indicators: IndicatorConfig[] = []
  ): FullSessionData {
    const all = readAllSessions();
    const fullData: FullSessionData = {
      session: {
        ...session,
        updatedAt: Date.now(),
      },
      trades,
      drawings,
      indicators,
      updatedAt: new Date().toISOString(),
    };
    all[session.id] = fullData;
    writeAllSessions(all);
    return fullData;
  },

  deleteSession(id: string): boolean {
    const all = readAllSessions();
    if (all[id]) {
      delete all[id];
      writeAllSessions(all);
      return true;
    }
    return false;
  },

  syncSessionDelta(
    sessionId: string,
    newTrades?: Trade[],
    newDrawings?: Drawing[]
  ): FullSessionData | null {
    const all = readAllSessions();
    const existing = all[sessionId];
    if (!existing) return null;

    if (newTrades) {
      existing.trades = newTrades;
    }
    if (newDrawings) {
      existing.drawings = newDrawings;
    }
    existing.updatedAt = new Date().toISOString();
    existing.session.updatedAt = Date.now();

    all[sessionId] = existing;
    writeAllSessions(all);
    return existing;
  },
};
