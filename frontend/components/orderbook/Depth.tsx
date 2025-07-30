"use client";

import { getDepth, getTicker, getTrade } from "@/utils/httpClient";
import { SignalingManager } from "@/utils/SignalingManager";
import { useEffect, useState } from "react";
import { AskTable } from "./AskTable";
import { BidTable } from "./BidTable";

export function Depth({ market }: { market: string }) {
  const [bids, setBids] = useState<[string, string][]>([]);
  const [asks, setAsks] = useState<[string, string][]>([]);
  const [price, setPrice] = useState<string>();

  useEffect(() => {
    const handleDepthUpdate = (data: any) => {
      // Update bids
      setBids((originalBids) => {
        const bidsAfterUpdate = [...originalBids];

        data.bids?.forEach((newBid: [string, string]) => {
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
              // Sort bids by price descending
              bidsAfterUpdate.sort((a, b) => Number(b[0]) - Number(a[0]));
            }
          }
        });

        return bidsAfterUpdate;
      });

      // Update asks
      setAsks((originalAsks) => {
        const asksAfterUpdate = [...originalAsks];

        data.asks?.forEach((newAsk: [string, string]) => {
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
              // Sort asks by price ascending
              asksAfterUpdate.sort((a, b) => Number(a[0]) - Number(b[0]));
            }
          }
        });

        return asksAfterUpdate;
      });
    };

    // Get initial ticker and set up ticker WebSocket subscription for price updates
    // getTicker(market).then((t) => setPrice(t.lastPrice));

    // SignalingManager.getInstance().registerCallback(
    //   "ticker",
    //   (data: any) => {
    //     if (data?.lastPrice) {
    //       setPrice(data.lastPrice);
    //     }
    //   },
    //   `TICKER-${market}`
    // );

    // SignalingManager.getInstance().sendMessage({
    //   method: "SUBSCRIBE",
    //   params: [`ticker.${market}`],
    // });

    // Register WebSocket callback for depth updates
    SignalingManager.getInstance().registerCallback(
      "depth",
      handleDepthUpdate,
      `DEPTH-${market}`
    );

    // Subscribe to depth updates
    SignalingManager.getInstance().sendMessage({
      method: "SUBSCRIBE",
      params: [`depth.${market}`],
    });

    // Fetch initial depth data
    getDepth(market).then((d) => {
      setBids(d.bids.reverse());
      setAsks(d.asks);
    });

    getTicker(market).then((t) => setPrice(t.lastPrice));
    getTrade(market).then((t) => setPrice(t[0].price));

    return () => {
      // Cleanup ticker subscription
      // SignalingManager.getInstance().deRegisterCallback(
      //   "ticker",
      //   `TICKER-${market}`
      // );
      // SignalingManager.getInstance().sendMessage({
      //   method: "UNSUBSCRIBE",
      //   params: [`ticker.${market}`],
      // });

      // Cleanup depth subscription
      SignalingManager.getInstance().sendMessage({
        method: "UNSUBSCRIBE",
        params: [`depth.100ms.${market}`],
      });
      SignalingManager.getInstance().deRegisterCallback(
        "depth",
        `DEPTH-${market}`
      );
    };
  }, [market]);

  return (
    <div className="bg-[#14151b] rounded-2xl px-2 w-full ">
      <div className="flex gap-2  rounded-lg w-fit mb-2 ">
        <div className="px-3 py-1.5 rounded-md bg-[#2a2a2e] text-white text-sm font-medium cursor-pointer">
          Book
        </div>
        <div className="px-3 py-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2e] text-sm font-medium cursor-pointer">
          Trades
        </div>
      </div>

      <TableHeader />
      <div className="space-y-2">
        {asks && <AskTable asks={asks} />}
        {price && (
          <div className="text-start text-white font-mono text-sm py-1">
            {price}
          </div>
        )}
        {bids && <BidTable bids={bids} />}
      </div>
    </div>
  );
}


function TableHeader() {
  return (
    <div className="flex justify-between text-xs mb-2">
      <div className="text-white">Price</div>
      <div className="text-slate-500">Size</div>
      <div className="text-slate-500">Total</div>
    </div>
  );
}
