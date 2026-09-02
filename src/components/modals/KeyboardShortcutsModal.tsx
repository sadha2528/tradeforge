'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Keyboard, Command, Play, Briefcase, PenTool, Sparkles } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcuts: ShortcutItem[];
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: 'Market Replay Controls',
    icon: Play,
    shortcuts: [
      { keys: ['Space'], description: 'Play / Pause market replay' },
      { keys: ['→'], description: 'Step forward 1 candle' },
      { keys: ['←'], description: 'Step backward 1 candle' },
      { keys: ['R'], description: 'Restart replay to beginning' },
      { keys: ['J'], description: 'Jump to historical date & time' },
      { keys: ['1', '–', '7'], description: 'Set replay speed (1x to 100x)' },
    ],
  },
  {
    title: 'Order Execution & Trading',
    icon: Briefcase,
    shortcuts: [
      { keys: ['B'], description: 'Place simulated Market BUY order' },
      { keys: ['S'], description: 'Place simulated Market SELL order' },
      { keys: ['C'], description: 'Close active open position at market' },
      { keys: ['X'], description: 'Cancel all pending limit/stop orders' },
    ],
  },
  {
    title: 'Drawing & Analysis Tools',
    icon: PenTool,
    shortcuts: [
      { keys: ['T'], description: 'Select Trendline drawing tool' },
      { keys: ['H'], description: 'Select Horizontal Line tool' },
      { keys: ['M'], description: 'Select Measure Ruler tool' },
      { keys: ['Esc'], description: 'Deselect active tool (Crosshair mode)' },
    ],
  },
  {
    title: 'Workspace & System',
    icon: Command,
    shortcuts: [
      { keys: ['Cmd', 'S'], description: 'Save snapshot & Sync session to Cloud' },
      { keys: ['I'], description: 'Open Technical Indicators catalog' },
      { keys: ['?'], description: 'Open Keyboard Shortcuts cheat sheet' },
    ],
  },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-[#0a0e17] border-[#1a2336] text-gray-200 p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-4 border-b border-[#1a2336] bg-[#0d121f]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white tracking-tight">
                Keyboard Shortcuts Cheat Sheet
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400">
                Master terminal navigation with pro hotkeys for replay, execution, and charting.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto font-mono text-xs">
          {SHORTCUT_CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="bg-[#0d121f] border border-[#1b253c] rounded-xl p-3 space-y-2.5"
              >
                <div className="flex items-center space-x-2 text-white font-bold text-xs border-b border-[#162035] pb-1.5">
                  <Icon className="w-3.5 h-3.5 text-blue-400" />
                  <span>{cat.title}</span>
                </div>

                <div className="space-y-1.5">
                  {cat.shortcuts.map((sc, sIdx) => (
                    <div key={sIdx} className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-400">{sc.description}</span>
                      <div className="flex items-center space-x-1">
                        {sc.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="bg-[#151d2f] border border-[#232f48] text-gray-200 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
