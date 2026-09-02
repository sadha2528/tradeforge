import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'TradeForge | Backtest. Replay. Improve.',
  description: 'Professional trading backtesting platform. Replay historical markets, test strategies, and improve your trading.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>
          <TooltipProvider delay={200}>
            {children}
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
