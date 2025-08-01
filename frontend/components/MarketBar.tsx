"use client";
import { useEffect, useState } from "react";
import { SignalingManager } from "@/utils/SignalingManager";
import type { Ticker } from "@/utils/types";
import Image from "next/image";
import { getTicker } from "@/utils/httpClient";

export const MarketBar = ({ market }: { market: string }) => {
  const [ticker, setTicker] = useState<Ticker | null>(null);

  useEffect(() => {
    // getTicker(market).then(setTicker);
    getTicker(market).then((t) => setTicker(t));
    SignalingManager.getInstance().registerCallback(
      "ticker", 
      (data: any) => {
        console.log("MarketBar ticker data received:", data); // Debug log
        setTicker((prevTicker) => {
          if (!prevTicker) return prevTicker;
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

  return (
    <div>
      <div className="flex items-center flex-row  overflow-hidden bg-[#14151b] p-3 rounded-xl h-[72px] mx-3">
        <div className="flex items-center justify-between flex-row no-scrollbar overflow-auto pr-4 gap-[32px]">
          <Ticker market={market} />
          <div className="flex items-center flex-row space-x-8 pl-4">
            <div className="flex flex-col h-full justify-center">
              <p
                className={`font-medium tabular-nums text-greenText text-md text-green-500`}
              >
                ${ticker?.lastPrice}
              </p>
              <p className="font-medium text-sm  tabular-nums">
                ${ticker?.lastPrice}
              </p>
            </div>
            <div className="flex flex-col">
              <p className={`font-medium text-xs text-slate-400 `}>
                24H Change
              </p>
              <p
                className={` text-sm font-medium tabular-nums leading-5 text-greenText ${
                  Number(ticker?.priceChange) > 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {Number(ticker?.priceChange) > 0 ? "+" : ""}{" "}
                {ticker?.priceChange}{" "}
                {Number(ticker?.priceChangePercent)?.toFixed(2)}%
              </p>
            </div>
            <div className="flex flex-col">
              <p className="font-medium text-xs text-slate-400">24H High</p>
              <p className="text-sm font-medium tabular-nums leading-5  ">
                {ticker?.high}
              </p>
            </div>
            <div className="flex flex-col">
              <p className="font-medium text-xs text-slate-400">24H Low</p>
              <p className="text-sm font-medium tabular-nums leading-5 ">
                {ticker?.low}
              </p>
            </div>
            <button
              type="button"
              className="font-medium transition-opacity hover:opacity-80 hover:cursor-pointer text-base text-left"
              data-rac=""
            >
              <div className="flex flex-col">
                <p className="font-medium  text-slate-400 text-sm">
                  24H Volume
                </p>
                <p className="mt-1  font-medium tabular-nums leading-5 text-sm ">
                  {ticker?.volume}
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
