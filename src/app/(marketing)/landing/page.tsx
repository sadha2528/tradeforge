'use client';

import React from 'react';
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
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070a12] text-gray-200 selection:bg-blue-600 selection:text-white flex flex-col font-sans">
      {/* NAVIGATION */}
      <nav className="h-16 border-b border-[#182338] bg-[#0a0e17]/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6 lg:px-12">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">TradeForge</span>
        </div>

        <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#futures" className="hover:text-white transition">Futures Specs</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/platform"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-500/20 transition flex items-center space-x-1.5"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-24 px-6 lg:px-12 max-w-6xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
          <span>Next-Gen CME Futures &amp; Forex Replay Terminal</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          Backtest. Replay. <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Master the Market.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-400 font-normal leading-relaxed">
          The institutional-grade market simulator designed for serious discretionary and algorithmic traders. Replay historical price action candle-by-candle with zero lookahead bias, precise CME Futures tick values, and real-time quantitative analytics.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/platform"
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Free Backtest</span>
          </Link>

          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#121828] hover:bg-[#192238] border border-[#202c44] text-gray-300 hover:text-white font-semibold text-sm rounded-xl transition"
          >
            Explore Capabilities
          </a>
        </div>

        {/* Feature Badges */}
        <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono text-gray-400">
          <div className="p-3 bg-[#0d121f] border border-[#1b253a] rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Zero Lookahead Bias</span>
          </div>
          <div className="p-3 bg-[#0d121f] border border-[#1b253a] rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>CME $12.50 Tick P&amp;L</span>
          </div>
          <div className="p-3 bg-[#0d121f] border border-[#1b253a] rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Multi-Timeframe Grid</span>
          </div>
          <div className="p-3 bg-[#0d121f] border border-[#1b253a] rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Offline-First Cloud Sync</span>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features" className="py-20 bg-[#0a0e17] border-y border-[#182338] px-6 lg:px-12">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Engineered for Precision Backtesting
            </h2>
            <p className="text-sm text-gray-400 max-w-xl mx-auto">
              Every detail built from scratch to mirror real-world broker execution, risk management, and order flow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#0d121f] border border-[#1b253a] hover:border-blue-500/40 rounded-2xl p-6 space-y-3 transition">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Play className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Deterministic Replay Engine</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Step through historical bars at 1x to 100x speed. Jump directly to session opens (London, NY Open, Asia) without leaking future price action.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#0d121f] border border-[#1b253a] hover:border-blue-500/40 rounded-2xl p-6 space-y-3 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">CME Futures Tick Precision</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Native support for E-mini (ES, NQ, GC, CL) and Micro contracts (MES, MNQ) with exact point values, tick quantization, and slippage simulation.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#0d121f] border border-[#1b253a] hover:border-blue-500/40 rounded-2xl p-6 space-y-3 transition">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Multi-Timeframe Grid Sync</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                View 1D higher timeframe context, 1h market structure, and 5m execution charts simultaneously in a synchronized split grid layout.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#0d121f] border border-[#1b253a] hover:border-blue-500/40 rounded-2xl p-6 space-y-3 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Quantitative Analytics &amp; EV</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Instant calculation of Profit Factor, Expected Value ($ &amp; R), Sharpe/Sortino ratios, Max Drawdown curves, and Day/Session breakdowns.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#0d121f] border border-[#1b253a] hover:border-blue-500/40 rounded-2xl p-6 space-y-3 transition">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Technical Indicator Suite</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Built-in EMA 9/20/50/200, SMA, VWAP, Bollinger Bands, RSI 14, and MACD overlays calculating in real-time on every candle tick.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#0d121f] border border-[#1b253a] hover:border-blue-500/40 rounded-2xl p-6 space-y-3 transition">
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Cloud Backup &amp; Portability</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Save snapshots directly to the cloud database (<kbd>Cmd+S</kbd>) or export complete standalone `.tradeforge.json` session backup archives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 px-6 lg:px-12 max-w-4xl mx-auto text-center space-y-10">
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Transparent Pricing</h2>
          <p className="text-sm text-gray-400">Everything you need to practice, backtest, and build edge.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* Free Tier */}
          <div className="bg-[#0d121f] border border-[#1b253a] rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-white">Starter</h3>
            <div className="text-3xl font-black text-white font-mono">$0 <span className="text-xs text-gray-400 font-normal">/ forever</span></div>
            <p className="text-xs text-gray-400">Free unlimited historical replay and manual trade simulation.</p>

            <ul className="space-y-2 text-xs font-mono text-gray-300">
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span>Full Replay Engine (1x - 100x)</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span>All CME Futures &amp; Forex Instruments</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span>LocalStorage Session Caching</span></li>
            </ul>

            <Link href="/platform" className="block w-full py-2.5 bg-[#151d2f] hover:bg-[#1d273e] text-white text-center font-bold text-xs rounded-lg transition">
              Launch Free Terminal
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="bg-[#0d121f] border-2 border-blue-500 rounded-2xl p-6 space-y-4 shadow-xl shadow-blue-500/10 relative">
            <div className="absolute -top-3 right-4 bg-blue-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              Recommended
            </div>
            <h3 className="font-bold text-lg text-white">Pro Quantitative</h3>
            <div className="text-3xl font-black text-white font-mono">$29 <span className="text-xs text-gray-400 font-normal">/ month</span></div>
            <p className="text-xs text-gray-400">For prop firm traders and serious discretionary backtesters.</p>

            <ul className="space-y-2 text-xs font-mono text-gray-300">
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /><span>Multi-Timeframe 2x2 Split Grid</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /><span>Unlimited Cloud Persistence</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /><span>Advanced Expectancy (EV) &amp; Drawdown Analytics</span></li>
              <li className="flex items-center space-x-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /><span>CSV &amp; JSON Exporting</span></li>
            </ul>

            <Link href="/platform" className="block w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-center font-bold text-xs rounded-lg transition shadow-md">
              Start Pro Access
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-[#182338] bg-[#0a0e17] py-8 px-6 text-center text-xs text-gray-500 font-mono">
        <p>© 2026 TradeForge. All rights reserved. Backtest. Replay. Improve.</p>
      </footer>
    </div>
  );
}
