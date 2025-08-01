import React, { useState } from "react";

export default function MarketSwap() {
  const [quantity, setQuantity] = useState("34");
  const [sliderValue, setSliderValue] = useState(0);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [tpSl, setTpSl] = useState(false);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderValue(parseInt(e.target.value));
  };

  return (
    <div className="bg-[#14151b] rounded-lg p-4 w-full max-w-sm text-white">
      {/* Available Equity */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-gray-400 text-sm">Available Equity</span>
        <span className="text-white font-medium">$0.00</span>
      </div>

      {/* Quantity Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Quantity</span>
          <span className="text-gray-400 text-sm">≈ 5,699.76 USD</span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full bg-transparent text-4xl font-light text-white outline-none border-none"
          />
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
            <button className="p-2">
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <div className="w-4 h-0.5 bg-cyan-400 mb-0.5"></div>
                <div className="w-4 h-0.5 bg-cyan-400 mb-0.5"></div>
                <div className="w-4 h-0.5 bg-cyan-400"></div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Percentage Slider */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={handleSliderChange}
            className="custom-slider w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>0</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Trading Info */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Margin Required</span>
          <span className="text-white">-</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Est. Liquidation Price</span>
          <span className="text-white">-</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Max Slippage</span>
          <span className="text-blue-400">3%</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 mb-6">
        <button className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors">
          Sign up to trade
        </button>
        <button className="w-full bg-transparent border border-gray-600 text-white font-medium py-3 rounded-lg hover:bg-gray-800 transition-colors">
          Sign in to trade
        </button>
      </div>

      {/* Checkboxes */}
      <div className="flex space-x-6">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={reduceOnly}
            onChange={(e) => setReduceOnly(e.target.checked)}
            className="custom-checkbox w-4 h-4 bg-transparent border-2 border-gray-500 rounded appearance-none"
          />
          <span className="text-gray-400 text-sm">Reduce Only</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={tpSl}
            onChange={(e) => setTpSl(e.target.checked)}
            className="custom-checkbox w-4 h-4 bg-transparent border-2 border-gray-500 rounded appearance-none"
          />
          <span className="text-gray-400 text-sm">TP/SL</span>
        </label>
      </div>
    </div>
  );
}
