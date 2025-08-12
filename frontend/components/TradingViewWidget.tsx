// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";

// // Valid interval types for TradingView widget
// type TradingViewInterval =
//   | "1"
//   | "3"
//   | "5"
//   | "15"
//   | "30"
//   | "60"
//   | "120"
//   | "180"
//   | "240"
//   | "D"
//   | "W";

// interface TradingViewWidgetProps {
//   market: string;
//   theme?: "light" | "dark";
//   interval?: TradingViewInterval;
//   width?: string | number;
//   height?: string | number;
//   autosize?: boolean;
// }

// export default function TradingViewWidget({
//   market,
//   theme = "dark",
//   interval = "60",
//   width = "100%",
//   height = 520,
//   autosize = true,
// }: TradingViewWidgetProps) {
//   const [isClient, setIsClient] = useState(false);
//   const containerRef = useRef<HTMLDivElement>(null);

//   // Ensure component only renders on client side
//   useEffect(() => {
//     setIsClient(true);
//   }, []);

//   // Convert market format if needed (e.g., "BTC-USD" to "BTCUSD")
//   const formatSymbol = (symbol: string): string => {
//     if (!symbol) return "BTCUSDC"; // Default fallback
//     // Remove common separators and convert to uppercase
//     return symbol.replace(/[-_]/g, "").toUpperCase();
//   };

//   const formattedSymbol = formatSymbol(market);

//   // Don't render on server side
//   if (!isClient) {
//     return (
//       <div
//         className="mt-4 w-full flex items-center justify-center bg-gray-900"
//         style={{ height: typeof height === "number" ? `${height}px` : height }}
//       >
//         <div className="text-white">Loading chart...</div>
//       </div>
//     );
//   }

//   return (
//     <div
//       ref={containerRef}
//       className="mt-4 w-full"
//       style={{ height: typeof height === "number" ? `${height}px` : height }}
//     >
//       <AdvancedRealTimeChart
//         theme={theme}
//         autosize={autosize}
//         width={width}
//         height={height}
//         symbol={formattedSymbol}
//         interval={interval}
//         timezone="Etc/UTC"
//         style="1" // Candlestick stylex`
//         locale="en"
//         toolbar_bg={theme === "dark" ? "#0e0f14" : "#f1f3f6"}
//         enable_publishing={false}
//         allow_symbol_change={false}
//         calendar={false}
//         // support_host="https://www.tradingview.com"
//         container_id={`tradingview_widget_${formattedSymbol}_${Date.now()}`} // Unique ID
//         key={`${formattedSymbol}_${interval}`} // Force re-render on symbol/interval change
//       />
//     </div>
//   );
// }

// // Alternative fallback component using iframe (if the npm package fails)
// export function TradingViewIframe({
//   market,
//   theme = "dark",
//   // width = "100%",
//   height = 550,
// }: TradingViewWidgetProps) {
//   const [isClient, setIsClient] = useState(false);

//   useEffect(() => {
//     setIsClient(true);
//   }, []);

//   const formatSymbol = (symbol: string): string => {
//     if (!symbol) return "BTCUSD";
//     return symbol.replace(/[-_]/g, "").toUpperCase();
//   };

//   const formattedSymbol = formatSymbol(market);

//   if (!isClient) {
//     return (
//       <div
//         className="mt-4 w-full flex items-center justify-center bg-gray-900"
//         style={{ height: typeof height === "number" ? `${height}px` : height }}
//       >
//         <div className="text-white">Loading chart...</div>
//       </div>
//     );
//   }

//   const a = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_BTCUSD&symbol=BTCUSD&interval=60&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=$dark&style=1&timezone=Etc%2FUTC&locale=en&utm_source=&utm_medium=widget&utm_campaign=chart&utm_term=BTCUSD`;

//   alert(a)
//   console.log("yoyoo", a);
//   return (
//     <div
//       className="mt-2 w-full"
//       style={{ height: typeof height === "number" ? `${height}px` : height }}
//     >
//       <div
//         className="tradingview-widget-container"
//         style={{ height: "100%", width: "100%" }}
//       >
//         <iframe
//           src={a}
//           style={{
//             width: "100%",
//             height: "100%",
//             margin: "0",
//             padding: "0",
//             border: "none",
//           }}
//           frameBorder={0}
//           allowTransparency={true}
//           scrolling="no"
//           allowFullScreen={true}
//         />
//       </div>
//     </div>
//   );
// }

// // Main component with error handling and fallbacks
// export function TradeView({ market }: { market: string }) {
//   const [error, setError] = useState<string | null>(null);
//   const [useIframe, setUseIframe] = useState(false);

//   useEffect(() => {
//     // Reset error state when market changes
//     setError(null);
//   }, [market]);

//   // Debug: Log the market value
//   console.log("TradeViewWithTradingView - market:", market);

//   if (!market) {
//     return (
//       <div className="w-full h-[520px] flex items-center justify-center bg-gray-900">
//         <div className="text-white">No market selected</div>
//       </div>
//     );
//   }

//   if (error || useIframe) {
//     return (
//       <div className="w-full">
//         {error && (
//           <div className="text-red-500 text-sm mb-2">
//             Chart failed to load: {error}. Using fallback chart.
//           </div>
//         )}
//         <TradingViewIframe
//           market={market}
//           theme="dark"
//           interval="60"
//           height={520}
//         />
//       </div>
//     );
//   }

//   return (
//     <div className="w-full">
//       <div
//         onError={(e) => {
//           console.error("TradingView widget error:", e);
//           setError("Widget failed to load");
//           setUseIframe(true);
//         }}
//       >
//         <TradingViewWidget
//           market={market}
//           theme="dark"
//           interval="60"
//           height={520}
//         />
//       </div>

//       {/* Fallback button */}
//       <div className="mt-2">
//         <button
//           onClick={() => setUseIframe(!useIframe)}
//           className="text-xs text-gray-400 hover:text-white"
//         >
//           {useIframe ? "Try Widget Version" : "Try Iframe Version"}
//         </button>
//       </div>
//     </div>
//   );
// }
