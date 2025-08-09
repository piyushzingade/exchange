export type TickerUpdateMessage = {
  stream: string;
  data: {
    c?: string;
    h?: string;
    l?: string;
    v?: string;
    V?: string;
    s?: string;
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
    s: string;
  };
};

export type WsMessage =
  | TickerUpdateMessage
  | DepthUpdateMessage
  | MarkPriceUpdateMessage;
