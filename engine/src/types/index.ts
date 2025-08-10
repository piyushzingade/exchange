export const TRADE_ADDED = "TRADE_ADDED";
export const ORDER_UPDATE = "ORDER_UPDATE";



export interface UserBalance {
  [asset: string]: {
    available: number; // Money they can spend
    locked: number; // Money locked in pending orders
  };
}


export  interface EngineSnapshot {
  orderbooks: any[];
  balances: [string, UserBalance][];
}

export interface TradeData {
  id: string;
  market: string;
  price: string;
  quantity: string;
  quoteQuantity: string;
  buyerUserId: string;
  sellerUserId: string;
  timestamp: number;
  isBuyerMaker: boolean;
}