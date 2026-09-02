'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  INDICATOR_CATALOG,
  useIndicatorStore,
} from '@/store/indicator-store';
import {
  Search,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Sliders,
  TrendingUp,
  Activity,
  Zap,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IndicatorCategory, IndicatorConfig } from '@/types/indicator';

interface IndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IndicatorsModal({ isOpen, onClose }: IndicatorsModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IndicatorCategory | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeIndicators = useIndicatorStore((s) => s.activeIndicators);
  const addIndicator = useIndicatorStore((s) => s.addIndicator);
  const removeIndicator = useIndicatorStore((s) => s.removeIndicator);
  const updateIndicator = useIndicatorStore((s) => s.updateIndicator);
  const toggleVisibility = useIndicatorStore((s) => s.toggleVisibility);

  const filteredCatalog = INDICATOR_CATALOG.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.shortName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl bg-[#0a0e17] border-[#1a2336] text-gray-200 p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-4 border-b border-[#1a2336] bg-[#0d121f]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white tracking-tight">
                Technical Indicators &amp; Overlays
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400">
                Add quantitative moving averages, momentum oscillators, and volatility bands to your charts.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px] max-h-[540px]">
          {/* LEFT: Indicator Catalog (7 cols) */}
          <div className="md:col-span-7 border-r border-[#1a2336] p-4 flex flex-col space-y-3 bg-[#070a12]">
            {/* Search and Category Filters */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search indicators (e.g. EMA, RSI, Bollinger)..."
                className="w-full bg-[#101626] border border-[#1d273d] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500 font-mono"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px] font-mono">
              {(['all', 'trend', 'momentum', 'volatility', 'volume'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-2 py-0.5 rounded capitalize transition',
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'bg-[#121828] text-gray-400 hover:text-gray-200'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Catalog List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredCatalog.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#0e1424] border border-[#1b253c] hover:border-blue-500/40 rounded-lg p-2.5 flex items-center justify-between transition group"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-white">{item.name}</span>
                      <span className="text-[10px] font-mono bg-[#162035] text-blue-400 px-1.5 py-0.2 rounded">
                        {item.category.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      {item.isOverlay ? 'Main Chart Overlay' : 'Oscillator Sub-Pane'}
                    </div>
                  </div>

                  <button
                    onClick={() => addIndicator(item)}
                    className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Active Indicators & Settings (5 cols) */}
          <div className="md:col-span-5 p-4 flex flex-col space-y-3 bg-[#0a0e17]">
            <div className="flex justify-between items-center pb-2 border-b border-[#1a2336]">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Active Indicators ({activeIndicators.length})
              </span>
            </div>

            {activeIndicators.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-xs space-y-1 py-8 font-mono text-center">
                <Sliders className="w-6 h-6 opacity-30" />
                <p>No active indicators.</p>
                <p className="text-[10px] text-gray-600">Select an indicator from the left to attach it.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {activeIndicators.map((ind) => (
                  <div
                    key={ind.id}
                    className="bg-[#0e1424] border border-[#1b253c] rounded-lg p-2.5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: ind.color }}
                        />
                        <span className="font-bold text-xs text-white font-mono">{ind.shortName}</span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => toggleVisibility(ind.id)}
                          className="p-1 text-gray-400 hover:text-white rounded"
                        >
                          {ind.visible ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5 text-gray-600" />}
                        </button>
                        <button
                          onClick={() => removeIndicator(ind.id)}
                          className="p-1 text-gray-400 hover:text-rose-400 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* In-Line Parameter Editing */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-400 pt-1 border-t border-[#182236]">
                      {ind.parameters.period !== undefined && (
                        <div>
                          <label className="block mb-0.5">Period</label>
                          <input
                            type="number"
                            value={ind.parameters.period}
                            onChange={(e) =>
                              updateIndicator(ind.id, {
                                shortName: `${ind.type.toUpperCase()} ${e.target.value}`,
                                parameters: { ...ind.parameters, period: parseInt(e.target.value, 10) || 1 },
                              })
                            }
                            className="w-full bg-[#121828] border border-[#1f2a42] rounded px-1.5 py-0.5 text-white font-bold"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block mb-0.5">Color</label>
                        <input
                          type="color"
                          value={ind.color}
                          onChange={(e) => updateIndicator(ind.id, { color: e.target.value })}
                          className="w-full h-6 bg-transparent border-0 cursor-pointer rounded"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
