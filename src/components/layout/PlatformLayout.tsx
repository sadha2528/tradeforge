'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { SessionBar } from './SessionBar';
import { ExecutionPanel } from './ExecutionPanel';
import { DOMWidget } from '@/components/orderflow/DOMWidget';
import { BottomPanel } from './BottomPanel';
import { ReplayBar } from './ReplayBar';
import { FloatingToolbar } from './FloatingToolbar';
import { useUIStore } from '@/store/ui-store';
import { useChartStore } from '@/store/chart-store';
import { CommandPaletteModal } from '@/components/modals/CommandPaletteModal';
import { ChartSettingsModal } from '@/components/modals/ChartSettingsModal';
import { ObjectTreeModal } from '@/components/modals/ObjectTreeModal';
import { PropFirmModal } from '@/components/modals/PropFirmModal';
import { JumpToDateModal } from '@/components/modals/JumpToDateModal';
import { Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatformLayoutProps {
  children: React.ReactNode;
}

export function PlatformLayout({ children }: PlatformLayoutProps) {
  const {
    showRightSidebar,
    setShowRightSidebar,
    showBottomPanel,
    rightSidebarWidth,
    setRightSidebarWidth,
    bottomPanelHeight,
    setBottomPanelHeight,
    isFullscreen,
    setIsFullscreen,
    isJumpToDateModalOpen,
    setJumpToDateModalOpen,
  } = useUIStore();

  const chartMode = useChartStore((s) => s.chartMode);
  const showDOM = useChartStore((s) => s.showDOM);
  const setShowDOM = useChartStore((s) => s.setShowDOM);

  const [rightPanelTab, setRightPanelTab] = useState<'execution' | 'dom'>('execution');

  useEffect(() => {
    if (showDOM) {
      setShowRightSidebar(true);
      setRightPanelTab('dom');
    }
  }, [showDOM, setShowRightSidebar]);

  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [isDraggingBottom, setIsDraggingBottom] = useState(false);

  const handleRightMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingRight(true);
  }, []);

  const handleBottomMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingBottom(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRight) {
        const newWidth = window.innerWidth - e.clientX;
        setRightSidebarWidth(Math.min(520, Math.max(220, newWidth)));
      }
      if (isDraggingBottom) {
        const newHeight = window.innerHeight - e.clientY;
        setBottomPanelHeight(Math.min(600, Math.max(120, newHeight)));
      }
    };
    const handleMouseUp = () => {
      setIsDraggingRight(false);
      setIsDraggingBottom(false);
    };

    if (isDraggingRight || isDraggingBottom) {
      document.body.style.cursor = isDraggingRight ? 'ew-resize' : 'ns-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingRight, isDraggingBottom, setRightSidebarWidth, setBottomPanelHeight]);

  // Keyboard shortcuts: F = fullscreen, Esc = exit fullscreen
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.key === 'F' || e.key === 'f') setIsFullscreen(true);
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setIsFullscreen]);

  const sidebarW = showRightSidebar ? (rightSidebarWidth || 280) : 0;
  const bottomH = showBottomPanel ? (bottomPanelHeight || 240) : 0;
  const replayBarH = 48; // px
  const sessionBarH = 44; // px

  if (isFullscreen) {
    return (
      <div className="h-screen w-screen bg-[#0b0e17] overflow-hidden flex flex-col text-gray-200 select-none relative">
        {/* Chart fullscreen */}
        <div className="flex-1 relative overflow-hidden bg-[#131722]">
          {children}
          <FloatingToolbar />
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-3 right-4 z-50 bg-[#0f1421]/90 hover:bg-[#161c2b] border border-[#1e2535] text-gray-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 shadow-xl backdrop-blur-sm transition cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit Fullscreen (Esc)</span>
          </button>
        </div>
        {/* Minimal replay strip always visible */}
        <div className="shrink-0" style={{ height: replayBarH }}>
          <ReplayBar />
        </div>
        <CommandPaletteModal />
        <ChartSettingsModal />
        <ObjectTreeModal />
        <PropFirmModal />
        <JumpToDateModal isOpen={isJumpToDateModalOpen} onClose={() => setJumpToDateModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#0b0e17] overflow-hidden flex flex-col text-gray-200 select-none">

      {/* ── ROW 1: Session Bar ── */}
      <div className="shrink-0" style={{ height: sessionBarH }}>
        <SessionBar />
      </div>

      {/* ── ROW 2: Main workspace (chart + right panel) ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Chart Area ── */}
        <div className="flex flex-col flex-1 overflow-hidden relative">
          {/* Chart fills all remaining vertical space above bottom panel */}
          <div
            className="flex-1 relative overflow-hidden bg-[#131722]"
            style={{ minHeight: 0 }}
          >
            {children}

            {/* Floating drawing toolbar */}
            <FloatingToolbar />

            {/* Bottom drag handle */}
            {showBottomPanel && (
              <div
                onMouseDown={handleBottomMouseDown}
                className="absolute bottom-0 left-0 right-0 h-1.5 hover:h-2 bg-transparent hover:bg-blue-500/30 cursor-ns-resize transition-all z-20 flex items-center justify-center group"
              >
                <div className="w-12 h-1 rounded-full bg-[#252d40] group-hover:bg-blue-400 transition" />
              </div>
            )}
          </div>

          {/* Bottom analytics panel */}
          {showBottomPanel && (
            <div
              className="shrink-0 overflow-hidden bg-[#0c1018] border-t border-[#1e2333]"
              style={{ height: bottomH }}
            >
              <BottomPanel />
            </div>
          )}
        </div>

        {/* ── Right Panel: Execution or DOM Ladder ── */}
        {showRightSidebar && (
          <div
            className="shrink-0 flex flex-col relative overflow-hidden border-l border-[#1e2333] bg-[#0c1018]"
            style={{ width: sidebarW }}
          >
            {/* Left drag handle */}
            <div
              onMouseDown={handleRightMouseDown}
              className="absolute left-0 top-0 bottom-0 w-1 hover:w-1.5 bg-transparent hover:bg-blue-500/30 cursor-ew-resize z-20 flex items-center justify-center group"
            >
              <div className="h-12 w-0.5 rounded-full bg-[#252d40] group-hover:bg-blue-400 transition" />
            </div>

            {/* Panel Mode Switcher Tabs */}
            <div className="flex items-center justify-between px-2 py-1.5 bg-[#0f1422] border-b border-[#1b2234] shrink-0 text-xs font-mono">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setRightPanelTab('execution');
                    if (showDOM) setShowDOM(false);
                  }}
                  className={cn(
                    'px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer',
                    rightPanelTab === 'execution'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  Order Entry
                </button>
                <button
                  onClick={() => {
                    setRightPanelTab('dom');
                    if (!showDOM) setShowDOM(true);
                  }}
                  className={cn(
                    'px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1',
                    rightPanelTab === 'dom'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  <span>DOM Ladder</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden pl-0.5">
              {rightPanelTab === 'dom' ? (
                <DOMWidget onClose={() => setShowRightSidebar(false)} />
              ) : (
                <ExecutionPanel />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── ROW 3: Replay Bar (always pinned to bottom) ── */}
      <div className="shrink-0" style={{ height: replayBarH }}>
        <ReplayBar />
      </div>

      {/* Global Modals */}
      <CommandPaletteModal />
      <ChartSettingsModal />
      <ObjectTreeModal />
      <PropFirmModal />
      <JumpToDateModal isOpen={isJumpToDateModalOpen} onClose={() => setJumpToDateModalOpen(false)} />
    </div>
  );
}
