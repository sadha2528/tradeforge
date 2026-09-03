'use client';

import React, { useEffect, useRef } from 'react';

interface TradingViewAdvancedWidgetProps {
  symbol?: string;
  timeframe?: string;
  theme?: 'dark' | 'light';
  autosize?: boolean;
}

// Maps internal symbols to TradingView symbols
function mapToTradingViewSymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  switch (upper) {
    case 'ES':
      return 'CME_MINI:ES1!';
    case 'MES':
      return 'CME_MINI:MES1!';
    case 'NQ':
      return 'CME_MINI:NQ1!';
    case 'MNQ':
      return 'CME_MINI:MNQ1!';
    case 'YM':
      return 'CBOT_MINI:YM1!';
    case 'MYM':
      return 'CBOT_MINI:MYM1!';
    case 'RTY':
      return 'CME_MINI:RTY1!';
    case 'M2K':
      return 'CME_MINI:M2K1!';
    case 'GC':
      return 'COMEX:GC1!';
    case 'CL':
      return 'NYMEX:CL1!';
    case 'EURUSD':
      return 'FX:EURUSD';
    case 'GBPUSD':
      return 'FX:GBPUSD';
    case 'USDJPY':
      return 'FX:USDJPY';
    case 'BTCUSD':
      return 'BINANCE:BTCUSDT';
    case 'ETHUSD':
      return 'BINANCE:ETHUSDT';
    default:
      return `CME_MINI:${upper}1!`;
  }
}

// Maps timeframe string to TradingView interval format
function mapToTradingViewInterval(timeframe: string): string {
  switch (timeframe) {
    case '1m':
      return '1';
    case '5m':
      return '5';
    case '15m':
      return '15';
    case '30m':
      return '30';
    case '1h':
      return '60';
    case '4h':
      return '240';
    case '1D':
      return 'D';
    default:
      return '5';
  }
}

export function TradingViewAdvancedWidget({
  symbol = 'ES',
  timeframe = '5m',
  theme = 'dark',
  autosize = true,
}: TradingViewAdvancedWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      if (typeof (window as unknown as { TradingView?: { widget: new (config: Record<string, unknown>) => void } }).TradingView !== 'undefined') {
        const tvSymbol = mapToTradingViewSymbol(symbol);
        const tvInterval = mapToTradingViewInterval(timeframe);

        new (window as unknown as { TradingView: { widget: new (config: Record<string, unknown>) => void } }).TradingView.widget({
          autosize,
          symbol: tvSymbol,
          interval: tvInterval,
          timezone: 'America/New_York',
          theme,
          style: '1',
          locale: 'en',
          toolbar_bg: '#131722',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: container.id,
          hide_side_toolbar: false,
          withdateranges: true,
          details: true,
          hotlist: true,
          calendar: true,
          studies: ['STD;EMA', 'STD;SMA', 'STD;RSI'],
          disabled_features: ['use_localstorage_for_settings'],
          enabled_features: ['study_templates'],
        });
      }
    };

    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol, timeframe, theme, autosize]);

  return (
    <div className="w-full h-full relative bg-[#131722]">
      <div
        id={`tradingview_${Math.random().toString(36).substring(7)}`}
        ref={containerRef}
        className="w-full h-full"
      />
    </div>
  );
}
