import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

export const metadata: Metadata = {
  title: 'TradeForge | Backtest. Replay. Improve.',
  description: 'Professional trading backtesting platform. Replay historical markets, test strategies, and improve your trading.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <QueryProvider>
          <TooltipProvider delay={200}>
            {children}
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
