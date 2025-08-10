

// WebSocket message types - shared between engine and ws layer
export type TickerUpdateMessage = {
  stream: string;
  data: {
    c?: string; // close/current price
    h?: string; // high price
    l?: string; // low price
    v?: string; // volume
    V?: string; // quote volume
    s?: string; // symbol
    o?: string; // open price
    id: number;
    e: "ticker";
  };
};

export type DepthUpdateMessage = {
  stream: string;
  data: {
    b?: [string, string][];
    a?: [string, string][];
    e: "depth";
  };
};

export type MarkPriceUpdateMessage = {
  stream: string;
  data: {
    e: "markPrice";
    t: number;
    m: boolean;
    p: string;
    q: string;
    s: string; // symbol
  };
};

export type WsMessage =
  | TickerUpdateMessage
  | DepthUpdateMessage
  | MarkPriceUpdateMessage;