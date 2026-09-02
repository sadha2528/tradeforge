import type { ReplaySpeed } from '@/types/common';

export class ReplayEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private onTick: (() => void) | null = null;
  private speed: ReplaySpeed = 1;

  /**
   * Calculate the interval delay in ms for a given speed.
   * 1x = 1000ms (1 candle per second)
   * 2x = 500ms
   * 5x = 200ms
   * 10x = 100ms
   * 20x = 50ms
   * 50x = 20ms  
   * 100x = 16ms (roughly 60fps cap)
   */
  private getIntervalMs(): number {
    return Math.max(16, Math.floor(1000 / this.speed));
  }

  setOnTick(callback: () => void): void {
    this.onTick = callback;
  }

  setSpeed(speed: ReplaySpeed): void {
    this.speed = speed;
    if (this.isRunning()) {
      this.stop();
      this.start();
    }
  }

  start(): void {
    if (this.isRunning()) return;
    
    this.intervalId = setInterval(() => {
      if (this.onTick) {
        this.onTick();
      }
    }, this.getIntervalMs());
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }

  dispose(): void {
    this.stop();
    this.onTick = null;
  }
}
