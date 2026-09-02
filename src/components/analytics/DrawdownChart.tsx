'use client';

import React, { useState } from 'react';
import type { EquityPoint } from '@/lib/analytics/metrics-engine';

interface DrawdownChartProps {
  data: EquityPoint[];
}

export function DrawdownChart({ data }: DrawdownChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<EquityPoint | null>(null);

  if (data.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-gray-500 font-mono">
        No drawdown data available.
      </div>
    );
  }

  const width = 650;
  const height = 120;
  const padLeft = 60;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 20;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const maxDD = Math.max(...data.map((d) => d.drawdownPercent), 5);

  const getX = (idx: number) => padLeft + (idx / (data.length - 1)) * chartW;
  const getY = (val: number) => padTop + (val / maxDD) * chartH;

  const points = data.map((d, i) => `${getX(i)},${getY(d.drawdownPercent)}`).join(' ');
  const areaPath = `M ${getX(0)},${padTop} L ${points} L ${getX(data.length - 1)},${padTop} Z`;

  return (
    <div className="relative w-full bg-[#0d121f] border border-[#1b253a] rounded-xl p-3 select-none">
      <div className="flex items-center justify-between mb-2 px-2 text-xs font-mono">
        <span className="font-bold text-gray-300">Underwater Drawdown (%)</span>
        {hoveredPoint && (
          <div className="text-[11px] text-rose-400">
            Trade #{hoveredPoint.tradeIndex}: -{hoveredPoint.drawdownPercent}% (-${hoveredPoint.drawdownDollars.toLocaleString()})
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
        <defs>
          <linearGradient id="drawdownGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {/* 0% Top Line */}
        <line x1={padLeft} y1={padTop} x2={width - padRight} y2={padTop} stroke="#334155" strokeWidth="1" />
        <text x={padLeft - 8} y={padTop + 3} textAnchor="end" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono">
          0%
        </text>

        {/* Max DD Line */}
        <line x1={padLeft} y1={padTop + chartH} x2={width - padRight} y2={padTop + chartH} stroke="#1f293d" strokeDasharray="3 3" />
        <text x={padLeft - 8} y={padTop + chartH + 3} textAnchor="end" fill="#ef4444" fontSize="9" fontFamily="JetBrains Mono">
          -{maxDD.toFixed(1)}%
        </text>

        {/* Area Fill */}
        <path d={areaPath} fill="url(#drawdownGrad)" />

        {/* Drawdown Line */}
        <polyline points={points} fill="none" stroke="#ef4444" strokeWidth="1.8" />

        {/* Interactive hover points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(d.drawdownPercent)}
            r={3}
            fill="#ef4444"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredPoint(d)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}
      </svg>
    </div>
  );
}
