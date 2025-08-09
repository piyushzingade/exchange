"use client";
import React, { useEffect, useState, useRef } from "react";
import { TradesTableHeader } from "./TablesHeaders";
import { getTrade } from "@/utils/httpClient";
import { SignalingManager } from "@/utils/SignalingManager";
import { Trade } from "@/utils/types";

export default function Trades({ market }: { market: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Connecting...");

  // Use refs to prevent multiple subscriptions and track state
  const isInitializedRef = useRef<boolean>(false);
  const currentMarketRef = useRef<string>("");
  const callbackIdRef = useRef<string>("");

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

  // Cleanup function
  const cleanup = async () => {
    if (callbackIdRef.current) {
      console.log(` Cleaning up callback: ${callbackIdRef.current}`);
      await SignalingManager.getInstance().deRegisterCallback(
        "markPrice",
        callbackIdRef.current
      );
      callbackIdRef.current = "";
    }

    if (currentMarketRef.current) {
      console.log(
        ` Unsubscribing from: markPrice@${currentMarketRef.current}`
      );
      await SignalingManager.getInstance().unsubscribe([
        `markPrice@${currentMarketRef.current}`,
        `markPrice.${currentMarketRef.current}`,
      ]);
      currentMarketRef.current = "";
    }
  };

  useEffect(() => {
    // Prevent duplicate initialization
    if (isInitializedRef.current && currentMarketRef.current === market) {
      console.log(` Already initialized for ${market}, skipping...`);
      return;
    }

    console.log(` Initializing trades for market: ${market}`);
    setConnectionStatus("Connecting...");

    const initializeTrades = async () => {
      try {
        // Cleanup previous subscriptions if market changed
        if (currentMarketRef.current && currentMarketRef.current !== market) {
          await cleanup();
        }

        // Fetch initial trades data
        setLoading(true);
        console.log(` Fetching initial trades for ${market}...`);

        try {
          const tradesData = await getTrade(market);
          console.log(
            "Fetched initial trades:",
            tradesData.length,
            "trades"
          );
          setTrades(tradesData);
          setConnectionStatus(`Loaded ${tradesData.length} trades`);
        } catch (error) {
          console.error("Error fetching initial trades:", error);
          setTrades([]);
          setConnectionStatus("Failed to load trades");
        } finally {
          setLoading(false);
        }

        // Set up real-time updates
        const callbackId = `MARKPRICE-${market}-${Date.now()}`;
        callbackIdRef.current = callbackId;
        currentMarketRef.current = market;

        console.log(` Registering markPrice callback: ${callbackId}`);

        // Register callback for markPrice updates
        await SignalingManager.getInstance().registerCallback(
          "markPrice",
          (data: any) => {
            console.log(" LIVE TRADE UPDATE:", data);

            setConnectionStatus("Live updates active");

            setTrades((prevTrades) => {
              const newTrade: Trade = {
                id: Date.now() + Math.random(), // Unique ID
                isBuyerMaker: data.m || data.isBuyerMaker || false,
                price: data.p || data.price || "0",
                qty: data.q || data.quantity || "0",
                quoteQty: (
                  Number(data.p || data.price || 0) *
                  Number(data.q || data.quantity || 0)
                ).toString(),
                time: data.t || data.time || Date.now(),
              };

              console.log(" Adding new trade to list:", newTrade);

              // Add new trade to top and keep only latest 100 trades
              const updatedTrades = [newTrade, ...prevTrades.slice(0, 99)];

              console.log(`Total trades: ${updatedTrades.length}`);
              return updatedTrades;
            });
          },
          callbackId
        );

        // Subscribe to markPrice streams (both formats for compatibility)
        const streams = [`markPrice@${market}`, `markPrice.${market}`];
        console.log(` Subscribing to streams:`, streams);

        await SignalingManager.getInstance().subscribe(streams);

        isInitializedRef.current = true;
        setConnectionStatus("Connected - Waiting for trades...");

        console.log(` Trades setup complete for ${market}`);
      } catch (error) {
        console.error("Error setting up trades:", error);
        setConnectionStatus("Connection error");
      }
    };

    initializeTrades();

    // Cleanup on unmount or market change
    return () => {
      console.log(` Component cleanup for ${market}`);
      cleanup();
      isInitializedRef.current = false;
    };
  }, [market]);

  return (
    <div className="w-full">
      <TradesTableHeader />

      {/* Connection Status */}
      <div className="text-xs text-gray-400 px-2 py-1 border-b border-gray-700">
        Status: {connectionStatus}
      </div>

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
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <div className="mt-2">Loading trades...</div>
          </div>
        ) : trades.length > 0 ? (
          trades.map((trade, index) => (
            <div
              key={`${trade.id}-${index}`}
              className={`grid grid-cols-3 text-sm hover:bg-[#2a2a2e] transition-colors px-2 py-1 ${
                index === 0 ? "bg-green-900/20 border-l-2 border-green-500" : ""
              }`}
            >
              {/* Price */}
              <div
                className={`font-mono text-center ${
                  trade.isBuyerMaker ? "text-red-400" : "text-green-400"
                }`}
              >
                ₹{formatPrice(trade.price)}
              </div>

              {/* Quantity */}
              <div className="text-gray-300 font-mono text-center">
                {formatQuantity(trade.qty)}
              </div>

              {/* Time */}
              <div className="text-gray-400 font-mono text-center">
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

      {/* Debug Info */}
      <div className="text-xs text-gray-500 mt-2 px-2 space-y-1 border-t border-gray-700 pt-2">
        {trades.length > 0 && (
          <div>
             {trades.length} trades • Latest:{" "}
            {formatTime(trades[0]?.time || 0)}
          </div>
        )}
        <div> Market: {market}</div>
        <div> Callback: {callbackIdRef.current ? "Active" : "None"}</div>
        <div>
          🔌 Connection:{" "}
          {SignalingManager.getInstance().isConnected()
            ? "Connected"
            : "Disconnected"}
        </div>
      </div>
    </div>
  );
}
