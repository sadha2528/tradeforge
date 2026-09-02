import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PanelTab } from '@/types/common';

interface UIStore {
  // Panel visibility & sizes
  showRightSidebar: boolean;
  showBottomPanel: boolean;
  bottomPanelTab: PanelTab;
  bottomPanelHeight: number;
  rightSidebarWidth: number;
  isFullscreen: boolean;

  // Modals state
  isCommandPaletteOpen: boolean;
  isChartSettingsOpen: boolean;
  isObjectTreeOpen: boolean;
  isPropFirmModalOpen: boolean;
  isCalendarModalOpen: boolean;

  // Actions
  toggleRightSidebar: () => void;
  setShowRightSidebar: (show: boolean) => void;
  toggleBottomPanel: () => void;
  setShowBottomPanel: (show: boolean) => void;
  setBottomPanelTab: (tab: PanelTab) => void;
  setBottomPanelHeight: (height: number) => void;
  setRightSidebarWidth: (width: number) => void;
  toggleFullscreen: () => void;
  setIsFullscreen: (val: boolean) => void;

  setCommandPaletteOpen: (open: boolean) => void;
  setChartSettingsOpen: (open: boolean) => void;
  setObjectTreeOpen: (open: boolean) => void;
  setPropFirmModalOpen: (open: boolean) => void;
  setCalendarModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      showRightSidebar: true,
      showBottomPanel: true,
      bottomPanelTab: 'positions',
      bottomPanelHeight: 240,
      rightSidebarWidth: 320,
      isFullscreen: false,

      isCommandPaletteOpen: false,
      isChartSettingsOpen: false,
      isObjectTreeOpen: false,
      isPropFirmModalOpen: false,
      isCalendarModalOpen: false,

      toggleRightSidebar: () => set((state) => ({ showRightSidebar: !state.showRightSidebar })),
      setShowRightSidebar: (show) => set({ showRightSidebar: show }),
      toggleBottomPanel: () => set((state) => ({ showBottomPanel: !state.showBottomPanel })),
      setShowBottomPanel: (show) => set({ showBottomPanel: show }),
      setBottomPanelTab: (tab) => set({ bottomPanelTab: tab }),
      setBottomPanelHeight: (height) =>
        set({ bottomPanelHeight: Math.min(600, Math.max(120, height)) }),
      setRightSidebarWidth: (width) =>
        set({ rightSidebarWidth: Math.min(560, Math.max(240, width)) }),
      toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
      setIsFullscreen: (val) => set({ isFullscreen: val }),

      setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
      setChartSettingsOpen: (open) => set({ isChartSettingsOpen: open }),
      setObjectTreeOpen: (open) => set({ isObjectTreeOpen: open }),
      setPropFirmModalOpen: (open) => set({ isPropFirmModalOpen: open }),
      setCalendarModalOpen: (open) => set({ isCalendarModalOpen: open }),
    }),
    {
      name: 'tradeforge-ui-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        showRightSidebar: state.showRightSidebar,
        showBottomPanel: state.showBottomPanel,
        bottomPanelHeight: state.bottomPanelHeight,
        rightSidebarWidth: state.rightSidebarWidth,
        bottomPanelTab: state.bottomPanelTab,
      }),
    }
  )
);
