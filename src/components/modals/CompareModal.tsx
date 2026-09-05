'use client';

import React, { useState, useEffect } from 'react';
import { useChartStore } from '@/store/chart-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import type { Symbol } from '@/types/market-data';
import { cn } from '@/lib/utils';
import { Search, X, TrendingUp, Check, Scale } from 'lucide-react';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CompareModal({ isOpen, onClose }: CompareModalProps) {
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [search, setSearch] = useState('');

  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const compareSymbol = useChartStore((s) => s.compareSymbol);
  const setCompareSymbol = useChartStore((s) => s.setCompareSymbol);

  useEffect(() => {
    marketDataService.getAllSymbols().then(setSymbols);
  }, []);

  if (!isOpen) return null;

  const filtered = symbols.filter(
    (s) =>
      s.id !== activeSymbol &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.displayName.toLowerCase().includes(search.toLowerCase()) ||
        s.exchange.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-md bg-[#0f1422] border border-[#202d48] rounded-2xl shadow-2xl flex flex-col overflow-hidden font-mono text-xs text-gray-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-[#1c253c] bg-[#121828]">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-white text-sm">Compare Symbol Benchmark</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-[#1a2336] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[#1c253c] bg-[#0c1018]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search benchmark (e.g. NQ, YM, GC)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#141b2c] border border-[#202d48] rounded-lg text-white font-mono text-xs focus:outline-hidden focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Active Benchmark Status */}
        {compareSymbol && (
          <div className="px-3.5 py-2 bg-blue-600/10 border-b border-blue-500/20 flex items-center justify-between text-[11px]">
            <span className="text-blue-300">
              Active Benchmark: <span className="font-bold text-white">{compareSymbol}</span>
            </span>
            <button
              onClick={() => {
                setCompareSymbol(null);
                onClose();
              }}
              className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[10px] font-bold transition cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}

        {/* Symbol List */}
        <div className="max-h-72 overflow-y-auto divide-y divide-[#171f33] p-1">
          {filtered.map((sym) => {
            const isSelected = compareSymbol === sym.id;
            return (
              <button
                key={sym.id}
                onClick={() => {
                  setCompareSymbol(sym.id);
                  onClose();
                }}
                className={cn(
                  'w-full p-2.5 rounded-lg flex items-center justify-between text-left hover:bg-[#151c2e] transition cursor-pointer',
                  isSelected && 'bg-blue-600/20 border border-blue-500/40'
                )}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-[12px]">{sym.id}</span>
                    <span className="text-[10px] text-gray-400 bg-[#162035] px-1 py-0.2 rounded border border-[#202c48]">
                      {sym.exchange}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">{sym.displayName}</span>
                </div>

                {isSelected ? (
                  <Check className="w-4 h-4 text-blue-400" />
                ) : (
                  <span className="text-[10px] text-blue-400/70 hover:text-blue-400">+ Compare</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
