"use client";
import React from "react";
import { TradesTableHeader } from "./TablesHeaders";
import { Trade } from "@/utils/types";

interface TradesProps {
  market: string;
  trades: Trade[];
  loading: boolean;
  connectionStatus: string;
}

export default function Trades({
  market,
  trades,
  loading,
  connectionStatus,
}: TradesProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp > 1e12 ? timestamp : timestamp * 1000);
    return date.toLocaleTimeString("en-US", { hour12: false });
  };

  const formatPrice = (price: string) =>
    Number(price).toLocaleString(undefined, { maximumFractionDigits: 2 });

  const formatQuantity = (quantity: string) =>
    Number(quantity).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });

  return (
    <div className="w-full">
      <TradesTableHeader />

      <div className="text-xs text-gray-400 px-2 py-1 border-b border-gray-700">
        Status: {connectionStatus}
      </div>

      <div className="w-full space-y-1 h-[400px] overflow-y-scroll scrollbar-hide">
        <style>{`
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
        `}</style>

        {loading ? (
          <div className="text-center text-gray-500 py-8">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <div className="mt-2">Loading trades...</div>
            <div className="text-xs mt-1">Market: {market}</div>
          </div>
        ) : trades.length > 0 ? (
          trades.map((trade, index) => (
            <div
              key={`${trade.id}-${index}`}
              className="grid grid-cols-3 gap-2 text-sm hover:bg-[#2a2a2e] transition-colors px-3 py-2"
            >
              <div
                className={`font-mono text-left ${
                  trade.isBuyerMaker ? "text-red-400" : "text-green-400"
                }`}
              >
                Rs{formatPrice(trade.price)}
              </div>
              <div className="text-gray-300 font-mono text-center">
                {formatQuantity(trade.qty)}
              </div>
              <div className="text-gray-400 font-mono text-right">
                {formatTime(trade.time)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8 space-y-2">
            <div>No trades available</div>
            <div className="text-xs">Place some orders to see trades here!</div>
            <div className="text-xs text-blue-400">
              Listening on: markPrice@{market}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
