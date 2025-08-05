"use client";

import { useEffect, useState } from "react";

import { ChevronDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LimitSwap from "./LimitSwap";
import MarketSwap from "./MarketSwap";

export function SwapUI() {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [type, setType] = useState<"limit" | "market">("limit");
  const [price, setPrice] = useState("0");  
  const [quantity, setQuantity] = useState("0");
  const [orderValue, setOrderValue] = useState("0");
  
  // Use activeTab as the side
  const side = activeTab;


  useEffect(() => {
    const priceNum = parseFloat(price) || 0;
    const quantityNum = parseFloat(quantity) || 0;
    const orderValue = priceNum * quantityNum;
    setOrderValue(orderValue.toFixed(2));
  }, [price, quantity]);

  return (
    <div className="rounded-2xl bg-[#14151b] p-3 text-white w-full max-w-md mx-auto">
      {/* Buy/Sell Tabs */}
      <div className="flex items-center justify-center mb-4 bg-[#202127] rounded-xl">
        <BuyButton activeTab={activeTab} setActiveTab={setActiveTab} />
        <SellButton activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Limit / Market / Conditional */}
      <div className="flex gap-2 mb-4">
        <Tabs className="w-full" defaultValue="limit">
          <TabsList className="bg-[14151b] w-full space-x-1.5">
            <TabsTrigger value="limit">
              <LimitButton type={type} setType={setType} />
            </TabsTrigger>
            <TabsTrigger value="market">
              <MarketButton type={type} setType={setType} />
            </TabsTrigger>
            <TabsTrigger value="conditional">
              <ConditionalButton type={type} setType={setType} />
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="limit"
            className="flex justify-center items-center w-full"
          >
            <LimitSwap
              price={price}
              setPrice={setPrice}
              quantity={quantity}
              setQuantity={setQuantity}
              orderValue={orderValue}
              side={activeTab}
            />
          </TabsContent>
          <TabsContent
            value="market"
            className="flex justify-center items-center w-full"
          >
            <MarketSwap />
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}

function LimitButton({ type, setType }: { type: string; setType: any }) {
  return (
    <div
      className="flex flex-col cursor-pointer justify-center rounded-lg transition-all duration-200"
      onClick={() => setType("limit")}
    >
      <div
        className={`text-sm font-medium transition-all duration-200 ${
          type === "limit"
            ? "bg-[#202127] text-white px-2.5 py-1.5 rounded-lg shadow-sm"
            : "text-gray-400 hover:text-white hover:bg-gray-800/50 px-2.5 py-1.5 rounded-lg"
        }`}
      >
        Limit
      </div>
    </div>
  );
}

function MarketButton({ type, setType }: { type: string; setType: any }) {
  return (
    <div
      className="flex flex-col cursor-pointer justify-center rounded-lg transition-all duration-200"
      onClick={() => setType("market")}
    >
      <div
        className={`text-sm font-medium transition-all duration-200 ${
          type === "market"
            ? "bg-[#202127] text-white px-2.5 py-1.5 rounded-lg shadow-sm"
            : "text-gray-400 hover:text-white hover:bg-gray-800/50 px-2.5 py-1.5 rounded-lg"
        }`}
      >
        Market
      </div>
    </div>
  );
}

function ConditionalButton({ type, setType }: { type: string; setType: any }) {
  return (
    <div
      className="flex cursor-pointer justify-center rounded-lg transition-all duration-200"
      onClick={() => setType("conditional")}
    >
      <div
        className={`flex items-center gap-1 text-sm font-medium transition-all duration-200 ${
          type === "conditional"
            ? "bg-[#202127] text-white px-2.5 py-1.5 rounded-lg shadow-sm"
            : "text-gray-400 hover:text-white hover:bg-gray-800/50 px-2.5 py-1.5 rounded-lg"
        }`}
      >
        Conditional
        <ChevronDown size={14} />
      </div>
    </div>
  );
}

function BuyButton({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: any;
}) {
  return (
    <div
      className={`flex flex-col  flex-1 cursor-pointer justify-center rounded-lg  px-3 py-3 ${
        activeTab === "buy"
          ? "bg-[#1d2d2d] text-[#00c278]"
          : "hover:text-[#00c278]"
      }`}
      onClick={() => setActiveTab("buy")}
    >
      <p className="text-center text-sm font-semibold">Buy</p>
    </div>
  );
}

function SellButton({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: any;
}) {
  return (
    <div
      className={`flex flex-col  flex-1 cursor-pointer justify-center rounded-lg  px-3 py-3  ${
        activeTab === "sell"
          ? "bg-[#382429] text-[#fd4b4e]"
          : "hover:text-[#fd4b4e]"
      }`}
      onClick={() => setActiveTab("sell")}
    >
      <p className="text-center text-sm font-semibold ">Sell</p>
    </div>
  );
}
