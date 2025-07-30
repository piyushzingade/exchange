import axios from "axios";
import { Depth, KLine, Ticker, Trade } from "./types";

export const BASE_URL = "http://localhost:3333/api/v1";

export async function getAllTickers(): Promise<Ticker[]> {
  const response = await axios.get(`${BASE_URL}/tickers`);
  return response.data;
}

export async function getTicker(market: string): Promise<Ticker> {
  const tickers = await getAllTickers();

  // Try different matching strategies
  let ticker =
    // Exact match
    tickers.find((t) => t.symbol === market) ||
    // Case insensitive match
    tickers.find((t) => t.symbol.toLowerCase() === market.toLowerCase()) ||
    // Replace underscore with hyphen
    tickers.find((t) => t.symbol === market.replace("_", "-")) ||
    // Replace hyphen with underscore
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

export async function getKlines(
  market: string,
  interval: string,
  startTime: number,
  endTime: number
): Promise<KLine[]> {
  const response = await axios.get(
    `${BASE_URL}/klines?symbol=${market}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`
  );
  const data: KLine[] = response.data;
  return data.sort((x, y) => (Number(x.end) < Number(y.end) ? -1 : 1));
}

export async function getMarkets(): Promise<string[]> {
  const response = await axios.get(`${BASE_URL}/markets`);
  return response.data;
}
