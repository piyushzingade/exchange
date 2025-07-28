"use client";

import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

export function SwapUI({ market }: { market: string }) {
  const [activeTab, setActiveTab] = useState("sell");
  const [type, setType] = useState("limit");

  return (
    <div className="rounded-2xl bg-[#111113] p-3 text-white w-full max-w-md mx-auto">
      {/* Buy/Sell Tabs */}
      <div className="flex mb-4">
        <Button
          onClick={() => setActiveTab("buy")}
          className={`flex-1 py-3 rounded-lg text-sm font-semibold ${
            activeTab === "buy"
              ? "bg-[#2d2d2e] text-white"
              : "bg-[#1b1b1c] text-gray-400"
          }`}
        >
          Buy
        </Button>
        <Button
          onClick={() => setActiveTab("sell")}
          className={`flex-1 py-3 rounded-lg text-sm font-semibold ${
            activeTab === "sell"
              ? "bg-[#3d1d1d] text-red-400"
              : "bg-[#1b1b1c] text-gray-400"
          }`}
        >
          Sell
        </Button>
      </div>

      {/* Limit / Market / Conditional */}
      <div className="flex gap-2 mb-4">
        {["Limit", "Market", "Conditional"].map((label) => (
          <Button
            key={label}
            onClick={() => setType(label.toLowerCase())}
            className={`px-4 py-1.5 rounded-md text-xs font-medium ${
              type === label.toLowerCase()
                ? "bg-[#2a2a2e] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {label}
          </Button>
        ))}
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
            type="number"
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

      {/* Quantity Field */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-1">Quantity</div>
        <div className="relative">
          <Input
            placeholder="0"
            type="number"
            className="h-12 text-right pr-12 text-2xl border border-gray-700 rounded-lg bg-[#1a1b1e] text-white"
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
        <input
          type="range"
          min={0}
          max={100}
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
            placeholder="0"
            type="number"
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
