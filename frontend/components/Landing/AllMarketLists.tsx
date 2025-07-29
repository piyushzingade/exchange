"use client";

import { ArrowUpIcon, ArrowDownIcon, StarIcon, StarOff } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { BASE_URL, getAllTickers } from "@/utils/httpClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ticker } from "@/utils/types";



export default function AllMarketLists() {
  const [data, setData] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"spot" | "futures" | "lend">(
    "spot"
  );
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response: Ticker[] = await getAllTickers();
        setData(response);
      } catch (error) {
        console.error("Error fetching tickers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format number to K, M, B, T
  const formatNumber = (num: number) => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return `${num.toFixed(2)}`;
  };

  // Handle row click and redirect
  const handleRowClick = (symbol: string) => {
    router.push(`/trade/${symbol}`);
  };

  // Filter data based on active tab
  const filteredData = data.filter((ticker) => {
    switch (activeTab) {
      case "spot":
        // Spot trading pairs like AAVE_USDC, SOL_USDC (but not PERP)
        return (
          (ticker.symbol.includes("_USDC") ||
            ticker.symbol.includes("_USDT")) &&
          !ticker.symbol.includes("_PERP")
        );
      case "futures":
        // Futures contracts like AAVE_USDC_PERP, SOL_USDC_PERP
        return ticker.symbol.includes("_PERP");
      case "lend":
        // Simple tokens like SOL, AAVE (no _ separators)
        return !ticker.symbol.includes("_");
      default:
        return true;
    }
  });

  // Generate sparkline data based on percentage change
  const generateSparklineData = (percentChange: string) => {
    const basePercent = parseFloat(percentChange);
    const sparkline = Array.from({ length: 7 }, (_, index) => {
      return { value: basePercent + (Math.random() - 0.5) * 10 };
    });
    return sparkline;
  };

  if (loading) {
    return (
      <div className="min-h-screen text-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex space-x-0 mb-6 bg-gray-800 rounded-lg p-1 w-fit">
          <button
            className={`px-6 py-2 rounded-md transition-colors ${
              activeTab === "spot"
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
            onClick={() => setActiveTab("spot")}
          >
            Spot
          </button>
          <button
            className={`px-6 py-2 rounded-md transition-colors ${
              activeTab === "futures"
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
            onClick={() => setActiveTab("futures")}
          >
            Futures
          </button>
          <button
            className={`px-6 py-2 rounded-md transition-colors ${
              activeTab === "lend"
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
            onClick={() => setActiveTab("lend")}
          >
            Lend
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-right py-3 px-4">Price</th>
                <th className="text-right py-3 px-4">24h Volume</th>
                <th className="text-right py-3 px-4">Market Cap</th>
                <th className="text-right py-3 px-4">24h Change</th>
                <th className="text-center py-3 px-4">Last 7 Days</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((coin: Ticker) => {
                // Extract base currency from symbol
                let baseCurrency = "";
                let displayPair = "";

                if (coin.symbol.includes("_PERP")) {
                  // For PERP tokens like AAVE_USDC_PERP, extract AAVE
                  baseCurrency = coin.symbol.split("_")[0];
                  const quoteCurrency = coin.symbol.split("_")[1];
                  displayPair = `${baseCurrency}/${quoteCurrency}`;
                } else if (coin.symbol.includes("_")) {
                  // For spot pairs like AAVE_USDC, extract AAVE
                  const parts = coin.symbol.split("_");
                  baseCurrency = parts[0];
                  const quoteCurrency = parts[1];
                  displayPair = `${baseCurrency}/${quoteCurrency}`;
                } else {
                  // For lend tokens like SOL, use as is
                  baseCurrency = coin.symbol;
                  displayPair = `${coin.symbol}/USD`;
                }

                const isPositive = parseFloat(coin.priceChangePercent) > 0;
                const changePercent = (
                  parseFloat(coin.priceChangePercent) * 100
                ).toFixed(2);

                return (
                  <tr
                    key={coin.symbol}
                    className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
                    onClick={() => handleRowClick(coin.symbol)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <img
                          src={`https://backpack.exchange/_next/image?url=%2Fcoins%2F${baseCurrency.toLowerCase()}.png&w=32&q=75`}
                          alt={`${baseCurrency} icon`}
                          className="w-8 h-8 mr-3 rounded-full"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-white">
                            {baseCurrency}
                          </span>
                          <span className="text-sm text-gray-400">
                            {displayPair}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-4 px-4">
                      ${parseFloat(coin.lastPrice).toLocaleString()}
                    </td>
                    <td className="text-right py-4 px-4">
                      ${formatNumber(parseFloat(coin.quoteVolume))}
                    </td>
                    <td className="text-right py-4 px-4">
                      ${formatNumber(parseFloat(coin.quoteVolume))}
                    </td>
                    <td className="text-right py-4 px-4">
                      <div
                        className={`flex items-center justify-end ${
                          isPositive ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpIcon className="w-4 h-4 mr-1" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4 mr-1" />
                        )}
                        {changePercent}%
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="ml-16 w-[160px] h-[50px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={generateSparklineData(
                              coin.priceChangePercent
                            )}
                          >
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={isPositive ? "#10B981" : "#EF4444"}
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
