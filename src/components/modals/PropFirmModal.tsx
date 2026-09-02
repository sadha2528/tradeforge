'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useUIStore } from '@/store/ui-store';
import { useTradingStore } from '@/store/trading-store';
import {
  evaluatePropFirmRules,
  PROP_FIRM_PRESETS,
  type PropFirmChallengeConfig,
} from '@/lib/prop-firm/evaluation-engine';
import { formatCurrency, formatPnL } from '@/lib/utils/formatting';
import { Shield, Target, AlertTriangle, CheckCircle, Flame, Award, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PropFirmModal() {
  const isOpen = useUIStore((s) => s.isPropFirmModalOpen);
  const setIsOpen = useUIStore((s) => s.setPropFirmModalOpen);

  const [selectedTierKey, setSelectedTierKey] = useState<string>('50k-challenge');
  const closedTrades = useTradingStore((s) => s.closedTrades);

  const activeConfig: PropFirmChallengeConfig =
    PROP_FIRM_PRESETS[selectedTierKey] || PROP_FIRM_PRESETS['50k-challenge'];

  const evaluation = evaluatePropFirmRules(closedTrades, activeConfig);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
      <DialogContent className="sm:max-w-xl bg-[#0a0e17] border-[#1a2336] text-gray-200 p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-4 border-b border-[#1a2336] bg-[#0d121f]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white tracking-tight">
                Prop Firm Evaluation Dashboard
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400">
                Track strict prop-firm rules: Profit Target, Daily Loss Limit, and Max Trailing Drawdown.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4 max-h-[480px] overflow-y-auto font-mono text-xs">
          {/* Challenge Tier Selector */}
          <div className="space-y-1.5">
            <label className="block text-gray-400 text-[11px] font-bold uppercase">Select Challenge Tier</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PROP_FIRM_PRESETS).map(([key, cfg]) => {
                const isSelected = selectedTierKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedTierKey(key)}
                    className={cn(
                      'p-2.5 rounded-xl border text-left transition cursor-pointer',
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-xs'
                        : 'bg-[#0e1424] border-[#1d273e] text-gray-400 hover:text-gray-200'
                    )}
                  >
                    <div className="font-bold text-xs">{formatCurrency(cfg.accountSize, 'USD')}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Target: +${cfg.profitTarget}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Banner */}
          <div
            className={cn(
              'p-3 rounded-xl border flex items-center justify-between',
              evaluation.status === 'PASSED'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : evaluation.status === 'FAILED_DAILY_LOSS' || evaluation.status === 'FAILED_MAX_DRAWDOWN'
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                : 'bg-blue-950/40 border-blue-500/40 text-blue-300'
            )}
          >
            <div className="flex items-center space-x-2">
              {evaluation.status === 'PASSED' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : evaluation.status === 'IN_PROGRESS' ? (
                <Clock className="w-5 h-5 text-blue-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              )}
              <div>
                <span className="font-bold block text-xs">
                  {evaluation.status === 'PASSED'
                    ? 'CHALLENGE PASSED!'
                    : evaluation.status === 'FAILED_DAILY_LOSS'
                    ? 'RULE BREACH: Daily Loss Limit Hit'
                    : evaluation.status === 'FAILED_MAX_DRAWDOWN'
                    ? 'RULE BREACH: Max Trailing Drawdown Hit'
                    : 'EVALUATION IN PROGRESS'}
                </span>
                <span className="text-[10px] opacity-80">
                  Current Net P&amp;L: {formatPnL(evaluation.netProfit)}
                </span>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/40">
              {evaluation.tradingDaysCount} / {activeConfig.minTradingDays} Days
            </span>
          </div>

          {/* Rule 1: Profit Target Progress */}
          <div className="p-3 rounded-xl bg-[#0e1424] border border-[#1d273e] space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 flex items-center space-x-1">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>Profit Target ({formatCurrency(activeConfig.profitTarget)})</span>
              </span>
              <span className="font-bold text-emerald-400">
                {evaluation.profitTargetProgress.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-[#172033] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${evaluation.profitTargetProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 pt-0.5">
              <span>Gain: {formatPnL(evaluation.netProfit)}</span>
              <span>Target: +{formatCurrency(activeConfig.profitTarget)}</span>
            </div>
          </div>

          {/* Rule 2: Daily Loss Limit */}
          <div className="p-3 rounded-xl bg-[#0e1424] border border-[#1d273e] space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>Daily Loss Limit ({formatCurrency(activeConfig.dailyLossLimit)})</span>
              </span>
              <span className={cn('font-bold', evaluation.isDailyLossBreached ? 'text-rose-400' : 'text-gray-300')}>
                Used: ${evaluation.dailyLossUsed.toFixed(2)}
              </span>
            </div>
            <div className="w-full h-2 bg-[#172033] rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  evaluation.isDailyLossBreached ? 'bg-rose-600' : 'bg-amber-500'
                )}
                style={{
                  width: `${Math.min(100, (evaluation.dailyLossUsed / activeConfig.dailyLossLimit) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 pt-0.5">
              <span>Remaining Buffer: ${evaluation.dailyLossRemaining.toFixed(2)}</span>
              <span>Max Cap: -{formatCurrency(activeConfig.dailyLossLimit)}</span>
            </div>
          </div>

          {/* Rule 3: Max Trailing Drawdown */}
          <div className="p-3 rounded-xl bg-[#0e1424] border border-[#1d273e] space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 flex items-center space-x-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Max Trailing Drawdown ({formatCurrency(activeConfig.maxTrailingDrawdown)})</span>
              </span>
              <span className={cn('font-bold', evaluation.isMaxDrawdownBreached ? 'text-rose-400' : 'text-gray-300')}>
                Used: ${evaluation.trailingDrawdownUsed.toFixed(2)}
              </span>
            </div>
            <div className="w-full h-2 bg-[#172033] rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  evaluation.isMaxDrawdownBreached ? 'bg-rose-600' : 'bg-purple-500'
                )}
                style={{
                  width: `${Math.min(100, (evaluation.trailingDrawdownUsed / activeConfig.maxTrailingDrawdown) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 pt-0.5">
              <span>Remaining DD Buffer: ${evaluation.trailingDrawdownRemaining.toFixed(2)}</span>
              <span>Peak Balance: {formatCurrency(evaluation.highWaterMark)}</span>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-[#1a2336] bg-[#0d121f] flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold font-mono transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
