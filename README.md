# 📈 TradeForge

> **Professional, Futures-First Market Replay & Backtesting Workstation**

TradeForge is a high-performance backtesting and market replay platform designed specifically for institutional and retail futures traders. Replay historical markets candle-by-candle with zero lookahead bias, practice position sizing, test prop-firm challenge rules, and track quantitative performance metrics.

---

## ✨ Features

- **Futures-First Architecture**: Native contract specifications, tick sizes, and point values for `ES`, `MES`, `NQ`, `MNQ`, `YM`, `MYM`, `RTY`, `M2K`, `GC`, `CL`, Forex, and Crypto.
- **Tick-Accurate Historical Replay**: Speeds from `0.25x` to `100x`, historical Eastern Time (`ET`) timestamps, timeline scrubber, and session open presets (NY Open, London Open, CME Futures).
- **Interactive Risk Management**: TradingView-style Long & Short Position tools with draggable Entry, Stop Loss, and Take Profit lines, live R:R ratio calculation, and automatic contract sizing based on % Risk or Fixed $ Risk.
- **Scale-Out Partial Exits**: Execute partial closes (`25%`, `50%`, `75%`, `100%`) with automatic risk reallocation and residual position tracking.
- **Prop Firm Challenge Tracker**: Real-time evaluation of $50k, $100k, and $150k prop firm rules including Profit Targets, Daily Loss Limits, and Max Trailing Drawdowns.
- **Quantitative Performance Analytics**: Expected Value (EV), Sharpe Ratio, Sortino Ratio, Profit Factor, Win Rate, SVG Equity Curve, and Underwater Drawdown graphs.
- **P&L Trading Calendar**: Monthly heatmap calendar with daily net profit/loss coloring and 1-click trade inspection.
- **Trade Journal & Object Tree**: Comprehensive journaling with setup names, emotion tags, 5-star ratings, notes, and an object hierarchy manager.
- **Command Palette (<kbd>Cmd+K</kbd> / <kbd>Ctrl+K</kbd>)**: Institutional quick-action search for symbols, timeframes, tools, and commands.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Language**: TypeScript (Strict Mode)
- **Charting**: TradingView Lightweight Charts v5
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Database & ORM**: Prisma + SQLite / PostgreSQL
- **Audio Engine**: Web Audio API Sound Synthesis

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/sadha2528/tradeforge.git
cd tradeforge
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```

Open [http://localhost:3000/platform](http://localhost:3000/platform) in your browser.

### 4. Run automated test suite
```bash
npx tsx tests/trading-engine.test.ts
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Play / Pause Replay |
| <kbd>→</kbd> | Step Forward 1 Candle |
| <kbd>Shift</kbd> + <kbd>→</kbd> | Step Forward 5 Candles |
| <kbd>←</kbd> | Step Backward 1 Candle |
| <kbd>R</kbd> | Restart Replay from Beginning |
| <kbd>Cmd</kbd> + <kbd>K</kbd> | Open Command Palette |
| <kbd>F</kbd> | Toggle Fullscreen Chart |
| <kbd>T</kbd> | Trendline Tool |
| <kbd>H</kbd> | Horizontal Line Tool |
| <kbd>P</kbd> | Long Position Tool |
| <kbd>M</kbd> | Measure Ruler Tool |
| <kbd>Esc</kbd> | Reset / Crosshair Mode |

---

## 📄 License

MIT License. Designed with original implementation and branding.
