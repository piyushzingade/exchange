"use client";

import React from "react";
import { getDepth, getTicker } from "@/utils/httpClient";
import { SignalingManager } from "@/utils/SignalingManager";
import { useCallback, useEffect, useState } from "react";
import { AskTable } from "./AskTable";
import { BidTable } from "./BidTable";
import { BookTableHeader } from "./TablesHeaders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import Trades from "./Trades";

type OrderBookEntry = [string, string];

export function Depth({ market }: { market: string }) {
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [price, setPrice] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Memoized function to update bids
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
          // Remove the bid if quantity is 0
          if (existingIndex !== -1) {
            bidsAfterUpdate.splice(existingIndex, 1);
          }
        } else {
          // Update existing or add new bid
          if (existingIndex !== -1) {
            bidsAfterUpdate[existingIndex][1] = newQuantity;
          } else {
            bidsAfterUpdate.push(newBid);
          }
        }
      });

      // Sort bids by price descending and return top 20 for performance
      const sortedBids = bidsAfterUpdate
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .slice(0, 20);

      setTimeout(() => setIsProcessing(false), 0);
      return sortedBids;
    });
  }, []);

  // Memoized function to update asks
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
          // Remove the ask if quantity is 0
          if (existingIndex !== -1) {
            asksAfterUpdate.splice(existingIndex, 1);
          }
        } else {
          // Update existing or add new ask
          if (existingIndex !== -1) {
            asksAfterUpdate[existingIndex][1] = newQuantity;
          } else {
            asksAfterUpdate.push(newAsk);
          }
        }
      });

      // Sort asks by price descending (high to low) and return top 20 for performance
      const sortedAsks = asksAfterUpdate
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .slice(0, 20);

      setTimeout(() => setIsProcessing(false), 0);
      return sortedAsks;
    });
  }, []);

  // Memoized depth update handler
  const handleDepthUpdate = useCallback(
    (data: any) => {
      console.log('Received depth update:', data);
      // Update both sides of the order book while preserving existing orders
      if (data.bids) {
        updateBids(data.bids);
      }
      if (data.asks) {
        updateAsks(data.asks);
      }
    },
    [updateBids, updateAsks]  // Include the update functions in dependencies
  );

  useEffect(() => {
    const signalingManager = SignalingManager.getInstance();

    // Initialize data loading
    const initializeData = async () => {
      try {
        setIsLoading(true);

        // Fetch initial data in parallel
        const [depthData, tickerData] = await Promise.allSettled([
          getDepth(market),
          getTicker(market),
        ]);

        // Handle depth data
        if (depthData.status === "fulfilled") {
          // Use update functions to initialize the order book
          updateBids(depthData.value.bids);
          updateAsks(depthData.value.asks);
        }

        // Handle price data from ticker
        if (tickerData.status === "fulfilled") {
          setPrice(tickerData.value.lastPrice);
        }
      } catch (error) {
        console.error("Error initializing depth data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Register depth callback
    signalingManager.registerCallback(
      "depth",
      handleDepthUpdate,
      `DEPTH-${market}`
    );

    // Subscribe to depth stream
    signalingManager.sendMessage({
      method: "SUBSCRIBE",
      params: [`depth@${market}`], // Changed to match engine's format
    });

    // Initialize data
    initializeData();

    // Cleanup function
    return () => {
      signalingManager.deRegisterCallback("depth", `DEPTH-${market}`);
      signalingManager.sendMessage({
        method: "UNSUBSCRIBE",
        params: [`depth@${market}`],
      });
    };
  }, [market, handleDepthUpdate]);

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

            {/* Order Book Content */}
            <div className="w-full space-y-1">
              {/* Asks Section */}
              <div className="w-full">
                {asks.length > 0 ? (
                  <AskTable asks={asks} />
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No asks available
                  </div>
                )}
              </div>

              {/* Current Price */}
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

              {/* Bids Section */}
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
          <Trades market={market} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
