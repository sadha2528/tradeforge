'use client';

import { PlatformLayout } from '@/components/layout/PlatformLayout';
import { MultiChartContainer } from '@/components/chart/MultiChartContainer';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export default function PlatformPage() {
  useKeyboardShortcuts();

  return (
    <PlatformLayout>
      <MultiChartContainer />
    </PlatformLayout>
  );
}
