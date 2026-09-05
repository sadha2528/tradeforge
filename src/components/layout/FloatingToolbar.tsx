'use client';

import React, { useState } from 'react';
import {
  Crosshair,
  TrendingUp,
  Minus,
  MoveVertical,
  Square,
  Circle,
  Type,
  ArrowUpCircle,
  ArrowDownCircle,
  Ruler,
  Trash2,
  Eraser,
  MoveUpRight,
  MoveRight,
  Maximize2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Magnet,
  Lock,
  Unlock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useChartStore } from '@/store/chart-store';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { DrawingTool } from '@/types/chart';

const TOOLS: { id: DrawingTool; icon: React.ComponentType<{ className?: string }>; label: string; shortcut?: string }[] = [
  { id: 'crosshair', icon: Crosshair, label: 'Crosshair', shortcut: 'Esc' },
  { id: 'trendline', icon: TrendingUp, label: 'Trendline', shortcut: 'T' },
  { id: 'ray', icon: MoveUpRight, label: 'Ray' },
  { id: 'horizontal-line', icon: Minus, label: 'H-Line', shortcut: 'H' },
  { id: 'vertical-line', icon: MoveVertical, label: 'V-Line' },
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'arrow', icon: MoveRight, label: 'Arrow' },
  { id: 'text', icon: Type, label: 'Text', shortcut: 'A' },
  { id: 'price-range', icon: Maximize2, label: 'Price Range' },
  { id: 'date-range', icon: Calendar, label: 'Date Range' },
  { id: 'long-position', icon: ArrowUpCircle, label: 'Long Tool', shortcut: 'P' },
  { id: 'short-position', icon: ArrowDownCircle, label: 'Short Tool' },
  { id: 'measure', icon: Ruler, label: 'Measure', shortcut: 'M' },
  { id: 'delete', icon: Trash2, label: 'Delete' },
];

interface FloatingToolbarProps {
  className?: string;
}

export function FloatingToolbar({ className }: FloatingToolbarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const activeTool = useChartStore((s) => s.activeTool);
  const setActiveTool = useChartStore((s) => s.setActiveTool);
  const drawings = useChartStore((s) => s.drawings);
  const clearDrawings = useChartStore((s) => s.clearDrawings);
  const magnetMode = useChartStore((s) => s.magnetMode);
  const setMagnetMode = useChartStore((s) => s.setMagnetMode);
  const areDrawingsLocked = useChartStore((s) => s.areDrawingsLocked);
  const toggleLockDrawings = useChartStore((s) => s.toggleLockDrawings);
  const areDrawingsHidden = useChartStore((s) => s.areDrawingsHidden);
  const toggleHideDrawings = useChartStore((s) => s.toggleHideDrawings);

  const cycleMagnet = () => {
    if (magnetMode === 'off') setMagnetMode('weak');
    else if (magnetMode === 'weak') setMagnetMode('strong');
    else setMagnetMode('off');
  };

  return (
    <div className={cn('absolute left-2 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-0.5', className)}>
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-6 h-6 rounded-md bg-[#0f1421]/90 hover:bg-[#161c2b] border border-[#1e2535] text-gray-500 hover:text-gray-300 flex items-center justify-center transition cursor-pointer mb-1 backdrop-blur-sm"
        title={collapsed ? 'Expand toolbar' : 'Collapse toolbar'}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {!collapsed && (
        <div className="bg-[#0f1421]/90 backdrop-blur-sm border border-[#1e2535] rounded-xl p-1 flex flex-col items-center gap-0.5 shadow-xl shadow-black/40">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <Tooltip key={tool.id}>
                <TooltipTrigger
                  onClick={() => setActiveTool(isActive ? null : tool.id)}
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer',
                    isActive
                      ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
                      : 'text-gray-500 hover:bg-[#161c2b] hover:text-gray-200'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-[#111827] border-[#1e2535] text-gray-200 font-mono text-[11px] z-50">
                  <p className="flex items-center gap-2">
                    <span>{tool.label}</span>
                    {tool.shortcut && (
                      <kbd className="bg-[#1a2336] px-1 py-0.5 rounded text-[10px] text-gray-400">{tool.shortcut}</kbd>
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}

          <div className="w-4 h-px bg-[#252d40] my-0.5" />

          {/* Magnet Mode */}
          <Tooltip>
            <TooltipTrigger
              onClick={cycleMagnet}
              className={cn(
                'w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer relative',
                magnetMode === 'weak'
                  ? 'bg-blue-600/25 text-blue-400 border border-blue-500/40'
                  : magnetMode === 'strong'
                  ? 'bg-amber-600/25 text-amber-400 border border-amber-500/40'
                  : 'text-gray-500 hover:bg-[#161c2b] hover:text-gray-200'
              )}
            >
              <Magnet className="w-3.5 h-3.5" />
              {magnetMode !== 'off' && (
                <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold uppercase leading-none px-0.5 rounded bg-[#161f33] text-gray-300">
                  {magnetMode === 'weak' ? 'W' : 'S'}
                </span>
              )}
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#111827] border-[#1e2535] text-gray-200 font-mono text-[11px] z-50">
              <p>Magnet Mode: <span className="capitalize font-bold text-blue-400">{magnetMode}</span> (Snap to OHLC)</p>
            </TooltipContent>
          </Tooltip>

          {/* Lock Drawings */}
          <Tooltip>
            <TooltipTrigger
              onClick={toggleLockDrawings}
              className={cn(
                'w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer',
                areDrawingsLocked
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-gray-500 hover:bg-[#161c2b] hover:text-gray-200'
              )}
            >
              {areDrawingsLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#111827] border-[#1e2535] text-gray-200 font-mono text-[11px] z-50">
              <p>{areDrawingsLocked ? 'Unlock All Drawings' : 'Lock All Drawings'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Hide Drawings */}
          <Tooltip>
            <TooltipTrigger
              onClick={toggleHideDrawings}
              className={cn(
                'w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer',
                areDrawingsHidden
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-gray-500 hover:bg-[#161c2b] hover:text-gray-200'
              )}
            >
              {areDrawingsHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#111827] border-[#1e2535] text-gray-200 font-mono text-[11px] z-50">
              <p>{areDrawingsHidden ? 'Show All Drawings' : 'Hide All Drawings'}</p>
            </TooltipContent>
          </Tooltip>

          {drawings.length > 0 && (
            <>
              <div className="w-4 h-px bg-[#252d40] my-0.5" />
              <Tooltip>
                <TooltipTrigger
                  onClick={clearDrawings}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" />
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-[#111827] border-[#1e2535] text-gray-200 font-mono text-[11px] z-50">
                  <p>Clear All ({drawings.length})</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      )}
    </div>
  );
}
