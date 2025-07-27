import {
  createChart,
  ColorType,
  CrosshairMode,
  IChartApi,
  UTCTimestamp,
  CandlestickData,
} from "lightweight-charts";

export class ChartManager {
  private chart: IChartApi;
  private candleSeries: any; // fallback type
  private lastUpdateTime: number = 0;

  constructor(
    ref: HTMLDivElement,
    initialData: CandlestickData[],
    layout: { background: string; color: string }
  ) {
    this.chart = createChart(ref, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: layout.background },
        textColor: layout.color,
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        visible: true,
        ticksVisible: true,
        entireTextOnly: true,
      },
      overlayPriceScales: {
        ticksVisible: true,
        borderVisible: true,
      },
      grid: {
        horzLines: { visible: false },
        vertLines: { visible: false },
      },
    });


    this.candleSeries = (this.chart as any).addCandlestickSeries();

    this.candleSeries.setData(initialData);
  }

  public update(updatePrice: {
    open: number;
    high: number;
    low: number;
    close: number;
  }) {
    if (!this.lastUpdateTime) {
      this.lastUpdateTime = Math.floor(Date.now() / 1000);
    }

    this.candleSeries.update({
      time: this.lastUpdateTime as UTCTimestamp,
      ...updatePrice,
    });
  }

  public destroy() {
    this.chart.remove();
  }
}
