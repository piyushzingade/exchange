import { Router } from "express";

export const tickerRouter = Router();

// Base prices for different symbols
const BASE_PRICES = {
  TATA_INR: 2000,
  // Add more symbols here as needed
  // RELIANCE_INR: 2500,
  // HDFC_INR: 1800,
};

// Generate mock ticker data
const generateMockTicker = (symbol: string, basePrice: number) => {
  // Simple price variation between -5% to +5%
  const variation = (Math.random() - 0.5) * 0.1;
  const currentPrice = basePrice * (1 + variation);

  // Daily change between -10% to +10%
  const dailyChange = (Math.random() - 0.5) * 0.2;
  const changeAmount = currentPrice * dailyChange;
  const changePercent = dailyChange * 100;

  // Simple volume calculation
  const volume = Math.floor(Math.random() * 1000000); // 0 to 1M

  return {
    symbol: symbol,
    price: Math.round(currentPrice * 100) / 100, // Round to 2 decimals
    lastPrice: Math.round(currentPrice * 100) / 100,
    high: Math.round(currentPrice * 1.05 * 100) / 100,
    low: Math.round(currentPrice * 0.95 * 100) / 100,
    volume: volume,
    quoteVolume: Math.round(volume * currentPrice * 100) / 100,
    change: Math.round(changeAmount * 100) / 100,
    priceChange: Math.round(changeAmount * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    priceChangePercent: Math.round(changePercent * 100) / 100,
    timestamp: Date.now(),
  };
};

// Get all tickers
tickerRouter.get("/", (req, res) => {
  try {
    const tickers = Object.entries(BASE_PRICES).map(([symbol, price]) =>
      generateMockTicker(symbol, price)
    );

    res.json({
      success: true,
      data: tickers,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error generating tickers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get ticker data",
    });
  }
});

// Get specific ticker
tickerRouter.get("/:symbol", (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const basePrice = BASE_PRICES[symbol as keyof typeof BASE_PRICES];

    if (!basePrice) {
      return res.status(404).json({
        success: false,
        error: "Symbol not found",
        availableSymbols: Object.keys(BASE_PRICES),
      });
    }

    const ticker = generateMockTicker(symbol, basePrice);

    res.json({
      success: true,
      data: ticker,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error getting ticker:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get ticker data",
    });
  }
});
