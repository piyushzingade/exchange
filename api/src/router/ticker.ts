import { Router } from "express";

export const tickerRouter = Router();

// Mock ticker data
const generateMockTickers = () => {
  const basePrice = {
    TATA_INR : 2000,
  };

  return Object.entries(basePrice).map(([symbol, price]) => {
    // Generate realistic variations
    const priceVariation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const currentPrice = price * (1 + priceVariation);
    const change24h = (Math.random() - 0.5) * 0.2; // ±10% daily change
    const volume = Math.random() * 10000000; // Random volume up to 10M

    const absoluteChange = parseFloat((currentPrice * change24h).toFixed(2));
    const percentChange = parseFloat((change24h * 100).toFixed(2));

    return {
      symbol,
      price: parseFloat(currentPrice.toFixed(2)),
      lastPrice: parseFloat(currentPrice.toFixed(2)), // Add this field
      high: parseFloat((currentPrice * 1.05).toFixed(2)),
      low: parseFloat((currentPrice * 0.95).toFixed(2)),
      volume: parseFloat(volume.toFixed(2)),
      quoteVolume: parseFloat((volume * currentPrice).toFixed(2)),
      change: absoluteChange,
      priceChange: absoluteChange, // Add this field
      changePercent: percentChange,
      priceChangePercent: percentChange, // Add this field
      lastUpdateId: Date.now(),
      timestamp: Date.now(),
    };
  });
};

tickerRouter.get("/", (req, res) => {
  try {
    const mockTickers = generateMockTickers();
    console.log("Serving mock ticker data");

    return res.json({
      success: true,
      data: mockTickers,
      timestamp: Date.now(),
      source: "mock",
    });
  } catch (error) {
    console.error("Tickers error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate mock data",
    });
  }
});

// Endpoint for a specific ticker
tickerRouter.get("/:symbol", (req, res) => {
  try {
    const { symbol } = req.params;
    const mockTickers = generateMockTickers();
    const ticker = mockTickers.find((t) => t.symbol === symbol.toUpperCase());

    if (ticker) {
      return res.json({
        success: true,
        data: ticker,
        timestamp: Date.now(),
        source: "mock",
      });
    }

    return res.status(404).json({
      success: false,
      error: "Ticker not found",
      availableTickers: mockTickers.map((t) => t.symbol),
    });
  } catch (error) {
    console.error("Single ticker error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});
