'use client';

import React, { useState } from 'react';
import {
  SkipBack,
  Play,
  Pause,
  SkipForward,
  FastForward,
  RotateCcw,
  Calendar,
  Bookmark,
  Activity,
  Zap,
} from 'lucide-react';
import { useReplayStore } from '@/store/replay-store';
import { useSessionStore } from '@/store/session-store';
import { JumpToDateModal } from '@/components/modals/JumpToDateModal';
import { Button } from '@/components/ui/button';
import { REPLAY_SPEEDS } from '@/config/constants';
import { cn } from '@/lib/utils';
import type { ReplaySpeed } from '@/types/common';

export function ReplayControls() {
  const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);

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
    jumpTo,
    setSpeed,
  } = useReplayStore();

  const handleSpeedClick = () => {
    const speedIndex = REPLAY_SPEEDS.indexOf(speed);
    const nextIndex = (speedIndex + 1) % REPLAY_SPEEDS.length;
    setSpeed(REPLAY_SPEEDS[nextIndex] as ReplaySpeed);
  };

  const handleFastForward5 = () => {
    for (let i = 0; i < 5; i++) nextCandle();
  };

  const totalCandles = allCandles.length;
  const replayableCount = Math.max(1, totalCandles - preloadCount - 1);
  const progressPercent = Math.min(100, Math.round((currentIndex / replayableCount) * 100));
  const isPlaying = state === 'playing';

  const currentCandle = allCandles[preloadCount + currentIndex];
  const dateObj = currentCandle ? new Date(currentCandle.timestamp) : new Date();

  // Format historical timestamp in US Eastern Time (ET) (e.g. "SEP 12 2025 09:47:35 ET")
  const formattedET = currentCandle
    ? dateObj
        .toLocaleString('en-US', {
          timeZone: 'America/New_York',
          month: 'short',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
        .toUpperCase() + ' ET'
    : 'WAITING FOR DATA...';

  return (
    <>
      <div className="flex items-center gap-1.5 bg-[#0f1422] border border-[#1c263c] px-2.5 py-1 rounded-xl shadow-inner font-mono text-xs select-none">
        {/* Status Badge: REPLAY MODE / LIVE / PAUSED */}
        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-[#141b2e] border border-[#1f2a44] text-[10px] font-bold">
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              isPlaying ? 'bg-amber-400 animate-ping' : state === 'paused' ? 'bg-blue-400' : 'bg-emerald-400'
            )}
          />
          <span
            className={cn(
              isPlaying ? 'text-amber-400' : state === 'paused' ? 'text-blue-400' : 'text-emerald-400'
            )}
          >
            {isPlaying ? 'REPLAY MODE' : state === 'paused' ? 'PAUSED' : 'READY'}
          </span>
        </div>

        {/* Historical Timestamp Display */}
        <div className="hidden xl:flex items-center px-2 py-0.5 rounded-md bg-[#0a0e17] border border-[#182338] text-[11px] text-gray-200 font-bold tracking-tight">
          {formattedET}
        </div>

        {/* Replay Progress Bar & Percentage */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-[#0a0e17] border border-[#182338] text-[10px]">
          <div className="w-12 h-1.5 bg-[#1a2336] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-gray-400 font-bold">{progressPercent}%</span>
        </div>

        {/* Restart / Rewind to Beginning */}
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 rounded-md text-gray-400 hover:text-white cursor-pointer"
          onClick={restartReplay}
          title="Restart Replay to Beginning (R)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>

        {/* Previous Candle */}
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 rounded-md text-gray-400 hover:text-white cursor-pointer"
          onClick={previousCandle}
          title="Previous Candle (←)"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </Button>

        {/* Play / Pause Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'w-7 h-7 rounded-full text-white transition shadow-sm cursor-pointer',
            isPlaying
              ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
          )}
          onClick={togglePlayPause}
          title="Play/Pause (Space)"
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </Button>

        {/* Next Candle */}
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 rounded-md text-gray-400 hover:text-white cursor-pointer"
          onClick={nextCandle}
          title="Next Candle (→)"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </Button>

        {/* Fast Forward 5 Candles */}
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 rounded-md text-gray-400 hover:text-white cursor-pointer"
          onClick={handleFastForward5}
          title="Fast Forward 5 Candles (Shift+→)"
        >
          <FastForward className="w-3.5 h-3.5" />
        </Button>

        <div className="w-px h-4 bg-[#232e44] mx-0.5" />

        {/* Speed Selector (0.25x to 100x) */}
        <Button
          variant="ghost"
          className="w-12 h-6 px-1 text-[11px] font-mono font-bold bg-[#141c2e] text-blue-400 hover:text-white hover:bg-[#1a253e] rounded border border-[#1f2c48] cursor-pointer"
          onClick={handleSpeedClick}
          title="Cycle Playback Speed (0.25x - 100x)"
        >
          {speed}x
        </Button>

        {/* Go To / Jump to Date Button (G) */}
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 rounded-md text-gray-400 hover:text-blue-400 hover:bg-[#1b2336] cursor-pointer"
          onClick={() => setIsJumpModalOpen(true)}
          title="Go To Historical Date/Time (G)"
        >
          <Calendar className="w-3.5 h-3.5" />
        </Button>
      </div>

      <JumpToDateModal
        isOpen={isJumpModalOpen}
        onClose={() => setIsJumpModalOpen(false)}
      />
    </>
  );
}
