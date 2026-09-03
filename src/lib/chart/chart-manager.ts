import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createSeriesMarkers,
} from 'lightweight-charts';
import type {
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  LineData,
  Time,
  IPriceLine,
  SeriesMarker,
  UTCTimestamp,
  ISeriesMarkersPluginApi,
} from 'lightweight-charts';
import { CHART_COLORS } from '@/config/constants';

export interface ChartManagerOptions {
  container: HTMLElement;
  width?: number;
  height?: number;
  watermarkText?: string;
}

export class ChartManager {
  private chart: IChartApi;
  private candleSeries: ISeriesApi<'Candlestick'>;
  private volumeSeries: ISeriesApi<'Histogram'>;
  private priceLines: Map<string, IPriceLine> = new Map();
  private indicatorSeries: Map<string, ISeriesApi<'Line'>> = new Map();
  private markersPlugin: ISeriesMarkersPluginApi<Time> | null = null;

  constructor(options: ChartManagerOptions) {
    this.chart = createChart(options.container, {
      width: options.width,
      height: options.height,
      layout: {
        background: { type: ColorType.Solid, color: CHART_COLORS.background },
        textColor: CHART_COLORS.text,
        fontFamily: "'Trebuchet MS', Roboto, Ubuntu, -apple-system, sans-serif",
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid, style: LineStyle.Solid },
        horzLines: { color: CHART_COLORS.grid, style: LineStyle.Solid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: CHART_COLORS.crosshair,
          width: 1,
          style: LineStyle.Dashed,
          visible: true,
          labelVisible: true,
          labelBackgroundColor: CHART_COLORS.crosshairLabel,
        },
        horzLine: {
          color: CHART_COLORS.crosshair,
          width: 1,
          style: LineStyle.Dashed,
          visible: true,
          labelVisible: true,
          labelBackgroundColor: CHART_COLORS.crosshairLabel,
        },
      },
      timeScale: {
        borderColor: CHART_COLORS.grid,
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 8,
        minBarSpacing: 2,
        rightOffset: 12,
      },
      rightPriceScale: {
        borderColor: CHART_COLORS.grid,
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
    });

    // Authentic TradingView Candlestick Series Configuration
    this.candleSeries = this.chart.addSeries(CandlestickSeries, {
      upColor: CHART_COLORS.candleUp,
      downColor: CHART_COLORS.candleDown,
      borderVisible: true,
      borderColor: CHART_COLORS.candleUp,
      borderUpColor: CHART_COLORS.candleUp,
      borderDownColor: CHART_COLORS.candleDown,
      wickVisible: true,
      wickUpColor: CHART_COLORS.candleUp,
      wickDownColor: CHART_COLORS.candleDown,
    });

    // Authentic TradingView Volume Overlay
    this.volumeSeries = this.chart.addSeries(HistogramSeries, {
      color: CHART_COLORS.volume,
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // overlay on main chart
    });

    // Scale volume to take up 18% of the chart bottom
    this.chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },
    });

    try {
      this.markersPlugin = createSeriesMarkers(this.candleSeries, []) as ISeriesMarkersPluginApi<Time>;
    } catch {
      // Fallback
    }
  }

  setPricePrecision(precision: number, minMove: number = 0.01): void {
    this.candleSeries.applyOptions({
      priceFormat: {
        type: 'price',
        precision,
        minMove,
      },
    });
  }

  setData(candles: CandlestickData<Time>[], volumes?: HistogramData<Time>[]): void {
    this.candleSeries.setData(candles);
    if (volumes) {
      this.volumeSeries.setData(volumes);
    }
  }

  updateLastCandle(candle: CandlestickData<Time>, volume?: HistogramData<Time>): void {
    this.candleSeries.update(candle);
    if (volume) {
      this.volumeSeries.update(volume);
    }
  }

  appendCandle(candle: CandlestickData<Time>, volume?: HistogramData<Time>): void {
    this.candleSeries.update(candle);
    if (volume) {
      this.volumeSeries.update(volume);
    }
  }

  // Indicator Line Series Management
  addIndicatorSeries(id: string, color: string, lineWidth: number = 2): ISeriesApi<'Line'> {
    let series = this.indicatorSeries.get(id);
    if (series) {
      series.applyOptions({ color, lineWidth: lineWidth as 1 | 2 | 3 | 4 });
      return series;
    }

    series = this.chart.addSeries(LineSeries, {
      color,
      lineWidth: lineWidth as 1 | 2 | 3 | 4,
      crosshairMarkerVisible: true,
      priceLineVisible: false,
      lastValueVisible: true,
    });
    this.indicatorSeries.set(id, series);
    return series;
  }

  setIndicatorData(id: string, data: LineData<Time>[]): void {
    const series = this.indicatorSeries.get(id);
    if (series) {
      series.setData(data);
    }
  }

  removeIndicatorSeries(id: string): void {
    const series = this.indicatorSeries.get(id);
    if (series) {
      this.chart.removeSeries(series);
      this.indicatorSeries.delete(id);
    }
  }

  removeAllIndicatorSeries(): void {
    for (const series of this.indicatorSeries.values()) {
      this.chart.removeSeries(series);
    }
    this.indicatorSeries.clear();
  }

  setMarkers(markers: SeriesMarker<UTCTimestamp>[]): void {
    if (this.markersPlugin) {
      this.markersPlugin.setMarkers(markers as unknown as SeriesMarker<Time>[]);
    } else if (typeof (this.candleSeries as unknown as { setMarkers?: (m: typeof markers) => void }).setMarkers === 'function') {
      (this.candleSeries as unknown as { setMarkers: (m: typeof markers) => void }).setMarkers(markers);
    }
  }

  addPriceLine(id: string, price: number, color: string, title: string, lineStyle: number = LineStyle.Solid): void {
    if (this.priceLines.has(id)) {
      this.updatePriceLine(id, price);
      return;
    }

    const priceLine = this.candleSeries.createPriceLine({
      price,
      color,
      lineWidth: 2,
      lineStyle,
      axisLabelVisible: true,
      title,
    });
    this.priceLines.set(id, priceLine);
  }

  updatePriceLine(id: string, price: number): void {
    const priceLine = this.priceLines.get(id);
    if (priceLine) {
      priceLine.applyOptions({ price });
    }
  }

  removePriceLine(id: string): void {
    const priceLine = this.priceLines.get(id);
    if (priceLine) {
      this.candleSeries.removePriceLine(priceLine);
      this.priceLines.delete(id);
    }
  }

  removeAllPriceLines(): void {
    for (const priceLine of this.priceLines.values()) {
      this.candleSeries.removePriceLine(priceLine);
    }
    this.priceLines.clear();
  }

  // Coordinate Conversion Helpers for Drawing Tools
  timeToCoordinate(timestampMs: number): number | null {
    const timeInSec = (timestampMs / 1000) as UTCTimestamp;
    const coord = this.chart.timeScale().timeToCoordinate(timeInSec);
    return coord !== null ? (coord as unknown as number) : null;
  }

  coordinateToTime(x: number): number | null {
    const timeInSec = this.chart.timeScale().coordinateToTime(x);
    return timeInSec !== null ? Number(timeInSec) * 1000 : null;
  }

  priceToCoordinate(price: number): number | null {
    const coord = this.candleSeries.priceToCoordinate(price);
    return coord !== null ? (coord as unknown as number) : null;
  }

  coordinateToPrice(y: number): number | null {
    const price = this.candleSeries.coordinateToPrice(y);
    return price !== null ? (price as unknown as number) : null;
  }

  getChartApi(): IChartApi {
    return this.chart;
  }

  getCandleSeries(): ISeriesApi<'Candlestick'> {
    return this.candleSeries;
  }

  fitContent(): void {
    this.chart.timeScale().fitContent();
  }

  scrollToLatest(): void {
    this.chart.timeScale().scrollToRealTime();
  }

  resize(width: number, height: number): void {
    this.chart.resize(width, height);
  }

  dispose(): void {
    this.removeAllPriceLines();
    this.removeAllIndicatorSeries();
    this.chart.remove();
  }
}
