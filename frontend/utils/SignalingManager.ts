import { Ticker } from "./types";

export const BASE_URL = "wss://ws.backpack.exchange/";

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
      this.initialized = true;
      this.bufferedMessage.forEach((message) => {
        this.ws.send(JSON.stringify(message));
      });
      this.bufferedMessage = [];
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const type = message.data.e;

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
            const updatedBids = message.data.b;
            const updatedAsks = message.data.a;
            callBack({ bids: updatedBids, asks: updatedAsks });
          }
        });
      }
    };
  }

  async sendMessage(message: any): Promise<void> {
    const messageToSend = {
      ...message,
      id: this.id++,
    };

    if (!this.initialized) {
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
