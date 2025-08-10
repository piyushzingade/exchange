"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { TradesTableHeader } from "./TablesHeaders";
import { getTrade } from "@/utils/httpClient";
import { SignalingManager } from "@/utils/SignalingManager";
import { Trade } from "@/utils/types";

export default function Trades({ market }: { market: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Initializing...");

  // Use refs to prevent multiple subscriptions and track state
  const isInitializedRef = useRef<boolean>(false);
  const currentMarketRef = useRef<string>("");
  const callbackIdRef = useRef<string>("");
  const cleanupExecutedRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  const seenTradeIdsRef = useRef<Set<string>>(new Set());
  const initialDataFetchedRef = useRef<boolean>(false); // Track if initial data was fetched
  const realtimeTradesRef = useRef<Trade[]>([]); // Store realtime trades separately

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
      maximumFractionDigits: 2,
    });
  };

  const formatQuantity = (quantity: string) => {
    return Number(quantity).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  };

  // Memoized cleanup function to prevent recreation
  const cleanup = useCallback(async () => {
    if (cleanupExecutedRef.current) {
      console.log("Cleanup already executed, skipping...");
      return;
    }

    cleanupExecutedRef.current = true;
    console.log(`Starting cleanup for ${currentMarketRef.current}`);

    try {
      if (callbackIdRef.current) {
        console.log(`Cleaning up callback: ${callbackIdRef.current}`);
        await SignalingManager.getInstance().deRegisterCallback(
          "markPrice",
          callbackIdRef.current
        );
        callbackIdRef.current = "";
      }

      if (currentMarketRef.current) {
        console.log(
          `Unsubscribing from: markPrice@${currentMarketRef.current}`
        );
        await SignalingManager.getInstance().unsubscribe([
          `markPrice@${currentMarketRef.current}`,
        ]);
        currentMarketRef.current = "";
      }

      isInitializedRef.current = false;
      console.log("Cleanup completed");
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }, []);

  // Memoized trade update handler with deduplication
  const handleTradeUpdate = useCallback((data: any) => {
    if (!mountedRef.current) {
      console.log("Component unmounted, ignoring trade update");
      return;
    }

    console.log("LIVE TRADE UPDATE:", data);

    setConnectionStatus("Live updates active");

    // Create a unique identifier for this trade to prevent duplicates
    const tradeId = `${data.p || data.price}_${data.q || data.quantity}_${
      data.t || data.time || Date.now()
    }`;

    // Check if we've already seen this trade
    if (seenTradeIdsRef.current.has(tradeId)) {
      console.log("Duplicate trade detected, skipping:", tradeId);
      return;
    }

    // Mark this trade as seen
    seenTradeIdsRef.current.add(tradeId);

    const newTrade: Trade = {
      id: Date.now() + Math.random(), // More unique ID
      isBuyerMaker: data.m || data.isBuyerMaker || false,
      price: data.p || data.price || "0",
      qty: data.q || data.quantity || "0",
      quoteQty: (
        Number(data.p || data.price || 0) * Number(data.q || data.quantity || 0)
      ).toString(),
      time: data.t || data.time || Date.now(),
    };

    console.log("Adding new trade to list:", newTrade);

    // Store realtime trade in ref for persistence
    realtimeTradesRef.current = [
      newTrade,
      ...realtimeTradesRef.current.slice(0, 49),
    ]; // Keep 50 realtime trades

    setTrades((prevTrades) => {
      // Merge realtime trades with existing trades and keep latest 100
      const updatedTrades = [newTrade, ...prevTrades.slice(0, 99)];
      console.log(`Total trades: ${updatedTrades.length}`);
      return updatedTrades;
    });
  }, []);

  // Function to merge initial data with realtime trades
  const mergeTradesData = useCallback((initialTrades: Trade[]) => {
    // Combine realtime trades with initial trades, remove duplicates
    const allTrades = [...realtimeTradesRef.current, ...initialTrades];

    // Remove duplicates based on time and price (simple deduplication)
    const uniqueTrades = allTrades.filter((trade, index, arr) => {
      return (
        index ===
        arr.findIndex(
          (t) =>
            t.time === trade.time &&
            t.price === trade.price &&
            t.qty === trade.qty
        )
      );
    });

    // Sort by time (newest first) and limit to 100
    return uniqueTrades
      .sort((a, b) => (b.time || 0) - (a.time || 0))
      .slice(0, 100);
  }, []);

  useEffect(() => {
    // Set mounted flag
    mountedRef.current = true;

    // Early return if already initialized for this market
    if (isInitializedRef.current && currentMarketRef.current === market) {
      console.log(`Already initialized for ${market}, skipping initialization`);
      return;
    }

    console.log(`Initializing trades for market: ${market} (render)`);

    const initializeTrades = async () => {
      try {
        // Cleanup previous subscriptions if market changed
        if (currentMarketRef.current && currentMarketRef.current !== market) {
          console.log(
            `Market changed from ${currentMarketRef.current} to ${market}`
          );
          // Clear realtime trades when market changes
          realtimeTradesRef.current = [];
          seenTradeIdsRef.current.clear();
          initialDataFetchedRef.current = false;
          cleanupExecutedRef.current = false;
          await cleanup();
        }

        // Prevent duplicate initialization during async operations
        if (isInitializedRef.current && currentMarketRef.current === market) {
          console.log(
            `Race condition detected, already initialized for ${market}`
          );
          return;
        }

        // Set current market early to prevent duplicates
        currentMarketRef.current = market;
        setConnectionStatus("Loading trades...");

        // Only fetch initial data if not already fetched for this market or if market changed
        if (
          !initialDataFetchedRef.current ||
          currentMarketRef.current !== market
        ) {
          setLoading(true);

          try {
            console.log(`Fetching initial trades for ${market}...`);
            const tradesData = await getTrade(market);

            // Check if component is still mounted and market hasn't changed
            if (!mountedRef.current || currentMarketRef.current !== market) {
              console.log("Component unmounted or market changed during fetch");
              return;
            }

            console.log("Fetched initial trades:", tradesData.length, "trades");

            // Merge with existing realtime trades
            const mergedTrades = mergeTradesData(tradesData);
            setTrades(mergedTrades);

            initialDataFetchedRef.current = true;
            setConnectionStatus(
              `Loaded ${mergedTrades.length} trades (${realtimeTradesRef.current.length} live)`
            );
          } catch (error) {
            console.error("Error fetching initial trades:", error);
            if (mountedRef.current) {
              // If fetch fails but we have realtime trades, keep them
              if (realtimeTradesRef.current.length > 0) {
                setTrades([...realtimeTradesRef.current]);
                setConnectionStatus(
                  `Using ${realtimeTradesRef.current.length} cached trades`
                );
              } else {
                setTrades([]);
                setConnectionStatus("Failed to load trades");
              }
            }
          } finally {
            if (mountedRef.current) {
              setLoading(false);
            }
          }
        } else {
          // If we already have initial data, just update with current state
          console.log("Using cached initial data");
          setLoading(false);
          setConnectionStatus("Using cached data - Reconnecting...");
        }

        // Set up real-time updates only if not already done
        if (!isInitializedRef.current) {
          const callbackId = `MARKPRICE-${market}-${Date.now()}`;
          callbackIdRef.current = callbackId;

          console.log(`Registering markPrice callback: ${callbackId}`);

          // Register callback for markPrice updates
          await SignalingManager.getInstance().registerCallback(
            "markPrice",
            handleTradeUpdate,
            callbackId
          );

          // Subscribe to ONLY ONE stream to prevent duplicates
          const streams = [`markPrice@${market}`];
          console.log(`Subscribing to streams:`, streams);

          await SignalingManager.getInstance().subscribe(streams);

          isInitializedRef.current = true;
          cleanupExecutedRef.current = false;

          if (mountedRef.current) {
            setConnectionStatus("Connected - Live updates active");
          }

          console.log(`Trades setup complete for ${market}`);
        }
      } catch (error) {
        console.error("Error setting up trades:", error);
        if (mountedRef.current) {
          setConnectionStatus("Connection error");
        }
      }
    };

    // Add a small delay to prevent rapid re-renders in development
    const timeoutId = setTimeout(initializeTrades, 100);

    // Cleanup function
    return () => {
      console.log(`useEffect cleanup for ${market}`);
      mountedRef.current = false;
      clearTimeout(timeoutId);

      // Only cleanup if this is the final unmount or market is changing
      if (currentMarketRef.current === market) {
        cleanup();
      }
    };
  }, [market, handleTradeUpdate, cleanup, mergeTradesData]);

  // Handle component unmount
  useEffect(() => {
    return () => {
      console.log("Component unmounting");
      mountedRef.current = false;
    };
  }, []);

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
            <div className="text-xs mt-1">Market: {market}</div>
            {realtimeTradesRef.current.length > 0 && (
              <div className="text-xs mt-1 text-green-400">
                {realtimeTradesRef.current.length} live trades cached
              </div>
            )}
          </div>
        ) : trades.length > 0 ? (
          trades.map((trade, index) => (
            <div
              key={`${trade.id}-${index}`}
              className={`grid grid-cols-3 gap-2 text-sm hover:bg-[#2a2a2e] transition-colors px-3 py-2 ${
                index === 0 &&
                realtimeTradesRef.current.some((rt) => rt.id === trade.id)
                  ? "bg-green-900/20 border-l-2 border-green-500"
                  : ""
              }`}
            >
              {/* Price - Left aligned */}
              <div
                className={`font-mono text-left ${
                  trade.isBuyerMaker ? "text-red-400" : "text-green-400"
                }`}
              >
                Rs{formatPrice(trade.price)}
              </div>

              {/* Quantity - Center aligned */}
              <div className="text-gray-300 font-mono text-center">
                {formatQuantity(trade.qty)}
              </div>

              {/* Time - Right aligned */}
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

      {/* Debug Info */}
      <div className="text-xs text-gray-500 mt-2 px-2 space-y-1 border-t border-gray-700 pt-2">
        {trades.length > 0 && (
          <div>
            {trades.length} trades • Latest: {formatTime(trades[0]?.time || 0)}
          </div>
        )}
        <div>Market: {market}</div>
        <div>Live trades: {realtimeTradesRef.current.length}</div>
        <div>Callback: {callbackIdRef.current ? "Active" : "None"}</div>
        <div>
          Connection:{" "}
          {SignalingManager.getInstance().isConnected()
            ? "Connected"
            : "Disconnected"}
        </div>
        <div>Initialized: {isInitializedRef.current ? "Yes" : "No"}</div>
        <div>
          Initial fetched: {initialDataFetchedRef.current ? "Yes" : "No"}
        </div>
      </div>
    </div>
  );
}
