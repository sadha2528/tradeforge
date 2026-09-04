'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Play,
  Layers,
  BarChart3,
  Cloud,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Flame,
  Activity,
  Award,
  Calendar,
  BookOpen,
  MousePointerClick,
  Clock,
  ChevronDown,
  Sliders,
  DollarSign,
  Maximize2,
  Sparkles,
  Lock,
  Globe,
  Star,
  Check,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);

  const workflowSteps = [
    {
      title: '1. Select Market & Session',
      subtitle: 'Institutional CME & Forex',
      desc: 'Choose from ES, NQ, YM, RTY, GC, CL or major Forex pairs. Pick an exact historical date, time, and session open preset (NY 09:30 ET, London 03:00 ET, CME Futures).',
      badge: 'Zero Lookahead',
    },
    {
      title: '2. Step Through Historical Price Action',
      subtitle: 'Tick-Accurate Replay',
      desc: 'Advance candle-by-candle (0.25x to 100x speed) or use Shift + → to fast forward. Future candles and indicator values are strictly concealed to eliminate hindsight bias.',
      badge: '0.25x - 100x Speed',
    },
    {
      title: '3. Execute Directly on the Chart',
      subtitle: 'Draggable Risk/Reward Tools',
      desc: 'Click Buy/Sell or use hotkeys (B / S). Place Long/Short position tools with draggable Entry, Stop Loss, and Take Profit zones that calculate real-time $ risk, reward, and R:R.',
      badge: 'On-Chart Trading',
    },
    {
      title: '4. Replay & Natural Trade Exit',
      subtitle: 'Deterministic Simulation',
      desc: 'Resume replay as historical prices reach your pending orders, SL, or TP. Supports scale-out partial exits (25%, 50%, 75%) and 1-click move to Breakeven.',
      badge: 'Deterministic Fills',
    },
    {
      title: '5. Journal, Review & Analyze',
      subtitle: 'Deep Quantitative Metrics',
      desc: 'Review trades directly on chart with Previous/Next stepper. Log setups (FVG, ORB), emotions, execution ratings, and track EV, Sharpe Ratio, Drawdown, and Monthly P&L calendar.',
      badge: 'Prop-Firm Ready',
    },
  ];

  const futuresSpecs = [
    { symbol: 'ES', name: 'E-mini S&P 500', tick: '0.25', tickVal: '$12.50', ptVal: '$50.00', margin: '$12,650' },
    { symbol: 'MES', name: 'Micro E-mini S&P', tick: '0.25', tickVal: '$1.25', ptVal: '$5.00', margin: '$1,265' },
    { symbol: 'NQ', name: 'E-mini Nasdaq 100', tick: '0.25', tickVal: '$5.00', ptVal: '$20.00', margin: '$18,700' },
    { symbol: 'MNQ', name: 'Micro E-mini Nasdaq', tick: '0.25', tickVal: '$0.50', ptVal: '$2.00', margin: '$1,870' },
    { symbol: 'YM', name: 'E-mini Dow Jones', tick: '1.00', tickVal: '$5.00', ptVal: '$5.00', margin: '$9,350' },
    { symbol: 'MYM', name: 'Micro E-mini Dow', tick: '1.00', tickVal: '$0.50', ptVal: '$0.50', margin: '$935' },
    { symbol: 'RTY', name: 'E-mini Russell 2000', tick: '0.10', tickVal: '$5.00', ptVal: '$50.00', margin: '$7,150' },
    { symbol: 'GC', name: 'Gold Futures', tick: '0.10', tickVal: '$10.00', ptVal: '$100.00', margin: '$10,450' },
    { symbol: 'CL', name: 'Crude Oil Futures', tick: '0.01', tickVal: '$10.00', ptVal: '$1,000.00', margin: '$6,600' },
  ];

  const faqs = [
    {
      q: 'How does TradeForge eliminate lookahead bias?',
      a: 'At any historical replay timestamp T, the platform only feeds candles, volume, economic events, and indicators that existed up to T. Future data is strictly sealed, ensuring you practice true in-the-moment decision making without hindsight.',
    },
    {
      q: 'How is futures P&L calculated?',
      a: 'Unlike generic crypto or stock simulators that use naive percentages, TradeForge uses authentic exchange tick values (e.g. ES = 0.25 tick @ $12.50; NQ = 0.25 tick @ $5.00). Position sizing and P&L are quantized accurately down to the exact tick.',
    },
    {
      q: 'Can I use full TradingView charting and tools?',
      a: 'Yes! TradeForge provides both TradingView Lightweight Charts with custom candle-by-candle replay engine and the official TradingView Advanced Charting Studio with full Pine Script indicators, drawing tools, and live datafeeds.',
    },
    {
      q: 'How does the Prop Firm Evaluation Simulator work?',
      a: 'You can configure accounts from $25k to $300k (Apex, Topstep, FTMO rules). TradeForge tracks your Profit Target %, Daily Loss buffer, and Max Trailing Drawdown from high-water mark in real time with PASSING, WARNING, and FAILED alerts.',
    },
    {
      q: 'Is my backtesting session saved automatically?',
      a: 'Yes. All active drawings, trades, account balances, and historical bookmarks are cached in browser storage and can be synced to cloud databases or exported as standalone JSON / CSV archives.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070a13] text-gray-200 selection:bg-blue-600 selection:text-white flex flex-col font-sans relative overflow-x-hidden">
      {/* BACKGROUND GLOW EFFECTS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-blue-600/15 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-purple-600/10 blur-3xl pointer-events-none -z-10" />

      {/* NAVIGATION */}
      <nav className="h-16 border-b border-[#18233a] bg-[#090d16]/85 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6 lg:px-16">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">TradeForge</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold hidden sm:inline">
            FUTURES REPLAY v2.0
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-8 text-xs font-mono text-gray-400">
          <a href="#features" className="hover:text-white transition">Capabilities</a>
          <a href="#workflow" className="hover:text-white transition">Workflow</a>
          <a href="#futures" className="hover:text-white transition">Futures Matrix</a>
          <a href="#propfirm" className="hover:text-white transition">Prop-Firm Mode</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
          <a href="#faq" className="hover:text-white transition">FAQ</a>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/platform"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold font-mono rounded-lg shadow-lg shadow-blue-500/25 transition flex items-center space-x-1.5"
          >
            <span>Launch Workstation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 px-6 lg:px-16 max-w-6xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600/15 to-cyan-500/15 border border-blue-500/30 text-blue-300 text-xs font-mono font-semibold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Institutional CME Futures &amp; Forex Replay Terminal</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
          Backtest Futures. <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
            Replay Markets. Prove Your Edge.
          </span>
        </h1>

        <p className="max-w-3xl mx-auto text-sm sm:text-base text-gray-300 font-normal leading-relaxed">
          The manual backtesting and market-replay workstation built specifically for CME Futures traders. Replay historical price action candle-by-candle with zero lookahead bias, execute directly on the chart with draggable SL/TP zones, and evaluate prop-firm challenge metrics in real time.
        </p>

        {/* CTA Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/platform"
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm font-mono rounded-xl shadow-xl shadow-blue-500/25 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current text-white" />
            <span>Start Free Backtest</span>
          </Link>

          <a
            href="#workflow"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#101726] hover:bg-[#162035] border border-[#1e2a44] text-gray-300 hover:text-white font-semibold text-sm font-mono rounded-xl transition"
          >
            See How It Works
          </a>
        </div>

        {/* Key Feature Stats Bar */}
        <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono text-gray-300">
          <div className="p-3.5 bg-[#0b101c]/90 border border-[#1b253c] rounded-xl flex items-center space-x-2.5 shadow-sm">
            <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="text-left">
              <span className="font-bold text-white block">Zero Lookahead</span>
              <span className="text-[10px] text-gray-400">Strict historical horizon</span>
            </div>
          </div>

          <div className="p-3.5 bg-[#0b101c]/90 border border-[#1b253c] rounded-xl flex items-center space-x-2.5 shadow-sm">
            <Flame className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="text-left">
              <span className="font-bold text-white block">$12.50 CME Tick Math</span>
              <span className="text-[10px] text-gray-400">ES, NQ, YM, GC, CL</span>
            </div>
          </div>

          <div className="p-3.5 bg-[#0b101c]/90 border border-[#1b253c] rounded-xl flex items-center space-x-2.5 shadow-sm">
            <MousePointerClick className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="text-left">
              <span className="font-bold text-white block">On-Chart Trading</span>
              <span className="text-[10px] text-gray-400">Draggable SL/TP zones</span>
            </div>
          </div>

          <div className="p-3.5 bg-[#0b101c]/90 border border-[#1b253c] rounded-xl flex items-center space-x-2.5 shadow-sm">
            <Award className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <div className="text-left">
              <span className="font-bold text-white block">Prop-Firm Simulator</span>
              <span className="text-[10px] text-gray-400">Trailing DD &amp; Daily Loss</span>
            </div>
          </div>
        </div>

        {/* INTERACTIVE TERMINAL PREVIEW CARD */}
        <div className="pt-8 max-w-5xl mx-auto">
          <div className="p-2 sm:p-3 bg-[#0a0e1a]/95 border border-[#1e2a44] rounded-2xl shadow-2xl shadow-blue-900/20 backdrop-blur-md">
            {/* Terminal Header */}
            <div className="h-9 bg-[#0e1424] border-b border-[#18233a] rounded-t-xl px-3 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-gray-400 text-[11px] ml-2 font-bold">TradeForge Terminal · ES 5m Replay</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                  ● REPLAY MODE
                </span>
                <span className="text-gray-400 text-[10px] hidden sm:inline">SEP 16 2024 · 09:47:35 ET</span>
              </div>
            </div>

            {/* Terminal Chart Simulation View */}
            <div className="relative h-72 sm:h-96 bg-[#131722] rounded-b-xl overflow-hidden flex flex-col justify-between p-4 font-mono select-none">
              {/* Top Legend */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">ES · E-mini S&P 500</span>
                  <span className="text-gray-400 bg-[#1e2538] px-1.5 py-0.5 rounded text-[10px]">5m</span>
                  <span className="text-amber-400 text-[10px]">Tick: 0.25 ($12.50)</span>
                </div>
                <div className="hidden sm:flex items-center space-x-3 text-gray-400 text-[11px]">
                  <span>O <span className="text-white">5862.50</span></span>
                  <span>H <span className="text-white">5868.25</span></span>
                  <span>L <span className="text-white">5859.75</span></span>
                  <span>C <span className="text-emerald-400 font-bold">5865.50 (+12t)</span></span>
                </div>
              </div>

              {/* On-Chart Simulated Position & SL/TP Lines */}
              <div className="my-auto relative h-40 border-y border-dashed border-[#232d42] flex flex-col justify-between py-2">
                {/* Take Profit Line (Green Area) */}
                <div className="flex items-center justify-between bg-emerald-500/10 border-t border-emerald-500/60 px-3 py-1 text-[11px]">
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <span>▲ TAKE PROFIT (+40 ticks · +$500.00 · +2.0R)</span>
                  </span>
                  <span className="text-emerald-300 font-bold">5870.50</span>
                </div>

                {/* Entry Line (Blue) */}
                <div className="flex items-center justify-between bg-blue-500/10 border-y border-blue-500/70 px-3 py-1 text-[11px]">
                  <span className="text-blue-400 font-bold flex items-center space-x-1">
                    <span>● LONG 1 ES @ 5860.50</span>
                    <span className="text-emerald-400 ml-2">(Unrealized: +$62.50)</span>
                  </span>
                  <span className="text-blue-300 font-bold">5860.50</span>
                </div>

                {/* Stop Loss Line (Red Area) */}
                <div className="flex items-center justify-between bg-rose-500/10 border-b border-rose-500/60 px-3 py-1 text-[11px]">
                  <span className="text-rose-400 font-bold flex items-center space-x-1">
                    <span>▼ STOP LOSS (-20 ticks · -$250.00 · -1.0R)</span>
                  </span>
                  <span className="text-rose-300 font-bold">5855.50</span>
                </div>
              </div>

              {/* Bottom Replay Control Strip */}
              <div className="bg-[#0b101c]/90 border border-[#1f2b44] rounded-xl px-3 py-1.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px]">{'|<'}</span>
                  <span className="px-2 py-0.5 rounded bg-[#162035] text-gray-300 font-bold text-[10px]">{'<'}</span>
                  <span className="px-3 py-0.5 rounded bg-amber-600 text-white font-bold text-[10px]">▶ PLAY</span>
                  <span className="px-2 py-0.5 rounded bg-[#162035] text-gray-300 font-bold text-[10px]">{'>'}</span>
                  <span className="px-2 py-0.5 rounded bg-[#162035] text-gray-300 font-bold text-[10px]">{'>>'}</span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-gray-400 text-[10px]">Speed: <strong className="text-blue-400 font-bold">5x</strong></span>
                  <span className="text-gray-400 text-[10px]">Replay Progress: <strong className="text-white font-bold">67%</strong></span>
                  <Link href="/platform" className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition">
                    Open Live Replay ↗
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-STEP BACKTESTING WORKFLOW */}
      <section id="workflow" className="py-20 bg-[#090d16] border-y border-[#18233a] px-6 lg:px-16">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-blue-400 tracking-wider">
              The Professional Trader Workflow
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              From Historical Replay to Strategy Mastery
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto font-mono">
              Modeled after the intuitive backtesting routine of top proprietary traders.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {workflowSteps.map((step, idx) => (
              <div
                key={step.title}
                onClick={() => setActiveWorkflowStep(idx)}
                className={cn(
                  'p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3',
                  activeWorkflowStep === idx
                    ? 'bg-[#101729] border-blue-500/60 shadow-xl shadow-blue-500/10'
                    : 'bg-[#0b0f1a] border-[#182338] hover:border-[#22314d]'
                )}
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 font-bold">
                    {step.badge}
                  </span>
                  <h3 className="font-bold text-sm text-white font-mono">{step.title}</h3>
                  <h4 className="text-xs text-blue-400 font-medium">{step.subtitle}</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUTURES SPECIFICATIONS MATRIX */}
      <section id="futures" className="py-20 px-6 lg:px-16 max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider">
            FUTURES-FIRST ARCHITECTURE
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Native CME Futures Specifications
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-2xl mx-auto font-mono">
            Every contract is modeled with exact tick sizes, tick values, point multipliers, and margin requirements. Never settle for percentage approximations.
          </p>
        </div>

        <div className="bg-[#0b101c] border border-[#1b253c] rounded-2xl overflow-x-auto shadow-xl">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead className="bg-[#0f1526] text-gray-400 border-b border-[#1b253c]">
              <tr>
                <th className="p-3.5">Symbol</th>
                <th className="p-3.5">Contract Name</th>
                <th className="p-3.5">Tick Size</th>
                <th className="p-3.5">Tick Value ($)</th>
                <th className="p-3.5">Point Value ($)</th>
                <th className="p-3.5">Initial Margin</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151c2e]">
              {futuresSpecs.map((f) => (
                <tr key={f.symbol} className="hover:bg-[#111728] transition">
                  <td className="p-3.5 font-bold text-white">{f.symbol}</td>
                  <td className="p-3.5 text-gray-300">{f.name}</td>
                  <td className="p-3.5 text-gray-400">{f.tick}</td>
                  <td className="p-3.5 text-emerald-400 font-bold">{f.tickVal}</td>
                  <td className="p-3.5 text-blue-400 font-bold">{f.ptVal}</td>
                  <td className="p-3.5 text-gray-300">{f.margin}</td>
                  <td className="p-3.5 text-right">
                    <Link
                      href="/platform"
                      className="px-2.5 py-1 rounded bg-[#151d30] hover:bg-blue-600 text-gray-300 hover:text-white transition text-[10px] font-bold"
                    >
                      Replay {f.symbol} ↗
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PROP FIRM EVALUATION SIMULATOR SECTION */}
      <section id="propfirm" className="py-20 bg-[#090d16] border-y border-[#18233a] px-6 lg:px-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <span className="text-xs font-mono font-bold uppercase text-purple-400 tracking-wider">
              PROP FIRM EVALUATION SIMULATOR
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Test Strategies Against Apex, Topstep &amp; FTMO Rules
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-mono">
              TradeForge tracks institutional evaluation challenge rules in real time. Simulate $25k to $300k challenges with trailing drawdown from high-water mark, daily loss limits, and consistency rules.
            </p>

            <div className="space-y-3 font-mono text-xs text-gray-300">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Real-Time Trailing Drawdown from Peak Balance (High-Water Mark)</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Daily Loss Limit Buffer Alerts (PASSING / WARNING / FAILED)</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Configurable Profit Targets &amp; Minimum Trading Days</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/platform"
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold font-mono text-xs shadow-lg shadow-purple-600/25 transition"
              >
                <span>Launch Prop-Firm Challenge Mode</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Prop Firm UI Showcase Card */}
          <div className="p-5 bg-[#0b101d] border border-[#1e2a44] rounded-2xl shadow-2xl font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#18233a] pb-3">
              <div>
                <span className="text-gray-400 text-[10px]">Active Challenge</span>
                <h4 className="font-bold text-white text-sm">$50,000 Apex / Topstep Tier</h4>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[11px]">
                ● PASSING
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#101726] rounded-xl border border-[#1b253c]">
                <span className="text-gray-400 text-[10px] block">Profit Target Progress</span>
                <strong className="text-emerald-400 text-sm block mt-0.5">$3,090 / $3,000 (103%)</strong>
              </div>
              <div className="p-3 bg-[#101726] rounded-xl border border-[#1b253c]">
                <span className="text-gray-400 text-[10px] block">Trailing Drawdown Buffer</span>
                <strong className="text-blue-400 text-sm block mt-0.5">$2,450 remaining</strong>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-400">Target Progress</span>
                <span className="text-emerald-400 font-bold">100% (Hit)</span>
              </div>
              <div className="w-full h-2 bg-[#172033] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="py-20 px-6 lg:px-16 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-bold uppercase text-cyan-400 tracking-wider">
            WHY TRADEFORGE
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Built for Serious Futures Backtesting
          </h2>
        </div>

        <div className="bg-[#0b101c] border border-[#1b253c] rounded-2xl overflow-x-auto shadow-xl">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead className="bg-[#0f1526] text-gray-400 border-b border-[#1b253c]">
              <tr>
                <th className="p-3.5">Capability</th>
                <th className="p-3.5 text-blue-400 font-bold">TradeForge</th>
                <th className="p-3.5 text-gray-400">Generic Simulators</th>
                <th className="p-3.5 text-gray-400">Manual Spreadsheets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151c2e]">
              <tr>
                <td className="p-3.5 font-bold text-white">Zero Lookahead Historical Replay</td>
                <td className="p-3.5 text-emerald-400 font-bold flex items-center space-x-1"><Check className="w-4 h-4 text-emerald-400" /><span>Yes (0.25x - 100x)</span></td>
                <td className="p-3.5 text-rose-400">Leaky future data</td>
                <td className="p-3.5 text-rose-400">Manual hindsight</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-white">CME Futures $12.50 Tick Math</td>
                <td className="p-3.5 text-emerald-400 font-bold flex items-center space-x-1"><Check className="w-4 h-4 text-emerald-400" /><span>Native Tick Engine</span></td>
                <td className="p-3.5 text-gray-400">Percentage approximations</td>
                <td className="p-3.5 text-gray-400">Manual formulas</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-white">Draggable On-Chart SL / TP Zones</td>
                <td className="p-3.5 text-emerald-400 font-bold flex items-center space-x-1"><Check className="w-4 h-4 text-emerald-400" /><span>Interactive Canvas</span></td>
                <td className="p-3.5 text-rose-400">Order form inputs only</td>
                <td className="p-3.5 text-rose-400">None</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-white">Full TradingView Chart Integration</td>
                <td className="p-3.5 text-emerald-400 font-bold flex items-center space-x-1"><Check className="w-4 h-4 text-emerald-400" /><span>Full Studio Embed</span></td>
                <td className="p-3.5 text-gray-400">Basic Canvas</td>
                <td className="p-3.5 text-rose-400">None</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-white">Prop-Firm Trailing Drawdown Rules</td>
                <td className="p-3.5 text-emerald-400 font-bold flex items-center space-x-1"><Check className="w-4 h-4 text-emerald-400" /><span>Automatic High-Water Mark</span></td>
                <td className="p-3.5 text-rose-400">Not supported</td>
                <td className="p-3.5 text-gray-400">Complex spreadsheet cells</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 bg-[#090d16] border-y border-[#18233a] px-6 lg:px-16 text-center space-y-10">
        <div className="space-y-3">
          <span className="text-xs font-mono font-bold uppercase text-blue-400 tracking-wider">
            TRANSPARENT PRICING
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Invest in Your Trading Mastery
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 font-mono">
            Everything you need to practice, backtest, and build a verifiable edge.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
          {/* Free Tier */}
          <div className="bg-[#0b101c] border border-[#1b253c] rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-white font-mono">Free Starter</h3>
            <div className="text-3xl font-black text-white font-mono">$0 <span className="text-xs text-gray-400 font-normal">/ forever</span></div>
            <p className="text-xs text-gray-400 font-mono">Full access to historical replay, CME futures specifications, and on-chart trading.</p>

            <ul className="space-y-2 text-xs font-mono text-gray-300">
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /><span>Full Replay Engine (0.25x - 100x)</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /><span>CME Futures: ES, NQ, YM, GC, CL</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /><span>Draggable SL / TP &amp; On-Chart Widget</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /><span>LocalStorage Session Persistence</span></li>
            </ul>

            <Link href="/platform" className="block w-full py-3 bg-[#131b2c] hover:bg-[#1a253e] text-white text-center font-bold font-mono text-xs rounded-xl transition">
              Launch Free Workstation
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="bg-[#0b101c] border-2 border-blue-500 rounded-2xl p-6 space-y-4 shadow-xl shadow-blue-500/10 relative">
            <div className="absolute -top-3 right-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              Pro Backtester
            </div>
            <h3 className="font-bold text-lg text-white font-mono">Pro Quantitative</h3>
            <div className="text-3xl font-black text-white font-mono">$29 <span className="text-xs text-gray-400 font-normal">/ month</span></div>
            <p className="text-xs text-gray-400 font-mono">For prop-firm traders and serious discretionary backtesters.</p>

            <ul className="space-y-2 text-xs font-mono text-gray-300">
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /><span>Full TradingView Advanced Studio Embed</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /><span>Prop-Firm Evaluation Challenge Tracker</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /><span>Multi-Timeframe 2x2 Synchronized Grid</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /><span>Expected Value (EV), Sharpe &amp; Drawdown Analytics</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /><span>CSV &amp; Cloud Snapshot Synchronization</span></li>
            </ul>

            <Link href="/platform" className="block w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-center font-bold font-mono text-xs rounded-xl transition shadow-lg shadow-blue-500/25">
              Start Pro Access
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION SECTION */}
      <section id="faq" className="py-20 px-6 lg:px-16 max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-bold uppercase text-gray-400 tracking-wider">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Everything You Need to Know
          </h2>
        </div>

        <div className="space-y-3 font-mono">
          {faqs.map((f, idx) => (
            <div
              key={f.q}
              className="bg-[#0b101c] border border-[#1b253c] rounded-xl overflow-hidden transition"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-white hover:text-blue-400 cursor-pointer"
              >
                <span>{f.q}</span>
                <ChevronDown
                  className={cn('w-4 h-4 text-gray-400 transition-transform', activeFaq === idx ? 'rotate-180' : '')}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-4 pb-4 text-[11px] text-gray-400 leading-relaxed border-t border-[#18233a] pt-3">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-20 bg-gradient-to-b from-[#090d16] to-[#060810] border-t border-[#18233a] px-6 text-center space-y-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to Build Verifiable Trading Edge?
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 font-mono">
            Launch TradeForge today. Replay historical price action, master your setups, and prepare for funded evaluations.
          </p>
          <div className="pt-3">
            <Link
              href="/platform"
              className="inline-flex items-center space-x-2 px-9 py-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:scale-105 text-white font-bold font-mono text-sm rounded-xl shadow-2xl shadow-blue-500/30 transition transform"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Free Workstation Now</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#18233a] bg-[#060810] py-10 px-6 lg:px-16 text-xs text-gray-500 font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-white font-bold">
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white">
              <TrendingUp className="w-3 h-3" />
            </div>
            <span>TradeForge</span>
            <span className="text-gray-500 font-normal ml-2">© 2026. Backtest. Replay. Improve.</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px] text-gray-400">
            <Link href="/platform" className="hover:text-white transition">Platform</Link>
            <a href="#features" className="hover:text-white transition">Futures Specs</a>
            <a href="#propfirm" className="hover:text-white transition">Prop-Firm Mode</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
