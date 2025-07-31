"use client";

import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SwapUI({ market }: { market: string }) {
  const [activeTab, setActiveTab] = useState("sell");
  const [type, setType] = useState("limit");
  const [price, setPrice] = useState("0");  
  const [quantity, setQuantity] = useState("0");
  const [orderValue, setOrderValue] = useState("0");

  const handleInput = (value: string) => {
    // Remove all non-numeric characters except decimal point
    const sanitized = value.replace(/[^0-9.]/g, "");

    // Prevent negative numbers by removing minus signs
    const positiveOnly = sanitized.replace(/-/g, "");

    // Allow only one decimal point
    const parts = positiveOnly.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts[1];
    }

    // Prevent starting with just a dot
    if (positiveOnly.startsWith(".")) {
      return "0" + positiveOnly;
    }

    // Prevent multiple leading zeros
    if (
      positiveOnly.length > 1 &&
      positiveOnly.startsWith("0") &&
      !positiveOnly.startsWith("0.")
    ) {
      return positiveOnly.substring(1);
    }

    return positiveOnly;
  };

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
        <Tabs defaultValue="limit">
          <TabsList className="bg-[14151b]">
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
          <TabsContent value="limit"></TabsContent>
          <TabsContent value="market"></TabsContent>
        </Tabs>
      </div>

      {/* Balance Row */}
      <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
        <span>Balance</span>
        <span className="text-white">-</span>
      </div>

      {/* Price Field */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
          <span>Price</span>
          <div className="flex items-center gap-2">
            <span className="text-[#9ca3af] cursor-pointer">Mid</span>
            <span className="text-[#0ea5e9] cursor-pointer">BBO</span>
          </div>
        </div>
        <div className="relative">
          <Input
            placeholder="0"
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(handleInput(e.target.value))}
            className="h-12 text-right pr-12 text-2xl border border-gray-700 rounded-lg bg-[#1a1b1e] text-white appearance-none"
            min="0"
            max="100000"
            step="any"
          />
          <Image
            src="/usdc.webp"
            alt="usdc"
            width={24}
            height={24}
            className="absolute right-3 top-3"
          />
        </div>
      </div>

      {/* Quantity Field */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-1">Quantity</div>
        <div className="relative">
          <Input
            placeholder="0"
            type="text"
            inputMode="decimal"
            value={quantity}
            onChange={(e) => setQuantity(handleInput(e.target.value))}
            className="h-12 text-right pr-12 text-2xl border border-gray-700 rounded-lg bg-[#1a1b1e] text-white appearance-none"
            min="0"
            max="1000"
            step="any"
          />
          <Image
            src="/sol.webp"
            alt="sol"
            width={24}
            height={24}
            className="absolute right-3 top-3"
          />
        </div>
      </div>

      {/* Slider */}
      <div className="w-full mb-4 px-1">
        <Input
          type="range"
          min={0}
          max={100}
          inputMode="numeric"
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0</span>
          <span>100%</span>
        </div>
      </div>

      {/* Order Value */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-1">Order Value</div>
        <div className="relative">
          <Input
            value={orderValue}
            readOnly
            className="h-12 text-right pr-12 text-2xl border border-gray-700 rounded-lg bg-[#1a1b1e] text-white"
          />
          <Image
            src="/usdc.webp"
            alt="usdc"
            width={24}
            height={24}
            className="absolute right-3 top-3"
          />
        </div>
      </div>

      {/* Auth Buttons */}
      <div className="flex flex-col gap-2 mb-4">
        <button className="bg-white text-black rounded-xl h-12 font-semibold">
          Sign up to trade
        </button>
        <button className="bg-[#1c1c1e] text-white rounded-xl h-12 font-semibold">
          Sign in to trade
        </button>
      </div>

      {/* Checkboxes */}
      <div className="flex gap-6 text-xs text-white">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="accent-gray-600" />
          Post Only
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="accent-gray-600" />
          IOC
        </label>
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
      className={`flex flex-col  flex-1 cursor-pointer justify-center rounded-lg  ${
        activeTab === "sell"
          ? "bg-[#382429] text-[#fd4b4e]"
          : "hover:text-[#fd4b4e]"
      }`}
      onClick={() => setActiveTab("sell")}
    >
      <p className="text-center text-sm font-semibold text-redText">Sell</p>
    </div>
  );
}
