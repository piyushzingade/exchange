import { RedisClientType, createClient } from "redis";
import { UserManager } from "./UserManager";

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private subscriptions: Map<string, string[]> = new Map();
  private reverseSubscriptions: Map<string, string[]> = new Map();
  private redisClient: RedisClientType;

  private constructor() {
    this.redisClient = createClient();
    this.redisClient.connect();
    console.log("Connected to Redis for WebSocket subscriptions");
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new SubscriptionManager();
    }
    return this.instance;
  }

  public subscribe(userId: string, subscription: string) {
    if (this.subscriptions.get(userId)?.includes(subscription)) {
      return;
    }

    this.subscriptions.set(
      userId,
      (this.subscriptions.get(userId) || []).concat(subscription)
    );
    this.reverseSubscriptions.set(
      subscription,
      (this.reverseSubscriptions.get(subscription) || []).concat(userId)
    );

    // Only subscribe to Redis channel if this is the first subscriber
    if (this.reverseSubscriptions.get(subscription)?.length === 1) {
      console.log(`Subscribing to Redis channel: ${subscription}`);
      this.redisClient.subscribe(subscription, this.redisCallbackHandler);
    }
  }

  private redisCallbackHandler = (message: string, channel: string) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log(`Broadcasting message to ${channel}:`, parsedMessage);

      this.reverseSubscriptions.get(channel)?.forEach((userId) => {
        const user = UserManager.getInstance().getUser(userId);
        if (user) {
          user.emit(parsedMessage);
        }
      });
    } catch (error) {
      console.error("Error parsing Redis message:", error);
    }
  };

  public unsubscribe(userId: string, subscription: string) {
    const subscriptions = this.subscriptions.get(userId);
    if (subscriptions) {
      this.subscriptions.set(
        userId,
        subscriptions.filter((s) => s !== subscription)
      );
    }

    const reverseSubscriptions = this.reverseSubscriptions.get(subscription);
    if (reverseSubscriptions) {
      this.reverseSubscriptions.set(
        subscription,
        reverseSubscriptions.filter((s) => s !== userId)
      );

      // Unsubscribe from Redis channel if no more subscribers
      if (this.reverseSubscriptions.get(subscription)?.length === 0) {
        this.reverseSubscriptions.delete(subscription);
        console.log(`Unsubscribing from Redis channel: ${subscription}`);
        this.redisClient.unsubscribe(subscription);
      }
    }
  }

  public userLeft(userId: string) {
    console.log(`User ${userId} left`);
    this.subscriptions.get(userId)?.forEach((s) => this.unsubscribe(userId, s));
    this.subscriptions.delete(userId);
  }

  getSubscriptions(userId: string) {
    return this.subscriptions.get(userId) || [];
  }
}
