"use client";
import { useEffect, useState } from "react";
import { SignalingManager } from "@/utils/SignalingManager";
import type { Ticker } from "@/utils/types";
import Image from "next/image";
import { getTicker } from "@/utils/httpClient";

export const MarketBar = ({ market }: { market: string }) => {
  const [ticker, setTicker] = useState<Ticker | null>(null);

  useEffect(() => {
    // Load initial ticker data
    getTicker(market)
      .then((t) => {
        console.log("Initial ticker data:", t); // Debug log
        setTicker(t);
      })
      .catch((error) => {
        console.error("Error loading ticker:", error);
      });

    // Register WebSocket callback for real-time updates
    SignalingManager.getInstance().registerCallback(
      "ticker",
      (data: any) => {
        console.log("MarketBar ticker data received:", data); // Debug log
        setTicker((prevTicker) => {
          // If no prevTicker, use the incoming data as base
          if (!prevTicker) {
            return {
              firstPrice: data?.firstPrice || 0,
              high: data?.high || 0,
              lastPrice: data?.lastPrice || 0,
              low: data?.low || 0,
              priceChange: data?.priceChange || 0,
              priceChangePercent: data?.priceChangePercent || 0,
              quoteVolume: data?.quoteVolume || 0,
              symbol: data?.symbol || market,
              trades: data?.trades || 0,
              volume: data?.volume || 0,
            };
          }

          // Update existing ticker with new data
          return {
            firstPrice: data?.firstPrice ?? prevTicker.firstPrice,
            high: data?.high ?? prevTicker.high,
            lastPrice: data?.lastPrice ?? prevTicker.lastPrice,
            low: data?.low ?? prevTicker.low,
            priceChange: data?.priceChange ?? prevTicker.priceChange,
            priceChangePercent:
              data?.priceChangePercent ?? prevTicker.priceChangePercent,
            quoteVolume: data?.quoteVolume ?? prevTicker.quoteVolume,
            symbol: data?.symbol ?? prevTicker.symbol,
            trades: data?.trades ?? prevTicker.trades,
            volume: data?.volume ?? prevTicker.volume,
          };
        });
      },
      `TICKER-${market}`
    );

    SignalingManager.getInstance().sendMessage({
      method: "SUBSCRIBE",
      params: [`ticker.${market}`],
    });

    return () => {
      SignalingManager.getInstance().deRegisterCallback(
        "ticker",
        `TICKER-${market}`
      );
      SignalingManager.getInstance().sendMessage({
        method: "UNSUBSCRIBE",
        params: [`ticker.${market}`],
      });
    };
  }, [market]);

  // Debug log to see what ticker data we have
  console.log("Current ticker state:", ticker);

  return (
    <div>
      <div className="flex items-center flex-row overflow-hidden bg-[#14151b] p-3 rounded-xl h-[72px] mx-3">
        <div className="flex items-center justify-between flex-row no-scrollbar overflow-auto pr-4 gap-[32px]">
          <Ticker market={market} />
          <div className="flex items-center flex-row space-x-8 pl-4">
            <div className="flex flex-col h-full justify-center">
              <p className="font-medium tabular-nums text-md text-green-500">
                ${ticker?.lastPrice || "0.00"}
              </p>
              <p className="font-medium text-sm tabular-nums">
                ${ticker?.lastPrice || "0.00"}
              </p>
            </div>
            <div className="flex flex-col">
              <p className="font-medium text-xs text-slate-400">24H Change</p>
              <p
                className={`text-sm font-medium tabular-nums leading-5 ${
                  Number(ticker?.priceChange || 0) > 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {Number(ticker?.priceChange || 0) > 0 ? "+" : ""}
                {ticker?.priceChange || "0.00"} (
                {Number(ticker?.priceChangePercent || 0).toFixed(2)}%)
              </p>
            </div>
            <div className="flex flex-col">
              <p className="font-medium text-xs text-slate-400">24H High</p>
              <p className="text-sm font-medium tabular-nums leading-5">
                {ticker?.high || "0.00"}
              </p>
            </div>
            <div className="flex flex-col">
              <p className="font-medium text-xs text-slate-400">24H Low</p>
              <p className="text-sm font-medium tabular-nums leading-5">
                {ticker?.low || "0.00"}
              </p>
            </div>
            <button
              type="button"
              className="font-medium transition-opacity hover:opacity-80 hover:cursor-pointer text-base text-left"
              data-rac=""
            >
              <div className="flex flex-col">
                <p className="font-medium text-slate-400 text-sm">24H Volume</p>
                <p className="mt-1 font-medium tabular-nums leading-5 text-sm">
                  {ticker?.volume || "0"}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function Ticker({ market }: { market: string }) {
  return (
    <div className="flex shrink-0 gap-2 bg-[#202127] px-3 py-2.5 rounded-xl items-center">
      <div className="flex items-center justify-center">
        <img
          alt="SOL Logo"
          loading="lazy"
          decoding="async"
          width={24}
          height={24}
          className="rounded-full h-6 w-6"
          src="/sol.webp"
        />
      </div>
      <button type="button" className="react-aria-Button">
        <div className="flex items-center justify-between flex-row cursor-pointer rounded-lg hover:opacity-80">
          <div className="flex items-center flex-row gap-2">
            <div className="flex flex-row relative">
              <p className="font-medium text-sm text-white">
                {market.replace("_", "/")}
              </p>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
