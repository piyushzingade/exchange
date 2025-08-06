// "use client";

// import { useEffect, useRef, useState } from "react";
// import {
//   CandlestickData,
//   CandlestickSeries,
//   createChart,
//   IChartApi,
//   ISeriesApi,
//   Time,
//   WhitespaceData,
// } from "lightweight-charts";
// import { Candle } from "@/utils/types";
// import { getKlines } from "@/utils/httpClient";
// import { SignalingManager } from "@/utils/SignalingManager";
// // ConnectionManager is actually SignalingManager

// export const TradeView = ({ market }: { market: string }) => {
//   const chartContainerRef = useRef<HTMLDivElement>(null);
//   const chartRef = useRef<IChartApi | null>(null);
//   const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
//   const [candles, setCandles] = useState<Candle[]>([]);

//   // Initialize chart once
//   useEffect(() => {
//     if (!chartContainerRef.current || chartRef.current) return;

//     const chart: IChartApi = createChart(chartContainerRef.current, {
//       width: chartContainerRef.current.clientWidth,
//       height: 500,
//       layout: {
//         background: { color: "#1e1e1e" },
//         textColor: "white",
//       },
//       grid: {
//         vertLines: { color: "#444c56" },
//         horzLines: { color: "#3a3f4b" },
//       },
//     });

//     const candlestickSeries: ISeriesApi<"Candlestick"> =
//       chart.addSeries(CandlestickSeries);

//     chartRef.current = chart;
//     seriesRef.current = candlestickSeries;

//     const handleResize = () => {
//       if (chartRef.current && chartContainerRef.current) {
//         chartRef.current.applyOptions({
//           width: chartContainerRef.current.clientWidth,
//         });
//       }
//     };

//     window.addEventListener("resize", handleResize);

//     return () => {
//       window.removeEventListener("resize", handleResize);
//       if (chartRef.current) {
//         chartRef.current.remove();
//         chartRef.current = null;
//         seriesRef.current = null;
//       }
//     };
//   }, []);

//   // Update chart data when candles change
//   useEffect(() => {
//     if (!seriesRef.current || candles.length === 0) return;

//     const formatted = candles.map((c) => ({
//       time: c.time,
//       open: c.open,
//       high: c.high,
//       low: c.low,
//       close: c.close,
//     })) as (CandlestickData<Time> | WhitespaceData<Time>)[];

//     seriesRef.current.setData(formatted);
//   }, [candles]);

//   // Fetch initial data and setup websocket
//   useEffect(() => {
//     // Fetch initial klines data
//     // You need to provide the missing parameters: interval, startTime, endTime
//     const now = Date.now();
//     const oneDayAgo = now - 24 * 60 * 60 * 1000; // 1 day ago

//     getKlines(market)
//       .then((klines) => {
//         // Convert KLine[] to Candle[] if they have different structures
//         const convertedCandles: Candle[] = klines.map((kline) => ({
//             //@ts-ignore
//           time: kline.time || kline.openTime, // Adjust based on your KLine structure
//           open: parseFloat(String(kline.open)),
//           high: parseFloat(String(kline.high)),
//           low: parseFloat(String(kline.low)),
//           close: parseFloat(String(kline.close)),
//           isClosed: true, 
//         }));
//         setCandles(convertedCandles);
//       })
//       .catch((error) => {
//         console.error("Error fetching initial klines:", error);
//       });

//     // Setup websocket subscription
//     SignalingManager.getInstance().registerCallback(
//       "kline",
//       (data: Partial<Candle>) => {
//         console.log("Received kline data:", data);

//         if (
//           !data.time ||
//           !data.open ||
//           !data.high ||
//           !data.low ||
//           !data.close
//         ) {
//           console.warn("Incomplete kline data received:", data);
//           return;
//         }

//         const parsedCandle: Candle = {
//           time: data.time,
//           open: parseFloat(String(data.open)),
//           high: parseFloat(String(data.high)),
//           low: parseFloat(String(data.low)),
//           close: parseFloat(String(data.close)),
//           isClosed: data.isClosed || false,
//         };

//         setCandles((prevCandles) => {
//           const updatedCandles = [...prevCandles];
//           const lastCandle = updatedCandles[updatedCandles.length - 1];

//           if (lastCandle && lastCandle.time === parsedCandle.time) {
//             // Update existing candle
//             updatedCandles[updatedCandles.length - 1] = parsedCandle;
//           } else if (!lastCandle || parsedCandle.time > lastCandle.time) {
//             // Add new candle
//             updatedCandles.push(parsedCandle);

//             // Optional: Limit array size to prevent memory issues
//             if (updatedCandles.length > 1000) {
//               updatedCandles.shift();
//             }
//           } else {
//             console.warn(
//               "Kline stream: Received an out-of-order candle:",
//               parsedCandle
//             );
//           }

//           return updatedCandles;
//         });
//       },
//       market
//     );

//     // Subscribe to websocket stream
//     SignalingManager.getInstance().sendMessage({
//       method: "SUBSCRIBE",
//       params: [`${market.toLowerCase()}@kline_1h`],
//     });

//     return () => {
//       // Cleanup websocket subscription
//       SignalingManager.getInstance().deRegisterCallback("kline", market); // Fixed: use "kline" consistently
//       SignalingManager.getInstance().sendMessage({
//         method: "UNSUBSCRIBE",
//         params: [`${market.toLowerCase()}@kline_1h`],
//       });
//     };
//   }, [market]);

//   return (
//     <div className="pr-2 h-full">
//       <div ref={chartContainerRef} className="h-full pt-4 w-full rounded-md" />
//     </div>
//   );
// };
