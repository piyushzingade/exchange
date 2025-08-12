"use client";

import React from "react";
import { getDepth, getTicker, getTrade } from "@/utils/httpClient";
import { SignalingManager } from "@/utils/SignalingManager";
import { useCallback, useEffect, useState, useRef } from "react";
import { AskTable } from "./AskTable";
import { BidTable } from "./BidTable";
import { BookTableHeader } from "./TablesHeaders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import Trades from "./Trades";
import { Trade } from "@/utils/types";

type OrderBookEntry = [string, string];

export function Depth({ market }: { market: string }) {
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [price, setPrice] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Trade states moved from Trades component
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("Initializing...");

  const callbackIdRef = useRef("");
  const currentMarketRef = useRef("");
  const seenTradeIdsRef = useRef(new Set<string>());

  const updateBids = useCallback((newBids: OrderBookEntry[]) => {
    if (isProcessing) return;
    setIsProcessing(true);

    setBids((originalBids) => {
      const bidsAfterUpdate = [...originalBids];

      newBids.forEach((newBid) => {
        const [newPrice, newQuantity] = newBid;
        const existingIndex = bidsAfterUpdate.findIndex(
          ([price]) => price === newPrice
        );

        if (Number(newQuantity) === 0) {
          if (existingIndex !== -1) {
            bidsAfterUpdate.splice(existingIndex, 1);
          }
        } else {
          if (existingIndex !== -1) {
            bidsAfterUpdate[existingIndex][1] = newQuantity;
          } else {
            bidsAfterUpdate.push(newBid);
          }
        }
      });

      const sortedBids = bidsAfterUpdate
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .slice(0, 20);

      setTimeout(() => setIsProcessing(false), 0);
      return sortedBids;
    });
  }, []);

  const updateAsks = useCallback((newAsks: OrderBookEntry[]) => {
    if (isProcessing) return;
    setIsProcessing(true);

    setAsks((originalAsks) => {
      const asksAfterUpdate = [...originalAsks];

      newAsks.forEach((newAsk) => {
        const [newPrice, newQuantity] = newAsk;
        const existingIndex = asksAfterUpdate.findIndex(
          ([price]) => price === newPrice
        );

        if (Number(newQuantity) === 0) {
          if (existingIndex !== -1) {
            asksAfterUpdate.splice(existingIndex, 1);
          }
        } else {
          if (existingIndex !== -1) {
            asksAfterUpdate[existingIndex][1] = newQuantity;
          } else {
            asksAfterUpdate.push(newAsk);
          }
        }
      });

      const sortedAsks = asksAfterUpdate
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .slice(0, 20);

      setTimeout(() => setIsProcessing(false), 0);
      return sortedAsks;
    });
  }, []);

  const handleDepthUpdate = useCallback(
    (data: any) => {
      console.log("Received depth update:", data);
      if (data.bids) {
        updateBids(data.bids);
      }
      if (data.asks) {
        updateAsks(data.asks);
      }
    },
    [updateBids, updateAsks]
  );

  // Trade update handler moved from Trades component
  const handleTradeUpdate = useCallback((data: any) => {
    const tradeId = `${data.p || data.price}_${data.q || data.quantity}_${
      data.t || data.time
    }`;
    if (seenTradeIdsRef.current.has(tradeId)) return;

    seenTradeIdsRef.current.add(tradeId);

    const newTrade: Trade = {
      id: Date.now() + Math.random(),
      isBuyerMaker: data.m || false,
      price: data.p || "0",
      qty: data.q || "0",
      quoteQty: (Number(data.p || 0) * Number(data.q || 0)).toString(),
      time: data.t || Date.now(),
    };

    setTrades((prev) => [newTrade, ...prev].slice(0, 100));
    setConnectionStatus("Live updates active");
  }, []);

  // Cleanup function for trades websocket
  const cleanupTrades = useCallback(async () => {
    if (callbackIdRef.current) {
      await SignalingManager.getInstance().deRegisterCallback(
        "markPrice",
        callbackIdRef.current
      );
      callbackIdRef.current = "";
    }
    if (currentMarketRef.current) {
      await SignalingManager.getInstance().unsubscribe([
        `markPrice@${currentMarketRef.current}`,
      ]);
      currentMarketRef.current = "";
    }
  }, []);

  useEffect(() => {
    const signalingManager = SignalingManager.getInstance();
    let mounted = true;

    const initializeData = async () => {
      try {
        setIsLoading(true);
        setTradesLoading(true);

        // Cleanup previous trades subscription
        await cleanupTrades();
        currentMarketRef.current = market;
        setConnectionStatus("Loading trades...");

        // Fetch initial data in parallel
        const [depthData, tickerData, tradesData] = await Promise.allSettled([
          getDepth(market),
          getTicker(market),
          getTrade(market),
        ]);

        if (!mounted) return;

        // Handle depth data
        if (depthData.status === "fulfilled") {
          updateBids(depthData.value.bids);
          updateAsks(depthData.value.asks);
        }

        // Handle price data from ticker
        if (tickerData.status === "fulfilled") {
          setPrice(tickerData.value.lastPrice);
        }

        // Handle trades data
        if (tradesData.status === "fulfilled") {
          tradesData.value.forEach((t) => {
            seenTradeIdsRef.current.add(`${t.price}_${t.qty}_${t.time}`);
          });

          setTrades((prev) => {
            const merged = [...tradesData.value, ...prev];
            const unique = merged.filter(
              (trade, index, arr) =>
                index ===
                arr.findIndex(
                  (t) =>
                    t.time === trade.time &&
                    t.price === trade.price &&
                    t.qty === trade.qty
                )
            );
            return unique.slice(0, 100);
          });

          setConnectionStatus(`Loaded ${tradesData.value.length} trades`);
        } else {
          if (mounted) setConnectionStatus("Failed to load trades");
        }
      } catch (error) {
        console.error("Error initializing data:", error);
        if (mounted) {
          setConnectionStatus("Failed to load trades");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setTradesLoading(false);
        }
      }

      // Set up websocket subscriptions
      if (mounted) {
        // Register depth callback
        signalingManager.registerCallback(
          "depth",
          handleDepthUpdate,
          `DEPTH-${market}`
        );

        // Register trades callback
        const tradeCallbackId = `MARKPRICE-${market}-${Date.now()}`;
        callbackIdRef.current = tradeCallbackId;
        await signalingManager.registerCallback(
          "markPrice",
          handleTradeUpdate,
          tradeCallbackId
        );

        // Subscribe to both streams
        signalingManager.sendMessage({
          method: "SUBSCRIBE",
          params: [`depth@${market}`, `markPrice@${market}`],
        });
      }
    };

    initializeData();

    return () => {
      mounted = false;
      // Cleanup depth subscription
      signalingManager.deRegisterCallback("depth", `DEPTH-${market}`);
      signalingManager.sendMessage({
        method: "UNSUBSCRIBE",
        params: [`depth@${market}`],
      });
      // Cleanup trades subscription
      cleanupTrades();
    };
  }, [
    market,
    handleDepthUpdate,
    handleTradeUpdate,
    updateBids,
    updateAsks,
    cleanupTrades,
  ]);

  if (isLoading) {
    return (
      <div className="bg-[#14151b] rounded-2xl px-4 h-fit w-full">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading order book...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#14151b] rounded-2xl w-full max-w-none ">
      <Tabs defaultValue="Book" className="w-full">
        <TabsList className="bg-[#14151b] mb-1   w-full justify-start gap-2">
          <TabsTrigger
            value="Book"
            className="px-4 py-2 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2e] text-sm font-medium data-[state=active]:bg-[#2a2a2e] data-[state=active]:text-white"
          >
            Book
          </TabsTrigger>
          <TabsTrigger
            value="Trades"
            className="px-4 py-2 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2e] text-sm font-medium data-[state=active]:bg-[#2a2a2e] data-[state=active]:text-white"
          >
            Trades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="Book" className="w-full space-y-0">
          <div className="w-full">
            <BookTableHeader />

            <div className="w-full space-y-1">
              <div className="w-full">
                {asks.length > 0 ? (
                  <AskTable asks={asks} />
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No asks available
                  </div>
                )}
              </div>

              {price && (
                <div className="w-full">
                  <div className="text-center text-white font-mono text-lg font-semibold py-2">
                    $
                    {Number(price).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 8,
                    })}
                  </div>
                </div>
              )}

              <div className="w-full">
                {bids.length > 0 ? (
                  <BidTable bids={bids} />
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No bids available
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="Trades" className="w-full">
          <Trades
            market={market}
            trades={trades}
            loading={tradesLoading}
            connectionStatus={connectionStatus}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
