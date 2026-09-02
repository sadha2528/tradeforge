'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useUIStore } from '@/store/ui-store';
import { useChartStore } from '@/store/chart-store';
import { useReplayStore } from '@/store/replay-store';
import { useTradingStore } from '@/store/trading-store';
import { useIndicatorStore } from '@/store/indicator-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import { TIMEFRAMES } from '@/config/constants';
import type { Timeframe } from '@/types/market-data';
import type { PanelTab } from '@/types/common';
import {
  Search,
  TrendingUp,
  Clock,
  Layers,
  BarChart2,
  BookOpen,
  Calendar,
  Play,
  Pause,
  ArrowUpCircle,
  ArrowDownCircle,
  Maximize2,
  Bookmark,
  Activity,
  Plus,
  Command,
} from 'lucide-react';

interface CommandItem {
  id: string;
  category: 'Symbols' | 'Timeframes' | 'Replay' | 'Trading' | 'Views' | 'Tools';
  title: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export function CommandPaletteModal() {
  const isOpen = useUIStore((s) => s.isCommandPaletteOpen);
  const setIsOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setBottomPanelTab = useUIStore((s) => s.setBottomPanelTab);
  const toggleFullscreen = useUIStore((s) => s.toggleFullscreen);
  const setChartSettingsOpen = useUIStore((s) => s.setChartSettingsOpen);
  const setObjectTreeOpen = useUIStore((s) => s.setObjectTreeOpen);

  const setActiveSymbol = useChartStore((s) => s.setActiveSymbol);
  const setActiveTimeframe = useChartStore((s) => s.setActiveTimeframe);
  const setActiveTool = useChartStore((s) => s.setActiveTool);

  const togglePlayPause = useReplayStore((s) => s.togglePlayPause);
  const nextCandle = useReplayStore((s) => s.nextCandle);
  const previousCandle = useReplayStore((s) => s.previousCandle);
  const resetReplay = useReplayStore((s) => s.reset);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const allCommands: CommandItem[] = useMemo(
    () => [
      // Symbols
      { id: 'sym-es', category: 'Symbols', title: 'Switch to ES (E-mini S&P 500)', icon: TrendingUp, action: () => setActiveSymbol('ES') },
      { id: 'sym-nq', category: 'Symbols', title: 'Switch to NQ (E-mini Nasdaq 100)', icon: TrendingUp, action: () => setActiveSymbol('NQ') },
      { id: 'sym-mes', category: 'Symbols', title: 'Switch to MES (Micro E-mini S&P 500)', icon: TrendingUp, action: () => setActiveSymbol('MES') },
      { id: 'sym-mnq', category: 'Symbols', title: 'Switch to MNQ (Micro E-mini Nasdaq 100)', icon: TrendingUp, action: () => setActiveSymbol('MNQ') },
      { id: 'sym-gc', category: 'Symbols', title: 'Switch to GC (Gold Futures)', icon: TrendingUp, action: () => setActiveSymbol('GC') },
      { id: 'sym-cl', category: 'Symbols', title: 'Switch to CL (Crude Oil Futures)', icon: TrendingUp, action: () => setActiveSymbol('CL') },
      { id: 'sym-eurusd', category: 'Symbols', title: 'Switch to EUR/USD Forex', icon: TrendingUp, action: () => setActiveSymbol('EURUSD') },
      { id: 'sym-btcusdt', category: 'Symbols', title: 'Switch to BTC/USDT Crypto', icon: TrendingUp, action: () => setActiveSymbol('BTCUSDT') },

      // Timeframes
      ...TIMEFRAMES.map((tf) => ({
        id: `tf-${tf}`,
        category: 'Timeframes' as const,
        title: `Set Timeframe to ${tf}`,
        icon: Clock,
        action: () => setActiveTimeframe(tf as Timeframe),
      })),

      // Replay
      { id: 'rep-toggle', category: 'Replay', title: 'Play / Pause Replay', shortcut: 'Space', icon: Play, action: togglePlayPause },
      { id: 'rep-next', category: 'Replay', title: 'Step Forward 1 Candle', shortcut: '→', icon: Play, action: nextCandle },
      { id: 'rep-prev', category: 'Replay', title: 'Step Backward 1 Candle', shortcut: '←', icon: Play, action: previousCandle },
      { id: 'rep-reset', category: 'Replay', title: 'Restart Replay from Beginning', shortcut: 'R', icon: Play, action: resetReplay },

      // Views
      { id: 'view-positions', category: 'Views', title: 'Open Positions Table', icon: Layers, action: () => setBottomPanelTab('positions') },
      { id: 'view-orders', category: 'Views', title: 'Open Orders Table', icon: Layers, action: () => setBottomPanelTab('orders') },
      { id: 'view-trades', category: 'Views', title: 'Open Trades History Table', icon: Layers, action: () => setBottomPanelTab('trades') },
      { id: 'view-perf', category: 'Views', title: 'Open Performance Analytics & EV', icon: BarChart2, action: () => setBottomPanelTab('statistics') },
      { id: 'view-journal', category: 'Views', title: 'Open Trade Journal', icon: BookOpen, action: () => setBottomPanelTab('journal') },
      { id: 'view-tree', category: 'Views', title: 'Open Object Tree Manager', icon: Activity, action: () => setObjectTreeOpen(true) },
      { id: 'view-settings', category: 'Views', title: 'Open Chart Settings Modal', icon: Activity, action: () => setChartSettingsOpen(true) },
      { id: 'view-full', category: 'Views', title: 'Toggle Fullscreen Chart', shortcut: 'F', icon: Maximize2, action: toggleFullscreen },

      // Tools
      { id: 'tool-trend', category: 'Tools', title: 'Select Trendline Tool', shortcut: 'T', icon: Plus, action: () => setActiveTool('trendline') },
      { id: 'tool-hline', category: 'Tools', title: 'Select Horizontal Line Tool', shortcut: 'H', icon: Plus, action: () => setActiveTool('horizontal-line') },
      { id: 'tool-long', category: 'Tools', title: 'Select Long Position R:R Tool', shortcut: 'P', icon: ArrowUpCircle, action: () => setActiveTool('long-position') },
      { id: 'tool-short', category: 'Tools', title: 'Select Short Position R:R Tool', icon: ArrowDownCircle, action: () => setActiveTool('short-position') },
      { id: 'tool-measure', category: 'Tools', title: 'Select Measure Ruler Tool', shortcut: 'M', icon: Plus, action: () => setActiveTool('measure') },
      { id: 'tool-clear', category: 'Tools', title: 'Deselect Tool / Return to Crosshair', shortcut: 'Esc', icon: Plus, action: () => setActiveTool(null) },
    ],
    [
      setActiveSymbol,
      setActiveTimeframe,
      togglePlayPause,
      nextCandle,
      previousCandle,
      resetReplay,
      setBottomPanelTab,
      toggleFullscreen,
      setChartSettingsOpen,
      setObjectTreeOpen,
      setActiveTool,
    ]
  );

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return allCommands;
    const q = query.toLowerCase();
    return allCommands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.shortcut?.toLowerCase().includes(q)
    );
  }, [allCommands, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev - 1 < 0 ? Math.max(0, filteredCommands.length - 1) : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filteredCommands[selectedIndex];
      if (cmd) {
        cmd.action();
        setIsOpen(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
      <DialogContent className="sm:max-w-xl bg-[#0c111e] border-[#1b253c] text-gray-200 p-0 overflow-hidden shadow-2xl">
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-[#1b253c] bg-[#0e1424]">
          <Search className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search (e.g. 'ES', '15m', 'replay', 'positions')..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent py-3 text-sm text-white focus:outline-hidden font-mono placeholder:text-gray-500"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#162035] border border-[#23314c] text-[10px] font-bold text-gray-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1 font-mono text-xs">
          {filteredCommands.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No matching actions found for &quot;{query}&quot;
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-gray-300 hover:bg-[#121828]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-400'}`} />
                    <span>{cmd.title}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isSelected
                          ? 'bg-blue-700 text-blue-100'
                          : 'bg-[#151c2d] text-gray-400 border border-[#1e283d]'
                      }`}
                    >
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <kbd
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold font-mono ${
                          isSelected
                            ? 'bg-blue-800 text-white'
                            : 'bg-[#192236] text-gray-300 border border-[#232f48]'
                        }`}
                      >
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-[#1b253c] bg-[#090d17] flex items-center justify-between text-[10px] font-mono text-gray-500 px-3">
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <div className="flex items-center space-x-1">
            <Command className="w-3 h-3" />
            <span>K Palette</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
