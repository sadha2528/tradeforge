'use client';

import React, { useState } from 'react';
import { Calendar, Clock, ArrowRight, X, Sparkles } from 'lucide-react';
import { useReplayStore } from '@/store/replay-store';
import { useChartStore } from '@/store/chart-store';
import { cn } from '@/lib/utils';

interface JumpToDateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JumpToDateModal({ isOpen, onClose }: JumpToDateModalProps) {
  const allCandles = useReplayStore((s) => s.allCandles);
  const jumpToTimestamp = useReplayStore((s) => s.jumpToTimestamp);
  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const activeTimeframe = useChartStore((s) => s.activeTimeframe);

  const firstCandle = allCandles[0];
  const lastCandle = allCandles[allCandles.length - 1];

  // Default to middle of dataset
  const defaultDateStr = firstCandle
    ? new Date(firstCandle.timestamp).toISOString().slice(0, 10)
    : '2024-09-16';
  const defaultTimeStr = '09:30';

  const [dateVal, setDateVal] = useState(defaultDateStr);
  const [timeVal, setTimeVal] = useState(defaultTimeStr);
  const [timezone, setTimezone] = useState<'ET' | 'UTC'>('ET');
  const [contextBars, setContextBars] = useState(60);

  if (!isOpen) return null;

  const minDateStr = firstCandle
    ? new Date(firstCandle.timestamp).toISOString().slice(0, 10)
    : undefined;
  const maxDateStr = lastCandle
    ? new Date(lastCandle.timestamp).toISOString().slice(0, 10)
    : undefined;

  const handleDayShift = (days: number) => {
    const current = new Date(dateVal + 'T12:00:00Z');
    current.setUTCDate(current.getUTCDate() + days);
    setDateVal(current.toISOString().slice(0, 10));
  };

  const handlePreset = (preset: 'start' | 'rth_open' | 'london_open' | 'globex_open' | 'halfway') => {
    if (!firstCandle || !lastCandle) return;

    if (preset === 'start') {
      const d = new Date(firstCandle.timestamp);
      setDateVal(d.toISOString().slice(0, 10));
      setTimeVal(timezone === 'ET' ? '09:30' : d.toISOString().slice(11, 16));
    } else if (preset === 'halfway') {
      const midTs = firstCandle.timestamp + (lastCandle.timestamp - firstCandle.timestamp) / 2;
      const d = new Date(midTs);
      setDateVal(d.toISOString().slice(0, 10));
      setTimeVal(timezone === 'ET' ? '09:30' : d.toISOString().slice(11, 16));
    } else if (preset === 'rth_open') {
      setTimeVal(timezone === 'ET' ? '09:30' : '13:30');
    } else if (preset === 'london_open') {
      setTimeVal(timezone === 'ET' ? '03:00' : '08:00');
    } else if (preset === 'globex_open') {
      setTimeVal(timezone === 'ET' ? '18:00' : '22:00');
    }
  };

