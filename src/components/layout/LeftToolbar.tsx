'use client';

import React from 'react';
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
} from 'lucide-react';
import { useChartStore } from '@/store/chart-store';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { DrawingTool } from '@/types/chart';

const TOOLS: { id: DrawingTool; icon: React.ComponentType<{ className?: string }>; label: string; shortcut?: string }[] = [
  { id: 'crosshair', icon: Crosshair, label: 'Crosshair Mode', shortcut: 'Esc' },
  { id: 'trendline', icon: TrendingUp, label: 'Trendline', shortcut: 'T' },
  { id: 'ray', icon: MoveUpRight, label: 'Ray Line' },
  { id: 'horizontal-line', icon: Minus, label: 'Horizontal Line', shortcut: 'H' },
  { id: 'vertical-line', icon: MoveVertical, label: 'Vertical Line' },
  { id: 'rectangle', icon: Square, label: 'Rectangle / Order Block' },
  { id: 'circle', icon: Circle, label: 'Circle / Area' },
  { id: 'arrow', icon: MoveRight, label: 'Arrow' },
  { id: 'text', icon: Type, label: 'Text Annotation' },
  { id: 'price-range', icon: Maximize2, label: 'Price Range' },
  { id: 'date-range', icon: Calendar, label: 'Date Range' },
  { id: 'long-position', icon: ArrowUpCircle, label: 'Long Position Tool', shortcut: 'P' },
  { id: 'short-position', icon: ArrowDownCircle, label: 'Short Position Tool' },
  { id: 'measure', icon: Ruler, label: 'Measure Ruler', shortcut: 'M' },
  { id: 'delete', icon: Trash2, label: 'Delete Drawing' },
];

export function LeftToolbar() {
  const activeTool = useChartStore((s) => s.activeTool);
  const setActiveTool = useChartStore((s) => s.setActiveTool);
  const drawings = useChartStore((s) => s.drawings);
  const clearDrawings = useChartStore((s) => s.clearDrawings);

  return (
    <div className="w-full h-full bg-[#0a0e17] border-r border-[#182338] flex flex-col items-center py-2 space-y-1 z-20 overflow-y-auto select-none">
      {TOOLS.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;
        return (
          <Tooltip key={tool.id}>
            <TooltipTrigger
              onClick={() => setActiveTool(isActive ? null : tool.id)}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer',
                isActive
                  ? 'bg-blue-600/25 text-blue-400 border border-blue-500/30 shadow-xs'
                  : 'text-gray-400 hover:bg-[#151c2d] hover:text-gray-200'
              )}
            >
              <Icon className="w-4 h-4" />
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#121828] border-[#1f2a40] text-gray-200 font-mono text-xs">
              <p className="flex items-center space-x-2">
                <span>{tool.label}</span>
                {tool.shortcut && <kbd className="bg-[#1a2336] px-1 py-0.2 rounded text-[10px] text-gray-400 font-mono">{tool.shortcut}</kbd>}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      })}

      {/* Clear All Drawings Button */}
      {drawings.length > 0 && (
        <>
          <div className="w-5 h-px bg-[#1f293d] my-1" />
          <Tooltip>
            <TooltipTrigger
              onClick={clearDrawings}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition cursor-pointer"
            >
              <Eraser className="w-4 h-4" />
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#121828] border-[#1f2a40] text-gray-200 font-mono text-xs">
              <p>Clear All Drawings ({drawings.length})</p>
            </TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
}
