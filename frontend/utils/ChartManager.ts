import {
  ColorType,
  createChart as createLightWeightChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
} from "lightweight-charts";

export class ChartManager {
  private candleSeries: ISeriesApi<"Candlestick">;
  private lastUpdateTime: number = 0;
  private chart: any;
  private currentBar: {
    high: number | null;
    open: number | null;
    low: number | null;
    close: number | null;
  } = {
    high: null,
    open: null,
    close: null,
    low: null,
  };

  constructor(
    ref: any,
    initialData: any[],
    layout: { background: string; color: string }
  ) {
    const chart = createLightWeightChart(ref, {
      autoSize: true,
      overlayPriceScales: {
        ticksVisible: true,
        borderVisible: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        visible: true,
        ticksVisible: true,
        entireTextOnly: true,
      },
      grid: {
        horzLines: {
          visible: false,
        },
        vertLines: {
          visible: false,
        },
      },
      layout: {
        background: {
          type: ColorType.Solid,
          color: layout.background,
        },
        textColor: "white",
      },
    });
    this.chart = chart;
    // Type-cast to fix TS temporarily
    this.candleSeries = (chart as any).addCandlestickSeries();

    this.candleSeries.setData(
      initialData.map((data) => ({
        ...data,
        time: (data.timestamp / 1000) as UTCTimestamp,
      }))
    );
  }

  public update(updatePrice : any){
    if(!this.lastUpdateTime){
        this.lastUpdateTime =  new Date().getTime();
    }

    this.candleSeries.update({
        time : this.lastUpdateTime /1000 as UTCTimestamp,
        high: updatePrice.high,
        low:updatePrice.low,
        close: updatePrice.close,
        open:updatePrice.open
    })
  }
  public destroy() {
    this.chart.remove();
  }
}
