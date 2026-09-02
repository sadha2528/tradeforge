'use client';

import React, { useState } from 'react';
import type { EquityPoint } from '@/lib/analytics/metrics-engine';
import { formatCurrency, formatPnL } from '@/lib/utils/formatting';

interface EquityCurveChartProps {
  data: EquityPoint[];
  startingBalance: number;
}

export function EquityCurveChart({ data, startingBalance }: EquityCurveChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<EquityPoint | null>(null);

  if (data.length < 2) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-gray-500 font-mono">
        Complete at least 1 closed trade to render the Equity Curve.
      </div>
    );
  }

  const width = 650;
  const height = 180;
  const padLeft = 60;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 25;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const minEquity = Math.min(...data.map((d) => d.equity), startingBalance);
  const maxEquity = Math.max(...data.map((d) => d.equity), startingBalance);
  const padding = (maxEquity - minEquity) * 0.1 || 1000;

  const yMin = minEquity - padding;
  const yMax = maxEquity + padding;

  const getX = (idx: number) => padLeft + (idx / (data.length - 1)) * chartW;
  const getY = (val: number) => padTop + chartH - ((val - yMin) / (yMax - yMin)) * chartH;

  // Build SVG Paths
  const points = data.map((d, i) => `${getX(i)},${getY(d.equity)}`).join(' ');
  const areaPath = `${points} L ${getX(data.length - 1)},${padTop + chartH} L ${getX(0)},${padTop + chartH} Z`;
  const peakPoints = data.map((d, i) => `${getX(i)},${getY(d.peakEquity)}`).join(' ');

  const baselineY = getY(startingBalance);

  return (
    <div className="relative w-full bg-[#0d121f] border border-[#1b253a] rounded-xl p-3 select-none">
      <div className="flex items-center justify-between mb-2 px-2 text-xs font-mono">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-white">Equity Trajectory</span>
          <div className="flex items-center space-x-1.5 text-[10px] text-gray-400">
            <span className="w-2.5 h-0.5 bg-blue-500 inline-block"></span>
            <span>Equity</span>
            <span className="w-2.5 h-0.5 bg-amber-400/80 inline-block ml-1"></span>
            <span>Peak (High-Water)</span>
          </div>
        </div>
        {hoveredPoint && (
          <div className="text-[11px] text-gray-300">
            Trade #{hoveredPoint.tradeIndex}: <strong className="text-white">{formatCurrency(hoveredPoint.equity)}</strong> ({formatPnL(hoveredPoint.equity - startingBalance)})
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
        <defs>
          <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padTop + chartH * ratio;
          const val = yMax - ratio * (yMax - yMin);
          return (
            <g key={i}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#172236" strokeDasharray="3 3" />
              <text x={padLeft - 8} y={y + 3} textAnchor="end" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono">
                ${Math.round(val).toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* Starting Balance Baseline */}
        <line
          x1={padLeft}
          y1={baselineY}
          x2={width - padRight}
          y2={baselineY}
          stroke="#475569"
          strokeDasharray="4 4"
          strokeWidth="1"
        />

        {/* High-Water Mark Peak Line */}
        <polyline points={peakPoints} fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.7" />

        {/* Gradient Area Fill */}
        <path d={`M ${areaPath}`} fill="url(#equityGrad)" />

        {/* Equity Line */}
        <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data Points */}
        {data.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.equity);
          const isSelected = hoveredPoint?.tradeIndex === d.tradeIndex;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={isSelected ? 5 : 3}
              fill={d.equity >= startingBalance ? '#22c55e' : '#ef4444'}
              stroke="#ffffff"
              strokeWidth={isSelected ? 2 : 1}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredPoint(d)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          );
        })}
      </svg>
    </div>
  );
}
