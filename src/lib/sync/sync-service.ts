import type { BacktestSession } from '@/types/common';
import type { Trade } from '@/types/trading';
import type { Drawing } from '@/types/chart';
import type { IndicatorConfig } from '@/types/indicator';

export interface FullSessionBackup {
  version: '1.0';
  exportedAt: string;
  session: BacktestSession;
  trades: Trade[];
  drawings: Drawing[];
  indicators: IndicatorConfig[];
}

export const syncService = {
  /**
   * Pushes full session snapshot to the server /api/sessions
   */
  async saveToCloud(
    session: BacktestSession,
    trades: Trade[] = [],
    drawings: Drawing[] = [],
    indicators: IndicatorConfig[] = []
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, trades, drawings, indicators }),
      });
      const data = await res.json();
      return { success: data.success, error: data.error };
    } catch (err) {
      console.warn('Cloud sync offline / failed, cached in localStorage:', err);
      return { success: false, error: 'Network error or offline mode' };
    }
  },

  /**
   * Retrieves all cloud-persisted sessions
   */
  async listCloudSessions(): Promise<FullSessionBackup[]> {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      return data.success ? data.sessions : [];
    } catch {
      return [];
    }
  },

  /**
   * Retrieves a full session by ID
   */
  async getCloudSession(id: string): Promise<FullSessionBackup | null> {
    try {
      const res = await fetch(`/api/sessions/${id}`);
      const data = await res.json();
      return data.success ? data.sessionData : null;
    } catch {
      return null;
    }
  },

  /**
   * Deletes a session from the cloud database
   */
  async deleteFromCloud(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success;
    } catch {
      return false;
    }
  },

  /**
   * Exports a portable JSON backup archive file
   */
  exportArchive(
    session: BacktestSession,
    trades: Trade[] = [],
    drawings: Drawing[] = [],
    indicators: IndicatorConfig[] = []
  ): void {
    const backup: FullSessionBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      session,
      trades,
      drawings,
      indicators,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.name.toLowerCase().replace(/\s+/g, '-')}-backup.tradeforge.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Parses and validates an uploaded .tradeforge.json file
   */
  async parseArchiveFile(file: File): Promise<FullSessionBackup> {
    const text = await file.text();
    const parsed = JSON.parse(text) as FullSessionBackup;

    if (!parsed.session || !parsed.session.id || !parsed.session.name) {
      throw new Error('Invalid TradeForge session archive format.');
    }
    return parsed;
  },
};
