'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useSessionStore } from '@/store/session-store';
import { useTradingStore } from '@/store/trading-store';
import { useChartStore } from '@/store/chart-store';
import { useReplayStore } from '@/store/replay-store';
import { useIndicatorStore } from '@/store/indicator-store';
import { syncService } from '@/lib/sync/sync-service';
import { formatCurrency } from '@/lib/utils/formatting';
import {
  FolderKanban,
  Plus,
  Play,
  Copy,
  Trash2,
  Cloud,
  CloudUpload,
  Download,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Timeframe } from '@/types/market-data';

interface SessionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SessionManagerModal({ isOpen, onClose }: SessionManagerModalProps) {
  const currentSession = useSessionStore((s) => s.currentSession);
  const sessions = useSessionStore((s) => s.sessions);
  const createSession = useSessionStore((s) => s.createSession);
  const deleteSession = useSessionStore((s) => s.deleteSession);
  const duplicateSession = useSessionStore((s) => s.duplicateSession);
  const setCurrentSession = useSessionStore((s) => s.setCurrentSession);
  const saveCurrentSessionSnapshot = useSessionStore((s) => s.saveCurrentSessionSnapshot);

  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const activeTimeframe = useChartStore((s) => s.activeTimeframe);
  const drawings = useChartStore((s) => s.drawings);
  const activeIndicators = useIndicatorStore((s) => s.activeIndicators);

  const closedTrades = useTradingStore((s) => s.closedTrades);
  const resetAccount = useTradingStore((s) => s.resetAccount);

  const currentIndex = useReplayStore((s) => s.currentIndex);
  const allCandles = useReplayStore((s) => s.allCandles);
  const preloadCount = useReplayStore((s) => s.preloadCount);

  const [isCreating, setIsCreating] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [strategyName, setStrategyName] = useState('');
  const [startingBalance, setStartingBalance] = useState(100000);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentCandle = allCandles[preloadCount + currentIndex];
  const currentTs = currentCandle ? currentCandle.timestamp : Date.now();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    resetAccount();
    createSession({
      name: newSessionName.trim(),
      strategyName: strategyName.trim() || null,
      symbol: activeSymbol,
      timeframe: activeTimeframe as Timeframe,
      startingBalance,
      riskPerTrade: 1,
      startDate: Date.now() - 30 * 86400000,
      endDate: Date.now(),
      currentTimestamp: currentTs,
      currentIndex: 0,
      preloadCount: 60,
    });

    setIsCreating(false);
    setNewSessionName('');
    setStrategyName('');
    onClose();
  };

  const handleCloudSave = async () => {
    if (!currentSession) return;
    setSyncStatus('Saving to cloud...');
    saveCurrentSessionSnapshot(currentTs, currentIndex);

    const res = await syncService.saveToCloud(
      currentSession,
      closedTrades,
      drawings,
      activeIndicators
    );

    if (res.success) {
      setSyncStatus('Saved to Cloud Database!');
      setTimeout(() => setSyncStatus(null), 3000);
    } else {
      setSyncStatus('Saved Locally (Offline Mode)');
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  const handleExportArchive = () => {
    if (!currentSession) return;
    syncService.exportArchive(currentSession, closedTrades, drawings, activeIndicators);
  };

  const handleImportArchive = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const backup = await syncService.parseArchiveFile(file);
      createSession(backup.session);
      setSyncStatus('Session Archive Imported!');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err) {
      console.error('Failed to import session archive:', err);
      alert('Failed to parse session archive. Invalid format.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-[#0a0e17] border-[#1a2336] text-gray-200 p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-4 border-b border-[#1a2336] bg-[#0d121f]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <FolderKanban className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white tracking-tight">
                  Backtest Sessions &amp; Cloud Sync
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-400">
                  Manage persistent backtest workspaces, strategies, and cloud backups.
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {syncStatus && (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{syncStatus}</span>
                </span>
              )}
              {currentSession && (
                <button
                  onClick={handleCloudSave}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>Save Cloud (Cmd+S)</span>
                </button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {/* Create Session Form */}
          {isCreating ? (
            <form onSubmit={handleCreate} className="p-4 bg-[#0d121f] border border-[#1f2a40] rounded-xl space-y-3 font-mono text-xs">
              <div className="font-bold text-white text-xs uppercase tracking-wider mb-2">
                New Backtest Session
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Session Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ES ICT London Silver Bullet Oct 2024"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  className="w-full bg-[#121828] border border-[#1e273e] rounded-lg px-3 py-1.5 text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Strategy Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ICT 2022 Model"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    className="w-full bg-[#121828] border border-[#1e273e] rounded-lg px-3 py-1.5 text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Starting Balance ($)</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(parseFloat(e.target.value) || 100000)}
                    className="w-full bg-[#121828] border border-[#1e273e] rounded-lg px-3 py-1.5 text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#1f2a40] text-gray-400 hover:text-white hover:bg-[#141b2c] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
                >
                  Create &amp; Launch Session
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-between items-center">
              <button
                onClick={() => setIsCreating(true)}
                className="px-3 py-1.5 bg-[#121828] hover:bg-[#192238] border border-[#1f2a40] text-blue-400 hover:text-blue-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition font-mono"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Session</span>
              </button>

              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportArchive}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-[#121828] hover:bg-[#192238] border border-[#1f2a40] text-gray-300 hover:text-white rounded-lg text-xs font-mono flex items-center space-x-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Import Archive</span>
                </button>
                {currentSession && (
                  <button
                    onClick={handleExportArchive}
                    className="px-2.5 py-1.5 bg-[#121828] hover:bg-[#192238] border border-[#1f2a40] text-gray-300 hover:text-white rounded-lg text-xs font-mono flex items-center space-x-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export Archive</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Sessions List */}
          <div className="space-y-2">
            {sessions.map((sess) => {
              const isCurrent = currentSession?.id === sess.id;
              return (
                <div
                  key={sess.id}
                  className={cn(
                    'p-3 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-2',
                    isCurrent
                      ? 'bg-blue-600/10 border-blue-500/40 shadow-xs'
                      : 'bg-[#0d121f] border-[#182338] hover:border-[#23314c]'
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-white font-mono">{sess.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded font-bold">
                          ACTIVE
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-gray-400 flex items-center space-x-1">
                        <Cloud className="w-3 h-3 text-cyan-400" />
                        <span>Cloud Ready</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] font-mono text-gray-400">
                      <span>{sess.symbol} ({sess.timeframe})</span>
                      <span>{sess.strategyName || 'Discretionary'}</span>
                      <span>Balance: <strong className="text-white">{formatCurrency(sess.startingBalance)}</strong></span>
                      <span>Updated: {new Date(sess.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 self-end md:self-auto">
                    {!isCurrent && (
                      <button
                        onClick={() => {
                          setCurrentSession(sess);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                      >
                        <Play className="w-3 h-3" />
                        <span>Resume</span>
                      </button>
                    )}
                    <button
                      onClick={() => duplicateSession(sess.id)}
                      title="Duplicate Session"
                      className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#151c2d] transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        deleteSession(sess.id);
                        syncService.deleteFromCloud(sess.id);
                      }}
                      title="Delete Session"
                      className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
