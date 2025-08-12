import axios from "axios";
import { Candle, Depth, KLine, Ticker, Trade } from "./types";

export const BASE_URL = "http://localhost:3001/api/v1";

export async function getAllTickers(): Promise<Ticker[]> {
  try {
    const response = await axios.get(`${BASE_URL}/tickers`);
    console.log('Tickers API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      type: Array.isArray(response.data) ? 'array' : typeof response.data
    });
    
    if (!response.data) {
      throw new Error('No data received from server');
    }

    // If response.data is wrapped in another object, try to extract the tickers array
    const tickersData = Array.isArray(response.data) ? response.data : 
                      response.data.tickers || response.data.data || response.data.result;

    if (!Array.isArray(tickersData)) {
      throw new Error(`Invalid response format. Expected array, got ${typeof tickersData}`);
    }

    // Validate that each ticker has the required properties
    const validTickers = tickersData.filter(ticker => 
      ticker && 
      typeof ticker === 'object' && 
      'symbol' in ticker
    );

    if (validTickers.length === 0) {
      throw new Error('No valid tickers found in response');
    }

    return validTickers;
  } catch (error) {
    console.error('Error fetching tickers:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch tickers: ${error.message}. Status: ${error.response?.status}`);
    }
    throw error;
  }
}

export async function getTicker(market: string): Promise<Ticker> {
  if (!market) {
    throw new Error('Market parameter is required');
  }

  const tickers = await getAllTickers();
  console.log('GetTicker - Received tickers:', {
    tickersLength: tickers?.length,
    market,
    sampleTicker: tickers?.[0]
  });

  // Try different matching strategies
  let ticker =
    // Exact match
    tickers.find((t) => t.symbol === market) ||
    // Case insensitive match
    tickers.find((t) => t.symbol.toLowerCase() === market.toLowerCase()) ||
    // Replace underscore with hyphen
    tickers.find((t) => t.symbol === market.replace("_", "-")) ||
    // Replace hyphen with undersacore
    tickers.find((t) => t.symbol === market.replace("-", "_")) ||
    // Uppercase version
    tickers.find((t) => t.symbol === market.toUpperCase()) ||
    // Lowercase version
    tickers.find((t) => t.symbol === market.toLowerCase());

  if (!ticker) {
    const availableSymbols = tickers.map((t) => t.symbol);
    const similarSymbols = availableSymbols.filter((symbol) => {
      const lowerSymbol = symbol.toLowerCase();
      const lowerMarket = market.toLowerCase();
      return (
        lowerSymbol.includes(lowerMarket.split("_")[0]) ||
        lowerSymbol.includes(lowerMarket.split("-")[0])
      );
    });

    throw new Error(
      `No ticker found for "${market}". ` +
        `Available symbols: ${availableSymbols.slice(0, 10).join(", ")}${
          availableSymbols.length > 10 ? "..." : ""
        }. ` +
        `Similar symbols: ${similarSymbols.slice(0, 5).join(", ")}`
    );
  }

  return ticker;
}

export async function getDepth(market: string): Promise<Depth> {
  const response = await axios.get(`${BASE_URL}/depth?symbol=${market}`);
  return response.data;
}

export async function getTrade(market: string): Promise<Trade[]> {
  const response = await axios.get(`${BASE_URL}/trades?symbol=${market}`);
  return response.data;
}


export const getKlines = async (symbol: string): Promise<Candle[]> => {
  const response = await axios.get(`${BASE_URL}/klines`);

  return response.data.map((c: any) => ({
    time: Number(c.time), // convert string to number
    open: parseFloat(c.open),
    high: parseFloat(c.high),
    low: parseFloat(c.low),
    close: parseFloat(c.close),
  }));
};


export async function getMarkets(): Promise<string[]> {
  const response = await axios.get(`${BASE_URL}/markets`);
  return response.data;
}

export async function placeOrder(order: {
  price: number;
  quantity: number;
  userId: string;
  market: string;
  side: 'buy' | 'sell';
}) {
  try {
    const response = await axios.post(`${BASE_URL}/order`, order);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to place order');
    }
    throw error;
  }
}

export async function getUserBalance(userId: string) {
  const response = await axios.get(`${BASE_URL}/balance`, {
    params: { userId }, // Send userId as query parameter
  });
  return response.data;
}