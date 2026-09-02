'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useUIStore } from '@/store/ui-store';
import { useChartStore } from '@/store/chart-store';
import { useIndicatorStore } from '@/store/indicator-store';
import { useTradingStore } from '@/store/trading-store';
import {
  Layers,
  TrendingUp,
  Activity,
  Briefcase,
  Eye,
  EyeOff,
  Trash2,
  Square,
  Minus,
  MoveVertical,
  Type,
  Ruler,
} from 'lucide-react';
import type { DrawingTool } from '@/types/chart';

export function ObjectTreeModal() {
  const isOpen = useUIStore((s) => s.isObjectTreeOpen);
  const setIsOpen = useUIStore((s) => s.setObjectTreeOpen);

  const drawings = useChartStore((s) => s.drawings);
  const toggleDrawingVisibility = useChartStore((s) => s.toggleDrawingVisibility);
  const deleteDrawing = useChartStore((s) => s.deleteDrawing);
  const clearDrawings = useChartStore((s) => s.clearDrawings);

  const activeIndicators = useIndicatorStore((s) => s.activeIndicators);
  const toggleVisibility = useIndicatorStore((s) => s.toggleVisibility);
  const removeIndicator = useIndicatorStore((s) => s.removeIndicator);

  const positions = useTradingStore((s) => s.positions);
  const closedTrades = useTradingStore((s) => s.closedTrades);

  const getToolIcon = (type: DrawingTool) => {
    switch (type) {
      case 'trendline':
      case 'ray':
        return <TrendingUp className="w-3.5 h-3.5 text-blue-400" />;
      case 'horizontal-line':
        return <Minus className="w-3.5 h-3.5 text-blue-400" />;
      case 'vertical-line':
        return <MoveVertical className="w-3.5 h-3.5 text-blue-400" />;
      case 'rectangle':
        return <Square className="w-3.5 h-3.5 text-blue-400" />;
      case 'text':
        return <Type className="w-3.5 h-3.5 text-blue-400" />;
      case 'measure':
        return <Ruler className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
      <DialogContent className="sm:max-w-lg bg-[#0a0e17] border-[#1a2336] text-gray-200 p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-4 border-b border-[#1a2336] bg-[#0d121f]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white tracking-tight">
                Chart Object Tree &amp; Layers
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400">
                Manage all active indicator overlays, drawing annotations, and trade markers.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4 max-h-[480px] overflow-y-auto font-mono text-xs">
          {/* Group 1: Technical Indicators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-white font-bold text-xs uppercase tracking-wider">
              <div className="flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                <span>Indicators ({activeIndicators.length})</span>
              </div>
            </div>

            {activeIndicators.length === 0 ? (
              <div className="text-gray-500 italic p-2 bg-[#0e1424] rounded-lg">No active indicators.</div>
            ) : (
              <div className="space-y-1">
                {activeIndicators.map((ind) => (
                  <div
                    key={ind.id}
                    className="p-2 rounded-lg bg-[#0e1424] border border-[#1b253c] flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ind.color }} />
                      <span className="text-white font-semibold">{ind.name}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => toggleVisibility(ind.id)}
                        className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#162035]"
                        title={ind.visible ? 'Hide' : 'Show'}
                      >
                        {ind.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-gray-600" />}
                      </button>
                      <button
                        onClick={() => removeIndicator(ind.id)}
                        className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-500/20"
                        title="Remove Indicator"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-px bg-[#162035]" />

          {/* Group 2: Chart Drawings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-white font-bold text-xs uppercase tracking-wider">
              <div className="flex items-center space-x-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Drawings &amp; Annotations ({drawings.length})</span>
              </div>
              {drawings.length > 0 && (
                <button
                  onClick={clearDrawings}
                  className="text-rose-400 hover:text-rose-300 text-[10px] font-bold"
                >
                  Clear All
                </button>
              )}
            </div>

            {drawings.length === 0 ? (
              <div className="text-gray-500 italic p-2 bg-[#0e1424] rounded-lg">No active drawings on chart.</div>
            ) : (
              <div className="space-y-1">
                {drawings.map((d, idx) => (
                  <div
                    key={d.id}
                    className="p-2 rounded-lg bg-[#0e1424] border border-[#1b253c] flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      {getToolIcon(d.type)}
                      <span className="text-white capitalize">
                        {d.type.replace('-', ' ')} #{idx + 1}
                      </span>
                      {d.text && <span className="text-gray-400 text-[10px]">(&quot;{d.text}&quot;)</span>}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => toggleDrawingVisibility(d.id)}
                        className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#162035]"
                        title={d.visible ? 'Hide' : 'Show'}
                      >
                        {d.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-gray-600" />}
                      </button>
                      <button
                        onClick={() => deleteDrawing(d.id)}
                        className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-500/20"
                        title="Delete Drawing"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-px bg-[#162035]" />

          {/* Group 3: Trade Markers & Executions */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5 text-white font-bold text-xs uppercase tracking-wider">
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span>Trade Executions ({positions.length + closedTrades.length})</span>
            </div>

            <div className="text-gray-400 text-[11px] p-2 bg-[#0e1424] rounded-lg flex justify-between items-center">
              <span>{positions.length} Open Position(s) · {closedTrades.length} Completed Trade(s)</span>
              <span className="text-emerald-400 text-[10px] font-bold">LIVE SYNCED</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
