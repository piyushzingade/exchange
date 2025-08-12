export interface KLine {
  close: string;
  end: string;
  high: string;
  low: string;
  open: string;
  quoteVolume: string;
  start: string;
  trades: string;
  volume: string;
  // timestamp:  Date
}

export interface Trade {
  id: number;
  isBuyerMaker: boolean;
  price: string;
  qty: string; 
  quoteQty: string; 
  time: number; // Changed from 'timestamp' to 'time'
  symbol?: string; // Added optional symbol field
}

export interface Depth {
  bids: [string, string][];
  asks: [string, string][];
  lastUpdateId: string;
}

export interface Ticker {
  firstPrice: string;
  high: string;
  lastPrice: string;
  low: string;
  priceChange: string;
  priceChangePercent: string;
  quoteVolume: string;
  symbol: string;
  trades: string;
  volume: string;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  end : number;
  isClosed?: boolean;
}