  const handleJump = () => {
    let targetTs: number;

    if (timezone === 'UTC') {
      const combinedStr = `${dateVal}T${timeVal}:00Z`;
      targetTs = Date.parse(combinedStr);
    } else {
      // Convert America/New_York local time to UTC timestamp accurately
      const utcNaive = new Date(`${dateVal}T${timeVal}:00Z`);
      if (isNaN(utcNaive.getTime())) return;

      // Detect Eastern Time offset (EDT is UTC-4, EST is UTC-5)
      const nyStr = utcNaive.toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' });
      const offsetHours = nyStr.includes('EDT') ? 4 : 5;
      targetTs = utcNaive.getTime() + offsetHours * 60 * 60 * 1000;
    }

    if (!isNaN(targetTs)) {
      jumpToTimestamp(targetTs, contextBars);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-[#0d121f] border border-[#1e273b] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e273b]">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Jump to Historical Date &amp; Session</h2>
              <p className="text-[11px] text-gray-400">
                {activeSymbol} ({activeTimeframe}) Futures Replay Clock
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a2338] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Timezone Switch & Preset Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] text-gray-400 font-medium flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Futures Session Presets</span>
              </label>

              {/* Timezone Toggle */}
              <div className="flex items-center bg-[#111726] border border-[#1d273d] rounded p-0.5 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setTimezone('ET')}
                  className={cn(
                    'px-2 py-0.5 rounded font-bold transition cursor-pointer',
                    timezone === 'ET' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
                  )}
                >
                  ET (New York)
                </button>
                <button
                  type="button"
                  onClick={() => setTimezone('UTC')}
                  className={cn(
                    'px-2 py-0.5 rounded font-bold transition cursor-pointer',
                    timezone === 'UTC' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
                  )}
                >
                  UTC
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handlePreset('rth_open')}
                className="px-2.5 py-1 rounded bg-[#151c2d] hover:bg-[#1c263c] border border-[#232f48] text-emerald-400 hover:text-emerald-300 font-medium transition cursor-pointer"
              >
                RTH Open ({timezone === 'ET' ? '09:30 ET' : '13:30 UTC'})
              </button>
              <button
                type="button"
                onClick={() => handlePreset('london_open')}
                className="px-2.5 py-1 rounded bg-[#151c2d] hover:bg-[#1c263c] border border-[#232f48] text-blue-400 hover:text-blue-300 font-medium transition cursor-pointer"
              >
                London Open ({timezone === 'ET' ? '03:00 ET' : '08:00 UTC'})
              </button>
              <button
                type="button"
                onClick={() => handlePreset('globex_open')}
                className="px-2.5 py-1 rounded bg-[#151c2d] hover:bg-[#1c263c] border border-[#232f48] text-amber-300 hover:text-white font-medium transition cursor-pointer"
              >
                Globex Open ({timezone === 'ET' ? '18:00 ET' : '22:00 UTC'})
              </button>
              <button
                type="button"
                onClick={() => handleDayShift(-1)}
                className="px-2 py-1 rounded bg-[#151c2d] hover:bg-[#1c263c] border border-[#232f48] text-gray-300 hover:text-white transition cursor-pointer"
              >
                ← Prev Day
              </button>
              <button
                type="button"
                onClick={() => handleDayShift(1)}
                className="px-2 py-1 rounded bg-[#151c2d] hover:bg-[#1c263c] border border-[#232f48] text-gray-300 hover:text-white transition cursor-pointer"
              >
                Next Day →
              </button>
              <button
                type="button"
                onClick={() => handlePreset('start')}
                className="px-2 py-1 rounded bg-[#151c2d] hover:bg-[#1c263c] border border-[#232f48] text-gray-400 hover:text-gray-200 transition cursor-pointer"
              >
                Dataset Start
              </button>
            </div>
          </div>

          {/* Date & Time Selectors */}
          <div className="grid grid-cols-2 gap-3 bg-[#111726] p-3.5 rounded-lg border border-[#1d273d]">
            <div>
              <label className="block text-gray-400 mb-1 text-[11px]">Historical Date</label>
              <input
                type="date"
                min={minDateStr}
                max={maxDateStr}
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                className="w-full bg-[#182136] border border-[#273552] rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1 text-[11px] flex items-center space-x-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span>Time ({timezone})</span>
              </label>
              <input
                type="time"
                value={timeVal}
                onChange={(e) => setTimeVal(e.target.value)}
                className="w-full bg-[#182136] border border-[#273552] rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Context Bars Slider */}
          <div className="bg-[#111726] p-3 rounded-lg border border-[#1d273d] space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-400">Past Context Bars (History):</span>
              <span className="font-mono text-blue-400 font-bold">{contextBars} candles</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={contextBars}
              onChange={(e) => setContextBars(Number(e.target.value))}
              className="w-full accent-blue-600 h-1.5 bg-[#1e2a44] rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-gray-500">
              Context bars provide prior price action context before the jump timestamp. Future candles remain 100% concealed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1e273b] bg-[#0b0f19] flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-[#1a2338] text-gray-300 text-xs rounded hover:bg-[#232f4a] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleJump}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5"
          >
            <span>Start Replay at Date</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
