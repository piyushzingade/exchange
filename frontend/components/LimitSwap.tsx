"use client"
import Image from "next/image";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState } from "react";
import { getUserBalance, placeOrder } from "@/utils/httpClient";


export default function LimitSwap({
  price,
  setPrice,
  quantity,
  setQuantity,
  orderValue,
  side,
  market = "TATA_INR", // default market for TATA/INR trading
  userId = "1" // default user ID
}: {
  price: string;
  setPrice: (price: string) => void;
  quantity: string;
  setQuantity: (quantity: string) => void;
  orderValue: string;
  side: "buy" | "sell";
  market?: string;
  userId?: string;
}) {
  const [balance , setBalance] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // const balance = getUserBalance(userId);

  const randomUserId = () => {
    return (Math.floor(Math.random() * 5) + 1).toString();
  }
  
  const handleSubmit = async () => {
    if (!price || !quantity || parseFloat(price) <= 0 || parseFloat(quantity) <= 0) {
      setError('Please enter valid price and quantity');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      
      const response = await placeOrder({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        userId: randomUserId(),
        market,
        side
      });
      
      // Reset form after successful order
      setPrice("0");
      setQuantity("0");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
      console.error('Order placement failed:', err);
    } finally {
      setIsLoading(false);
    }
  }

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
  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
        <span className="text-gray-600">Available Equity</span>
        <span className="text-white"> 0</span>
      </div>
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

      {/* Order Button and Error Message */}
      <div className="flex flex-col gap-2 mb-4">
        {error && (
          <div className="text-red-500 text-sm mb-2">
            {error}
          </div>
        )}
        <Button 
          onClick={handleSubmit}
          disabled={isLoading}
          className={`${
            side === 'buy' 
              ? 'bg-[#00c278] hover:bg-[#00b36e]' 
              : 'bg-[#fd4b4e] hover:bg-[#e04447]'
          } text-white rounded-xl h-12 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}>
          {isLoading ? 'Placing Order...' : `Place ${side.toUpperCase()} Order`}
        </Button>
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
