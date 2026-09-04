'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  SkipBack,
  Play,
  Pause,
  SkipForward,
  FastForward,
  RotateCcw,
  Calendar,
  ChevronDown,
  ChevronUp,
  BarChart2,
  BookOpen,
  Layers,
  Briefcase,
  ListOrdered,
} from 'lucide-react';
import { useReplayStore } from '@/store/replay-store';
import { useUIStore } from '@/store/ui-store';
import { JumpToDateModal } from '@/components/modals/JumpToDateModal';
import { REPLAY_SPEEDS } from '@/config/constants';
import { cn } from '@/lib/utils';
import type { ReplaySpeed } from '@/types/common';
import type { PanelTab } from '@/types/common';

const PANEL_TABS: { id: PanelTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'positions', label: 'Positions', icon: Briefcase },
  { id: 'orders', label: 'Orders', icon: ListOrdered },
  { id: 'trades', label: 'Trade History', icon: Layers },
  { id: 'statistics', label: 'Analytics', icon: BarChart2 },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'economic', label: 'Economic', icon: Calendar },
];

export function ReplayBar() {
  const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const scrubberRef = useRef<HTMLDivElement>(null);

  const {
    state,
    speed,
    currentIndex,
    preloadCount,
    allCandles,
    togglePlayPause,
    nextCandle,
    previousCandle,
    restartReplay,
    setSpeed,
  } = useReplayStore();

  const showBottomPanel = useUIStore((s) => s.showBottomPanel);
  const toggleBottomPanel = useUIStore((s) => s.toggleBottomPanel);
  const bottomPanelTab = useUIStore((s) => s.bottomPanelTab);
  const setBottomPanelTab = useUIStore((s) => s.setBottomPanelTab);

  const isPlaying = state === 'playing';
  const totalCandles = allCandles.length;
  const replayableCount = Math.max(1, totalCandles - preloadCount - 1);
  const progressPercent = Math.min(100, Math.round((currentIndex / replayableCount) * 100));

  const currentCandle = allCandles[preloadCount + currentIndex];
  const dateObj = currentCandle ? new Date(currentCandle.timestamp) : new Date();

  const formattedET = currentCandle
    ? dateObj.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).toUpperCase() + ' ET'
    : 'WAITING FOR DATA...';

  const handleSpeedSelect = (s: number) => {
    setSpeed(s as ReplaySpeed);
    setShowSpeedMenu(false);
  };

  const handleFastForward5 = () => {
    for (let i = 0; i < 5; i++) nextCandle();
  };

  // Scrubber click to jump
  const handleScrubberClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const targetIndex = Math.round(pct * replayableCount);
    useReplayStore.getState().jumpTo?.(targetIndex);
  }, [replayableCount]);

  return (
    <>
      <div className="h-full w-full bg-[#0b0e17] border-t border-[#1e2333] flex items-center select-none shrink-0">

        {/* ── LEFT: PANEL TAB TRIGGERS ── */}
        <div className="flex items-center h-full border-r border-[#1e2333] shrink-0">
          {PANEL_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = showBottomPanel && bottomPanelTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (isActive) {
                    toggleBottomPanel();
                  } else {
                    setBottomPanelTab(tab.id);
                    if (!showBottomPanel) toggleBottomPanel();
                  }
                }}
                title={tab.label}
                className={cn(
                  'flex items-center gap-1.5 h-full px-3 text-[11px] font-mono font-semibold border-b-2 transition cursor-pointer',
                  isActive
                    ? 'text-blue-400 border-blue-500 bg-blue-500/5'
                    : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-[#111520]'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{tab.label}</span>
              </button>
            );
          })}
          <button
            onClick={toggleBottomPanel}
            className="h-full px-2 text-gray-600 hover:text-gray-300 border-b-2 border-transparent transition cursor-pointer"
            title={showBottomPanel ? 'Collapse Panel' : 'Expand Panel'}
          >
            {showBottomPanel ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* ── CENTER: REPLAY TRANSPORT ── */}
        <div className="flex items-center gap-1.5 px-3 h-full flex-1 justify-center">

          {/* Status badge */}
          <div className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0',
            isPlaying
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : state === 'paused'
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          )}>
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              isPlaying ? 'bg-amber-400 animate-pulse' : state === 'paused' ? 'bg-blue-400' : 'bg-emerald-400'
            )} />
            {isPlaying ? 'LIVE' : state === 'paused' ? 'PAUSED' : 'READY'}
          </div>

          {/* Restart */}
          <button
            onClick={restartReplay}
            title="Restart to Beginning"
            className="h-7 w-7 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-[#161c2b] transition cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Previous Candle */}
          <button
            onClick={previousCandle}
            title="Previous Candle (←)"
            className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-[#161c2b] transition cursor-pointer shrink-0"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Play / Pause — main button */}
          <button
            onClick={togglePlayPause}
            title="Play / Pause (Space)"
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded-full text-white transition shadow-md cursor-pointer shrink-0',
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/30'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30'
            )}
          >
            {isPlaying
              ? <Pause className="w-4 h-4 fill-current" />
              : <Play className="w-4 h-4 fill-current ml-0.5" />
            }
          </button>

          {/* Next Candle */}
          <button
            onClick={nextCandle}
            title="Next Candle (→)"
            className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-[#161c2b] transition cursor-pointer shrink-0"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Fast Forward +5 */}
          <button
            onClick={handleFastForward5}
            title="Fast Forward 5 Candles (Shift+→)"
            className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-[#161c2b] transition cursor-pointer shrink-0"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-5 bg-[#252d40] shrink-0" />

          {/* ── PROGRESS SCRUBBER ── */}
          <div
            ref={scrubberRef}
            onClick={handleScrubberClick}
            title="Click to jump to position in replay"
            className="flex-1 min-w-[80px] max-w-[280px] h-2 bg-[#1a2236] rounded-full cursor-pointer relative overflow-hidden group hidden sm:block"
          >
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Scrubber thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md group-hover:scale-125 transition-transform"
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
          </div>

          <span className="text-[11px] font-mono text-gray-400 shrink-0 hidden sm:inline min-w-[32px] text-right">
            {progressPercent}%
          </span>

          <div className="w-px h-5 bg-[#252d40] shrink-0" />

          {/* ── SPEED SELECTOR ── */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              title="Playback Speed"
              className="flex items-center gap-1 h-7 px-2 rounded bg-[#161c2b] hover:bg-[#1c253c] border border-[#252d42] text-blue-400 text-[11px] font-mono font-bold transition cursor-pointer"
            >
              {speed}x
              <ChevronDown className="w-3 h-3" />
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full mb-1 left-0 bg-[#111827] border border-[#252d42] rounded-lg shadow-xl z-50 overflow-hidden">
                {REPLAY_SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSpeedSelect(s)}
                    className={cn(
                      'block w-full text-left px-3 py-1.5 text-[11px] font-mono hover:bg-[#1c253c] transition cursor-pointer',
                      speed === s ? 'text-blue-400 font-bold' : 'text-gray-400'
                    )}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: TIMESTAMP + GO TO ── */}
        <div className="flex items-center gap-2 px-3 h-full border-l border-[#1e2333] shrink-0">
          <div className="text-[11px] font-mono text-gray-300 hidden md:block font-semibold whitespace-nowrap">
            {formattedET}
          </div>
          <button
            onClick={() => setIsJumpModalOpen(true)}
            title="Go To Date / Time (G)"
            className="flex items-center gap-1.5 h-7 px-2.5 bg-[#161c2b] hover:bg-[#1c253c] border border-[#252d42] hover:border-blue-500/40 rounded-lg text-gray-400 hover:text-blue-400 text-[11px] font-mono transition cursor-pointer shrink-0"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Go To</span>
          </button>
        </div>
      </div>

      <JumpToDateModal isOpen={isJumpModalOpen} onClose={() => setIsJumpModalOpen(false)} />
    </>
  );
}
