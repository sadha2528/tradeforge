import { create } from 'zustand';
import type { Timeframe } from '@/types/market-data';
import type { DrawingTool, Drawing, ChartLayout, ChartTileConfig } from '@/types/chart';

interface ChartStore {
  activeSymbol: string;
  activeTimeframe: Timeframe;
  activeTool: DrawingTool | null;
  drawings: Drawing[];
  selectedDrawingId: string | null;
  chartMode: 'replay' | 'tradingview';

  // Multi-Chart Grid State
  layout: ChartLayout;
  activeTileIndex: number;
  tiles: ChartTileConfig[];

  setActiveSymbol: (symbol: string) => void;
  setActiveTimeframe: (timeframe: Timeframe) => void;
  setActiveTool: (tool: DrawingTool | null) => void;
  setChartMode: (mode: 'replay' | 'tradingview') => void;

  addDrawing: (drawing: Drawing) => void;
  updateDrawing: (id: string, updates: Partial<Drawing>) => void;
  deleteDrawing: (id: string) => void;
  toggleDrawingVisibility: (id: string) => void;
  clearDrawings: () => void;
  setSelectedDrawingId: (id: string | null) => void;

  setLayout: (layout: ChartLayout) => void;
  setActiveTileIndex: (index: number) => void;
  setTileTimeframe: (tileIndex: number, timeframe: Timeframe) => void;
  setTileSymbol: (tileIndex: number, symbol: string) => void;
}

export const useChartStore = create<ChartStore>((set) => ({
  activeSymbol: 'ES',
  activeTimeframe: '5m',
  activeTool: null,
  drawings: [],
  selectedDrawingId: null,
  chartMode: 'replay',

  layout: '1x1',
  activeTileIndex: 0,
  tiles: [
    { id: 'tile-0', symbol: 'ES', timeframe: '5m' },
    { id: 'tile-1', symbol: 'ES', timeframe: '15m' },
    { id: 'tile-2', symbol: 'ES', timeframe: '1h' },
    { id: 'tile-3', symbol: 'ES', timeframe: '1D' },
  ],

  setActiveSymbol: (symbol) =>
    set((state) => {
      const updatedTiles = state.tiles.map((t, idx) =>
        idx === state.activeTileIndex ? { ...t, symbol } : t
      );
      return { activeSymbol: symbol, tiles: updatedTiles };
    }),

  setActiveTimeframe: (timeframe) =>
    set((state) => {
      const updatedTiles = state.tiles.map((t, idx) =>
        idx === state.activeTileIndex ? { ...t, timeframe } : t
      );
      return { activeTimeframe: timeframe, tiles: updatedTiles };
    }),

  setActiveTool: (tool) => set({ activeTool: tool }),
  setChartMode: (mode) => set({ chartMode: mode }),

  addDrawing: (drawing) =>
    set((state) => ({
      drawings: [...state.drawings, drawing],
      selectedDrawingId: drawing.id,
    })),

  updateDrawing: (id, updates) =>
    set((state) => ({
      drawings: state.drawings.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),

  deleteDrawing: (id) =>
    set((state) => ({
      drawings: state.drawings.filter((d) => d.id !== id),
      selectedDrawingId: state.selectedDrawingId === id ? null : state.selectedDrawingId,
    })),

  toggleDrawingVisibility: (id) =>
    set((state) => ({
      drawings: state.drawings.map((d) =>
        d.id === id ? { ...d, visible: !d.visible } : d
      ),
    })),

  clearDrawings: () =>
    set({
      drawings: [],
      selectedDrawingId: null,
    }),

  setSelectedDrawingId: (id) => set({ selectedDrawingId: id }),

  setLayout: (layout) => set({ layout }),

  setActiveTileIndex: (index) =>
    set((state) => {
      const target = state.tiles[index];
      return {
        activeTileIndex: index,
        activeSymbol: target ? target.symbol : state.activeSymbol,
        activeTimeframe: target ? target.timeframe : state.activeTimeframe,
      };
    }),

  setTileTimeframe: (tileIndex, timeframe) =>
    set((state) => {
      const updated = state.tiles.map((t, idx) => (idx === tileIndex ? { ...t, timeframe } : t));
      return {
        tiles: updated,
        activeTimeframe: state.activeTileIndex === tileIndex ? timeframe : state.activeTimeframe,
      };
    }),

  setTileSymbol: (tileIndex, symbol) =>
    set((state) => {
      const updated = state.tiles.map((t, idx) => (idx === tileIndex ? { ...t, symbol } : t));
      return {
        tiles: updated,
        activeSymbol: state.activeTileIndex === tileIndex ? symbol : state.activeSymbol,
      };
    }),
}));
