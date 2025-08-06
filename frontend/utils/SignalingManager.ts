import { Candle, Ticker } from "./types";

export const BASE_URL = "ws://localhost:3002";

export class SignalingManager {
  private ws!: WebSocket;
  private static instance: SignalingManager;
  private callbacks: Map<string, Array<{ callBack: any; id: string }>> =
    new Map();
  private id: number;
  private bufferedMessage: any[] = [];
  private initialized: boolean = false;

  private constructor() {
    this.id = 1;
    this.init();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new SignalingManager();
    }
    return this.instance;
  }

  private init() {
    this.ws = new WebSocket(BASE_URL);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.initialized = true;
      this.bufferedMessage.forEach((message) => {
        console.log("Sending buffered message:", message);
        this.ws.send(JSON.stringify(message));
      });
      this.bufferedMessage = [];
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("Received WebSocket message:", message);

      // Handle subscription responses
      if (message.result !== undefined) {
        console.log("Subscription response:", message);
        return;
      }

      // Handle error responses
      if (message.error) {
        console.error("WebSocket error:", message.error);
        return;
      }

      const type = message.data?.e;
      console.log("Message type:", type);

      if (this.callbacks.has(type)) {
        const callbacks = this.callbacks.get(type)!;
        callbacks.forEach(({ callBack }) => {
          if (type === "ticker") {
            const newTicker: Partial<Ticker> = {
              lastPrice: message.data.c,
              high: message.data.h,
              low: message.data.l,
              volume: message.data.v,
              quoteVolume: message.data.V,
              symbol: message.data.s,
            };
            callBack(newTicker);
          }
          if (type === "depth") {
            const updatedBids = message.data.b || [];
            const updatedAsks = message.data.a || [];
            // console.log('Received depth update:', { bids: updatedBids, asks: updatedAsks });
            callBack({ bids: updatedBids, asks: updatedAsks });
          }
          if (type === "24hrMiniTicker") {
            const newTicker: Partial<Ticker> = {
              symbol: message.s,
              high: message.h,
              low: message.l,
              lastPrice: message.c,
              firstPrice: message.o,
              quoteVolume: message.q,
              volume: message.v,
            };

            callBack(newTicker);
          }
          // if (type === "markPrice") {
          //   // Fixed: Extract correct properties from WebSocket message
          //   const markPriceData = {
          //     price: message.data.p || message.data.c, // Use 'p' for price or 'c' for close price
          //     quantity: message.data.q || "0", // Quantity
          //     time: message.data.t || message.data.E || Date.now(), // Use 't' for time or 'E' for event time
          //   };
          //   console.log("Processed markPrice data:", markPriceData);
          //   callBack(markPriceData);
          // }
          // Add support for trades stream
          if (type === "markPrice") {
            const markPriceData = {
              price: message.data.p || message.data.c, // 'p' for price or 'c' for close
              quantity: message.data.q || "0",
              time: message.data.t || message.data.E || Date.now(),
            };
            console.log("Processed markPrice data:", markPriceData);
            callBack(markPriceData);
          }
          if (type === "kline") {
            const newCandle: Partial<Candle> = {
              time: message.k.t,
              open: message.k.o,
              high: message.k.h,
              low: message.k.l,
              close: message.k.c,
              isClosed: message.k.x,
            };

            callBack(newCandle);
          }
        });
      } else if (type) {
        console.log(`No callbacks registered for type: ${type}`);
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.ws.onclose = (event) => {
      console.log("WebSocket closed:", event);
      this.initialized = false;

      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        console.log("Attempting to reconnect...");
        this.init();
      }, 3000);
    };
  }

  async sendMessage(message: any): Promise<void> {
    const messageToSend = {
      ...message,
      id: this.id++,
    };

    console.log("Sending WebSocket message:", messageToSend);

    if (!this.initialized) {
      console.log("WebSocket not initialized, buffering message");
      this.bufferedMessage.push(messageToSend);
      return;
    }

    try {
      this.ws.send(JSON.stringify(messageToSend));
    } catch (error) {
      console.error("Error sending message:", error);
      this.bufferedMessage.push(messageToSend);
    }
  }

  async registerCallback(
    type: string,
    callBack: any,
    id: string
  ): Promise<void> {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, []);
    }

    const callbacks = this.callbacks.get(type)!;

    // Remove existing callback with same id to prevent duplicates
    const existingIndex = callbacks.findIndex((cb) => cb.id === id);
    if (existingIndex !== -1) {
      callbacks.splice(existingIndex, 1);
    }

    callbacks.push({ callBack, id });

    console.log(`Registered callback for type: ${type}, id: ${id}`);
  }

  async deRegisterCallback(type: string, id: string): Promise<void> {
    const callbacks = this.callbacks.get(type);
    if (!callbacks) return;

    const index = callbacks.findIndex((callback) => callback.id === id);
    if (index !== -1) {
      callbacks.splice(index, 1);
      console.log(`Deregistered callback for type: ${type}, id: ${id}`);

      // Clean up empty callback arrays
      if (callbacks.length === 0) {
        this.callbacks.delete(type);
      }
    }
  }
}
