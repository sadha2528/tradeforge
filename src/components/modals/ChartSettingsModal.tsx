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
import { useTradingStore } from '@/store/trading-store';
import { Settings, Sliders, Eye, Shield, Check } from 'lucide-react';

export function ChartSettingsModal() {
  const isOpen = useUIStore((s) => s.isChartSettingsOpen);
  const setIsOpen = useUIStore((s) => s.setChartSettingsOpen);

  const accountSettings = useTradingStore((s) => s.accountSettings);
  const updateAccountSettings = useTradingStore((s) => s.updateAccountSettings);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
      <DialogContent className="sm:max-w-md bg-[#0a0e17] border-[#1a2336] text-gray-200 p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-4 border-b border-[#1a2336] bg-[#0d121f]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white tracking-tight">
                Chart &amp; Execution Settings
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400">
                Configure visual scales, candlestick themes, and backtest execution assumptions.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4 max-h-[480px] overflow-y-auto font-mono text-xs">
          {/* Section: Same-Candle SL/TP Collision Assumption */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5 text-white font-bold text-xs uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Same-Candle Collision Model</span>
            </div>
            <p className="text-[11px] text-gray-400">
              Determines trade outcome if a historical bar&apos;s High/Low wick touches both Stop Loss and Take Profit.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: 'conservative', label: 'Conservative', desc: 'SL hit first (Loss)' },
                { id: 'path-aware', label: 'Path-Aware', desc: 'Checks Open/Close path' },
                { id: 'optimistic', label: 'Optimistic', desc: 'TP hit first (Win)' },
              ].map((model) => {
                const isSelected = (accountSettings.executionAssumption || 'conservative') === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() =>
                      updateAccountSettings({
                        executionAssumption: model.id as 'conservative' | 'path-aware' | 'optimistic',
                      })
                    }
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-[#0e1424] border-[#1d273e] text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>{model.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-blue-400" />}
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1">{model.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-[#162035]" />

          {/* Section: Transaction Friction & Slippage */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5 text-white font-bold text-xs uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Commissions &amp; Slippage</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 text-[11px] mb-1">Commission ($/contract)</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={accountSettings.commission}
                  onChange={(e) =>
                    updateAccountSettings({ commission: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-[#121828] border border-[#1e273e] rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[11px] mb-1">Slippage (Points)</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={accountSettings.slippage}
                  onChange={(e) =>
                    updateAccountSettings({ slippage: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-[#121828] border border-[#1e273e] rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-[#162035]" />

          {/* Section: Chart Display Options */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5 text-white font-bold text-xs uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chart Overlays</span>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center justify-between p-2 rounded-lg bg-[#0e1424] border border-[#1d273e]">
                <span className="text-gray-300">Show Candlestick Trade Markers</span>
                <input type="checkbox" defaultChecked className="accent-blue-500 rounded" />
              </label>
              <label className="flex items-center justify-between p-2 rounded-lg bg-[#0e1424] border border-[#1d273e]">
                <span className="text-gray-300">Show Draggable SL / TP Lines</span>
                <input type="checkbox" defaultChecked className="accent-blue-500 rounded" />
              </label>
              <label className="flex items-center justify-between p-2 rounded-lg bg-[#0e1424] border border-[#1d273e]">
                <span className="text-gray-300">Show Volume Sub-Histogram</span>
                <input type="checkbox" defaultChecked className="accent-blue-500 rounded" />
              </label>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-[#1a2336] bg-[#0d121f] flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold font-mono transition"
          >
            Apply &amp; Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
