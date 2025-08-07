"use client";
import React, { useEffect, useState } from "react";
import { TradesTableHeader } from "./TablesHeaders";
import { getTrade } from "@/utils/httpClient";
import { SignalingManager } from "@/utils/SignalingManager";
import { Trade } from "@/utils/types";


export default function Trades({ market }: { market: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const formatTime = (timestamp: number) => {
    // Handle both milliseconds and microseconds timestamps
    const date = new Date(timestamp > 1e12 ? timestamp : timestamp * 1000);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatPrice = (price: string) => {
    return Number(price).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  };

  const formatQuantity = (quantity: string) => {
    return Number(quantity).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  };

  useEffect(() => {
    // Fetch initial trades data
    const fetchTrades = async () => {
      try {
        setLoading(true);
        const tradesData = await getTrade(market);
        console.log("Fetched trades data:", tradesData);
        // Keep all trades from initial fetch
        setTrades(tradesData);
      } catch (error) {
        console.error("Error fetching trades:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();

    // Register WebSocket callback for markPrice updates
    SignalingManager.getInstance().registerCallback(
      "markPrice",
      (data: any) => {
        console.log("WebSocket markPrice data received:", data);

        setTrades((prevTrades) => {
          const newTrade: Trade = {
            id: Date.now(),
            isBuyerMaker: false, // markPrice doesn't have buyer/maker info
            price: data?.price || "0",
            qty: data?.quantity || "0", // Use qty instead of quantity
            quoteQty: "0", // markPrice doesn't have quote quantity
            time: data?.time || Date.now(), // Use time instead of timestamp
          };

          // Keep only the latest 100 trades for performance
          return [newTrade, ...prevTrades.slice(0, 99)];
        });
      },
      `MARKPRICE-${market}`
    );

    // Subscribe to markPrice stream
    SignalingManager.getInstance().sendMessage({
      method: "SUBSCRIBE",
      params: [`markPrice.${market}`],
    });

    // Cleanup function
    return () => {
      // Deregister callback
      SignalingManager.getInstance().deRegisterCallback(
        "markPrice",
        `MARKPRICE-${market}`
      );

      // Unsubscribe from stream
      SignalingManager.getInstance().sendMessage({
        method: "UNSUBSCRIBE",
        params: [`markPrice.${market}`],
      });
    };
  }, [market]);

  return (
    <div className="w-full">
      <TradesTableHeader />

      <div className="w-full space-y-1 h-[400px] overflow-y-scroll scrollbar-hide">
        {/* Custom scrollbar hiding styles */}
        <style>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {loading ? (
          <div className="text-center text-gray-500 py-8">
            Loading trades...
          </div>
        ) : trades.length > 0 ? (
          trades.map((trade, index) => (
            <div
              key={`${trade.id}-${index}`}
              className={`grid grid-cols-3 text-sm hover:bg-[#2a2a2e] transition-colors`}
            >
              {/* Price */}
              <div className="text-green-400 font-mono text-center">
                ${formatPrice(trade.price)}
              </div>

              {/* Quantity - Fixed: use trade.qty instead of trade.quantity */}
              <div className="text-gray-300 font-mono text-center">
                {formatQuantity(trade.qty)}
              </div>

              {/* Time - Fixed: use trade.time instead of trade.timestamp */}
              <div className="text-gray-400 font-mono text-center">
                {formatTime(trade.time)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            No trades available
          </div>
        )}
      </div>
    </div>
  );
}
