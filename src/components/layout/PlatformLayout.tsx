'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { TopBar } from './TopBar';
import { LeftToolbar } from './LeftToolbar';
import { RightSidebar } from './RightSidebar';
import { BottomPanel } from './BottomPanel';
import { useUIStore } from '@/store/ui-store';
import { CommandPaletteModal } from '@/components/modals/CommandPaletteModal';
import { ChartSettingsModal } from '@/components/modals/ChartSettingsModal';
import { ObjectTreeModal } from '@/components/modals/ObjectTreeModal';
import { PropFirmModal } from '@/components/modals/PropFirmModal';
import { Maximize2, Minimize2, ChevronRight, ChevronDown, ChevronUp, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatformLayoutProps {
  children: React.ReactNode;
}

export function PlatformLayout({ children }: PlatformLayoutProps) {
  const {
    showRightSidebar,
    setShowRightSidebar,
    showBottomPanel,
    setShowBottomPanel,
    rightSidebarWidth,
    setRightSidebarWidth,
    bottomPanelHeight,
    setBottomPanelHeight,
    isFullscreen,
    setIsFullscreen,
  } = useUIStore();

  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [isDraggingBottom, setIsDraggingBottom] = useState(false);

  // Handle right sidebar horizontal mouse-drag resizing
  const handleRightMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingRight(true);
  }, []);

  // Handle bottom panel vertical mouse-drag resizing
  const handleBottomMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingBottom(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRight) {
        const newWidth = window.innerWidth - e.clientX;
        setRightSidebarWidth(newWidth);
      }
      if (isDraggingBottom) {
        const newHeight = window.innerHeight - e.clientY;
        setBottomPanelHeight(newHeight);
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

  return (
    <div
      className={cn(
        'h-screen w-screen bg-[#0a0e17] overflow-hidden grid text-gray-200 select-none relative',
        isFullscreen ? 'grid-rows-[44px_1fr] grid-cols-[40px_1fr]' : ''
      )}
      style={
        !isFullscreen
          ? {
              gridTemplateRows: `48px 1fr ${showBottomPanel ? (bottomPanelHeight || 240) + 'px' : '0px'}`,
              gridTemplateColumns: `40px 1fr ${showRightSidebar ? (rightSidebarWidth || 320) + 'px' : '0px'}`,
            }
          : undefined
      }
    >
      {/* TopBar - spans full width */}
      <div className={cn(isFullscreen ? 'col-span-2 row-span-1' : 'col-span-3 row-span-1')}>
        <TopBar />
      </div>

      {/* LeftToolbar */}
      <div className="col-start-1 row-start-2 row-span-2">
        <LeftToolbar />
      </div>

      {/* Main Chart Area */}
      <div className="col-start-2 row-start-2 bg-[#070a12] relative overflow-hidden flex flex-col">
        {children}

        {/* Floating Fullscreen Exit Button */}
        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-3 right-4 z-40 bg-[#121828]/90 hover:bg-[#1a233a] border border-[#202c44] text-gray-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 shadow-xl backdrop-blur-xs transition cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit Fullscreen (Esc)</span>
          </button>
        )}

        {/* Bottom Resizer Bar & Collapse Handle */}
        {!isFullscreen && showBottomPanel && (
          <div
            onMouseDown={handleBottomMouseDown}
            className="absolute bottom-0 left-0 right-0 h-1.5 hover:h-2 bg-transparent hover:bg-blue-500/40 cursor-ns-resize transition-all z-30 flex items-center justify-center group"
          >
            <div className="w-12 h-1 bg-gray-600 rounded-full group-hover:bg-blue-400 opacity-60" />
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      {!isFullscreen && showRightSidebar && (
        <div className="col-start-3 row-start-2 row-span-2 overflow-hidden flex relative bg-[#0a0e17]">
          {/* Left Horizontal Resizer Handle */}
          <div
            onMouseDown={handleRightMouseDown}
            className="w-1.5 hover:w-2 h-full bg-transparent hover:bg-blue-500/40 cursor-ew-resize transition-all z-30 flex items-center justify-center absolute left-0 top-0 bottom-0 group"
          >
            <div className="h-12 w-1 bg-gray-600 rounded-full group-hover:bg-blue-400 opacity-60" />
          </div>
          <div className="flex-1 overflow-hidden">
            <RightSidebar />
          </div>
        </div>
      )}

      {/* Bottom Panel */}
      {!isFullscreen && showBottomPanel && (
        <div className="col-start-2 row-start-3 overflow-hidden bg-[#0a0e17]">
          <BottomPanel />
        </div>
      )}

      {/* Global Modals */}
      <CommandPaletteModal />
      <ChartSettingsModal />
      <ObjectTreeModal />
      <PropFirmModal />
    </div>
  );
}
