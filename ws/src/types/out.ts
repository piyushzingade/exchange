export type TickerUpdateMessage = {
  type: "ticker";
  data: {
    c?: string; // Close price
    h?: string; // High price
    l?: string; // Low price
    v?: string; // Volume
    V?: string; // Quote volume
    s?: string; // Symbol
    id: number;
    e: "ticker";
  };
};

export type DepthUpdateMessage = {
  type: "depth";
  data: {
    b?: [string, string][]; // Bids
    a?: [string, string][]; // Asks
    id: number;
    e: "depth";
  };
};

export type TradeUpdateMessage = {
  type: "markPrice";
  data: {
    e: "trade";
    t: number; // Trade ID
    s: string; // Symbol/Market
    p: string; // Price
    q: string; // Quantity
    m: boolean; // Is buyer maker
    T: string
  };
};

// Fixed: Include TradeUpdateMessage in the union type
export type OutgoingMessage =
  | TickerUpdateMessage
  | DepthUpdateMessage
  | TradeUpdateMessage;
