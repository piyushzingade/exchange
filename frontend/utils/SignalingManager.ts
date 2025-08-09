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

  // Track active subscriptions to prevent duplicates
  private activeSubscriptions: Set<string> = new Set();
  private pendingSubscriptions: Set<string> = new Set();

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
      console.log("✅ WebSocket connected to", BASE_URL);
      this.initialized = true;

      // Send all buffered messages
      this.bufferedMessage.forEach((message) => {
        console.log("📤 Sending buffered message:", message);
        this.ws.send(JSON.stringify(message));

        // Track subscription
        if (message.method === "SUBSCRIBE") {
          message.params?.forEach((param: string) => {
            this.activeSubscriptions.add(param);
            this.pendingSubscriptions.delete(param);
          });
        }
      });
      this.bufferedMessage = [];
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // Handle subscription confirmation responses
      if (message.result !== undefined) {
        console.log("✅ Subscription confirmed:", message);
        return;
      }

      // Handle error responses
      if (message.error) {
        console.error("❌ WebSocket error:", message.error);
        return;
      }

      // Handle data messages
      const type = message.data?.e;
      if (!type) {
        console.log("⚠️ Message without type:", message);
        return;
      }

      console.log(`📥 Received ${type} update:`, message.data);

      if (this.callbacks.has(type)) {
        const callbacks = this.callbacks.get(type)!;

        callbacks.forEach(({ callBack }) => {
          try {
            // Handle ticker updates
            if (type === "ticker") {
              const newTicker: Partial<Ticker> = {
                lastPrice: message.data.c,
                high: message.data.h,
                low: message.data.l,
                volume: message.data.v,
                quoteVolume: message.data.V,
                symbol: message.data.s,
                // openPrice: message.data.o,
                priceChange: message.data.priceChange,
                priceChangePercent: message.data.priceChangePercent,
              };
              callBack(newTicker);
            }

            // Handle depth (order book) updates
            else if (type === "depth") {
              const updatedBids = message.data.b || [];
              const updatedAsks = message.data.a || [];
              callBack({ bids: updatedBids, asks: updatedAsks });
            }

            // Handle 24hr mini ticker
            else if (type === "24hrMiniTicker") {
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

            // Handle markPrice updates (individual trades)
            else if (type === "markPrice") {
              const markPriceData = {
                price: message.data.p,
                quantity: message.data.q,
                time: message.data.t || Date.now(),
                symbol: message.data.s,
                isBuyerMaker: message.data.m,
                // For compatibility with existing code
                p: message.data.p,
                q: message.data.q,
                t: message.data.t,
                m: message.data.m,
              };
              console.log("📊 Processed markPrice data:", markPriceData);
              callBack(markPriceData);
            }

            // Handle candlestick (kline) updates
            else if (type === "kline") {
              const newCandle: Partial<Candle> = {
                time: message.k.t,
                open: message.k.o,
                high: message.k.h,
                low: message.k.l,
                close: message.k.c,
                isClosed: message.k.x,
              };
              callBack(newCandle);
            } else {
              console.log(
                `🔄 Passing raw data for type ${type}:`,
                message.data
              );
              callBack(message.data);
            }
          } catch (error) {
            console.error(`❌ Error in callback for ${type}:`, error);
          }
        });
      } else {
        console.log(`⚠️ No callbacks registered for type: ${type}`);
      }
    };

    this.ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    this.ws.onclose = (event) => {
      console.log("🔌 WebSocket closed:", event.code, event.reason);
      this.initialized = false;
      this.activeSubscriptions.clear();
      this.pendingSubscriptions.clear();

      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        console.log("🔄 Attempting to reconnect...");
        this.init();
      }, 3000);
    };
  }

  async sendMessage(message: any): Promise<void> {
    const messageToSend = {
      ...message,
      id: this.id++,
    };

    console.log("📤 Sending WebSocket message:", messageToSend);

    if (!this.initialized) {
      console.log("⏳ WebSocket not ready, buffering message");
      this.bufferedMessage.push(messageToSend);
      return;
    }

    try {
      this.ws.send(JSON.stringify(messageToSend));

      // Track subscriptions
      if (messageToSend.method === "SUBSCRIBE") {
        messageToSend.params?.forEach((param: string) => {
          this.activeSubscriptions.add(param);
          this.pendingSubscriptions.delete(param);
          console.log(`✅ Subscribed to: ${param}`);
        });
      } else if (messageToSend.method === "UNSUBSCRIBE") {
        messageToSend.params?.forEach((param: string) => {
          this.activeSubscriptions.delete(param);
          this.pendingSubscriptions.delete(param);
          console.log(`❌ Unsubscribed from: ${param}`);
        });
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      this.bufferedMessage.push(messageToSend);
    }
  }

  async subscribe(streams: string[]): Promise<void> {
    const streamsToSubscribe = streams.filter((stream) => {
      if (
        this.activeSubscriptions.has(stream) ||
        this.pendingSubscriptions.has(stream)
      ) {
        console.log(`⚠️ Already subscribed/pending to: ${stream}`);
        return false;
      }
      return true;
    });

    if (streamsToSubscribe.length === 0) {
      console.log("ℹ️ No new streams to subscribe to");
      return;
    }

    // Mark as pending
    streamsToSubscribe.forEach((stream) => {
      this.pendingSubscriptions.add(stream);
    });

    await this.sendMessage({
      method: "SUBSCRIBE",
      params: streamsToSubscribe,
    });
  }

  async unsubscribe(streams: string[]): Promise<void> {
    const streamsToUnsubscribe = streams.filter((stream) => {
      return this.activeSubscriptions.has(stream);
    });

    if (streamsToUnsubscribe.length === 0) {
      console.log("ℹ️ No active streams to unsubscribe from");
      return;
    }

    await this.sendMessage({
      method: "UNSUBSCRIBE",
      params: streamsToUnsubscribe,
    });
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
      console.log(`🔄 Replaced existing callback for type: ${type}, id: ${id}`);
    }

    callbacks.push({ callBack, id });
    console.log(`✅ Registered callback for type: ${type}, id: ${id}`);
  }

  async deRegisterCallback(type: string, id: string): Promise<void> {
    const callbacks = this.callbacks.get(type);
    if (!callbacks) return;

    const index = callbacks.findIndex((callback) => callback.id === id);
    if (index !== -1) {
      callbacks.splice(index, 1);
      console.log(`❌ Deregistered callback for type: ${type}, id: ${id}`);

      // Clean up empty callback arrays
      if (callbacks.length === 0) {
        this.callbacks.delete(type);
        console.log(`🧹 Cleaned up empty callbacks for type: ${type}`);
      }
    }
  }

  // Utility methods for debugging
  getActiveSubscriptions(): string[] {
    return Array.from(this.activeSubscriptions);
  }

  getPendingSubscriptions(): string[] {
    return Array.from(this.pendingSubscriptions);
  }

  getRegisteredCallbacks(): string[] {
    return Array.from(this.callbacks.keys());
  }

  isConnected(): boolean {
    return this.initialized && this.ws.readyState === WebSocket.OPEN;
  }
}
