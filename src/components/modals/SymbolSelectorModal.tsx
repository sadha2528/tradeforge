'use client';

import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Layers, Check, X } from 'lucide-react';
import { useChartStore } from '@/store/chart-store';
import { marketDataService } from '@/lib/market-data/market-data-service';
import type { Symbol, AssetClass } from '@/types/market-data';
import { cn } from '@/lib/utils';

interface SymbolSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SymbolSelectorModal({ isOpen, onClose }: SymbolSelectorModalProps) {
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | AssetClass>('all');
  const activeSymbol = useChartStore((s) => s.activeSymbol);
  const setActiveSymbol = useChartStore((s) => s.setActiveSymbol);

  useEffect(() => {
    if (isOpen) {
      marketDataService.getAllSymbols().then(setSymbols);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredSymbols = symbols.filter((s) => {
    const matchesTab = activeTab === 'all' || s.assetClass === activeTab;
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.displayName.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const handleSelect = (symbolId: string) => {
    setActiveSymbol(symbolId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-[#0d121f] border border-[#1e273b] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e273b]">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Symbol & Futures Search</h2>
              <p className="text-xs text-gray-400">Select market instruments or futures contracts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a2338] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-[#1e273b] space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by symbol or name (e.g. ES, NQ, Gold, EUR/USD, BTC)..."
              autoFocus
              className="w-full bg-[#151c2d] border border-[#242f48] rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex space-x-1">
            {[
              { id: 'all', label: 'All Instruments' },
              { id: 'futures', label: 'Futures' },
              { id: 'forex', label: 'Forex' },
              { id: 'crypto', label: 'Crypto' },
              { id: 'stocks', label: 'Stocks' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition',
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#151c2d]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Symbols List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#161f33]">
          {filteredSymbols.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No symbols found matching &quot;{search}&quot;
            </div>
          ) : (
            filteredSymbols.map((sym) => {
              const isSelected = activeSymbol.toUpperCase() === sym.id.toUpperCase();
              return (
                <div
                  key={sym.id}
                  onClick={() => handleSelect(sym.id)}
                  className={cn(
                    'p-3 rounded-lg flex items-center justify-between cursor-pointer transition hover:bg-[#162035]',
                    isSelected && 'bg-blue-600/10 border border-blue-500/30'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono',
                        sym.assetClass === 'futures'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : sym.assetClass === 'forex'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : sym.assetClass === 'crypto'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      )}
                    >
                      {sym.name.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white font-mono">{sym.name}</span>
                        <span className="text-xs text-gray-400">{sym.displayName}</span>
                        <span className="text-[10px] font-mono bg-[#1c263c] px-1.5 py-0.5 rounded text-gray-300">
                          {sym.exchange}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{sym.description}</p>
                    </div>
                  </div>

                  {/* Contract Specs */}
                  <div className="flex items-center space-x-4">
                    <div className="text-right text-xs font-mono">
                      <div className="text-gray-300">
                        Tick: <span className="text-blue-400 font-semibold">{sym.tickSize}</span>
                      </div>
                      {sym.assetClass === 'futures' && (
                        <div className="text-[11px] text-amber-400/90 font-medium">
                          ${sym.tickValue.toFixed(2)}/tick (${sym.pointValue}/pt)
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1e273b] bg-[#0b0f19] flex justify-between items-center text-xs text-gray-400">
          <span>Futures contracts calculate P&amp;L with exact tick values ($12.50 for ES, $5.00 for NQ).</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#1a2338] text-gray-200 rounded hover:bg-[#232f4a] transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
