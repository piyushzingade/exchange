import fs from "fs";
import { RedisManager } from "../RedisManager";
import { ORDER_UPDATE, TRADE_ADDED } from "../types/index";
import {
  CANCEL_ORDER,
  CREATE_ORDER,
  GET_DEPTH,
  GET_OPEN_ORDERS,
  MessageFromApi,
  ON_RAMP,
} from "../types/fromApi";
import { Fill, Order, Orderbook } from "./Orderbook";

// TODO: Replace floats with decimal library for precision (like PayTM project)
export const BASE_CURRENCY = "INR";

// User balance structure for each asset
interface UserBalance {
  [asset: string]: {
    available: number; // Available for trading
    locked: number; // Locked in pending orders
  };
}

// Snapshot structure for persistence
interface EngineSnapshot {
  orderbooks: any[];
  balances: [string, UserBalance][];
}

// Extended message types for internal error handling
type InternalMessageType =
  | "ORDER_PLACED"
  | "ORDER_CANCELLED"
  | "OPEN_ORDERS"
  | "DEPTH";

interface InternalMessage {
  type: InternalMessageType;
  payload: any;
}

export class Engine {
  private orderbooks: Orderbook[] = [];
  private balances: Map<string, UserBalance> = new Map();
  private snapshotInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeEngine();
    this.startSnapshotSaving();
  }

  /**
   * Initialize engine with snapshot data or default values
   */
  private initializeEngine(): void {
    const snapshot = this.loadSnapshot();

    if (snapshot) {
      console.log("Loading from snapshot...");
      this.restoreFromSnapshot(snapshot);
    } else {
      console.log("No snapshot found, initializing with defaults...");
      this.initializeDefaults();
    }
  }

  /**
   * Load snapshot from file system
   */
  private loadSnapshot(): EngineSnapshot | null {
    try {
      if (!process.env.WITH_SNAPSHOT) return null;

      const snapshotData = fs.readFileSync("./snapshot.json", "utf8");
      return JSON.parse(snapshotData);
    } catch (error) {
      console.log("Failed to load snapshot:", error);
      return null;
    }
  }

  /**
   * Restore engine state from snapshot
   */
  private restoreFromSnapshot(snapshot: EngineSnapshot): void {
    // Restore orderbooks with proper instantiation
    this.orderbooks = snapshot.orderbooks.map(
      (data) =>
        new Orderbook(
          data.baseAsset,
          data.bids,
          data.asks,
          data.lastTradeId,
          data.currentPrice
        )
    );

    // Restore user balances
    this.balances = new Map(snapshot.balances);
  }

  /**
   * Initialize with default orderbooks and demo balances
   */
  private initializeDefaults(): void {
    // Create default orderbook for TATA_INR market
    this.orderbooks = [
      new Orderbook("TATA_INR", [], [], 0, 0)
    ];
    this.createDemoUserBalances();
  }

  /**
   * Start automatic snapshot saving
   */
  private startSnapshotSaving(): void {
    // Save snapshot every 3 seconds
    this.snapshotInterval = setInterval(() => {
      this.saveSnapshot();
    }, 3000);
  }

  /**
   * Save current engine state to snapshot file
   */
  private saveSnapshot(): void {
    try {
      const snapshot: EngineSnapshot = {
        orderbooks: this.orderbooks.map((book) => book.getSnapshot()),
        balances: Array.from(this.balances.entries()),
      };

      fs.writeFileSync("./snapshot.json", JSON.stringify(snapshot, null, 2));
    } catch (error) {
      console.error("Failed to save snapshot:", error);
    }
  }

  /**
   * Main message processing entry point
   * Routes different message types to appropriate handlers
   */
  process({
    message,
    clientId,
  }: {
    message: MessageFromApi;
    clientId: string;
  }): void {
    try {
      switch (message.type) {
        case CREATE_ORDER:
          this.handleCreateOrder(message, clientId);
          break;

        case CANCEL_ORDER:
          this.handleCancelOrder(message, clientId);
          break;

        case GET_OPEN_ORDERS:
          this.handleGetOpenOrders(message, clientId);
          break;

        case ON_RAMP:
          this.handleOnRamp(message, clientId);
          break;

        case GET_DEPTH:
          this.handleGetDepth(message, clientId);
          break;

        default:
          console.warn(`Unknown message type: ${(message as any).type}`);
      }
    } catch (error) {
      console.error(`Error processing message type ${message.type}:`, error);
      this.sendErrorResponse(clientId, `Failed to process ${message.type}`);
    }
  }

  /**
   * Handle order creation requests
   */
  private handleCreateOrder(message: any, clientId: string): void {
    try {
      const { market, price, quantity, side, userId } = message.data;
      const result = this.createOrder(market, price, quantity, side, userId);

      // Send success response to API
      RedisManager.getInstance().sendToApi(clientId, {
        type: "ORDER_PLACED",
        payload: {
          orderId: result.orderId,
          executedQty: result.executedQty,
          fills: result.fills,
        },
      });
    } catch (error) {
      console.error("Order creation failed:", error);
      // Send failure response to API
      RedisManager.getInstance().sendToApi(clientId, {
        type: "ORDER_CANCELLED",
        payload: {
          orderId: "",
          executedQty: 0,
          remainingQty: 0,
        },
      });
    }
  }

  /**
   * Handle order cancellation requests
   */
  private handleCancelOrder(message: any, clientId: string): void {
    try {
      const { orderId, market } = message.data;
      const orderbook = this.findOrderbook(market);
      const [baseAsset] = market.split("_");

      // Find the order in either bids or asks
      const order = this.findOrderById(orderbook, orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Cancel order and unlock funds
      const cancelledPrice = this.cancelOrderAndUnlockFunds(
        orderbook,
        order,
        baseAsset
      );

      // Notify about depth changes if order was cancelled
      if (cancelledPrice !== undefined) {
        this.sendDepthUpdate(cancelledPrice.toString(), market);
      }

      // Send success response
      RedisManager.getInstance().sendToApi(clientId, {
        type: "ORDER_CANCELLED",
        payload: {
          orderId,
          executedQty: 0,
          remainingQty: 0,
        },
      });
    } catch (error) {
      console.error("Order cancellation failed:", error);
    }
  }

  /**
   * Handle requests for user's open orders
   */
  private handleGetOpenOrders(message: any, clientId: string): void {
    try {
      const { market, userId } = message.data;
      const orderbook = this.findOrderbook(market);
      const openOrders = orderbook.getOpenOrders(userId);

      RedisManager.getInstance().sendToApi(clientId, {
        type: "OPEN_ORDERS",
        payload: openOrders,
      });
    } catch (error) {
      console.error("Failed to get open orders:", error);
      RedisManager.getInstance().sendToApi(clientId, {
        type: "OPEN_ORDERS",
        payload: [],
      });
    }
  }

  /**
   * Handle user fund deposits (on-ramp)
   */
  private handleOnRamp(message: any, clientId: string): void {
    const { userId, amount } = message.data;
    this.addFundsToUser(userId, Number(amount));
  }

  /**
   * Handle market depth requests
   */
  private handleGetDepth(message: any, clientId: string): void {
    try {
      const { market } = message.data;
      const orderbook = this.findOrderbook(market);
      const depth = orderbook.getDepth();

      RedisManager.getInstance().sendToApi(clientId, {
        type: "DEPTH",
        payload: depth,
      });
    } catch (error) {
      console.error("Failed to get depth:", error);
      RedisManager.getInstance().sendToApi(clientId, {
        type: "DEPTH",
        payload: { bids: [], asks: [] },
      });
    }
  }

  /**
   * Core order creation logic
   * 1. Validates market and funds
   * 2. Locks required funds
   * 3. Matches order against existing orders
   * 4. Updates balances and sends notifications
   */
  createOrder(
    market: string,
    price: string,
    quantity: string,
    side: "buy" | "sell",
    userId: string
  ): { executedQty: number; fills: Fill[]; orderId: string } {
    const orderbook = this.findOrderbook(market);
    const [baseAsset, quoteAsset] = market.split("_");

    // Validate and lock funds before creating order
    this.validateAndLockFunds(
      baseAsset,
      quoteAsset,
      side,
      userId,
      price,
      quantity
    );

    // Create order object
    const order: Order = {
      price: Number(price),
      quantity: Number(quantity),
      orderId: this.generateOrderId(),
      filled: 0,
      side,
      userId,
    };

    // Execute order matching
    const { fills, executedQty } = orderbook.addOrder(order);

    // Update user balances based on fills
    this.processOrderFills(userId, baseAsset, quoteAsset, side, fills);

    // Send notifications and updates
    this.notifyOrderExecution(order, executedQty, fills, market, userId);

    return {
      executedQty,
      fills,
      orderId: order.orderId,
    };
  }

  /**
   * Process all fills from an order execution
   * Updates balances for both maker and taker
   */
  private processOrderFills(
    userId: string,
    baseAsset: string,
    quoteAsset: string,
    side: "buy" | "sell",
    fills: Fill[]
  ): void {
    for (const fill of fills) {
      const fillValue = fill.qty * Number(fill.price);

      if (side === "buy") {
        // Buyer receives base asset, pays quote asset
        this.updateUserBalance(userId, baseAsset, fill.qty, 0); // Add base
        this.updateUserBalance(userId, quoteAsset, 0, -fillValue); // Unlock quote

        // Seller receives quote asset, gives base asset
        this.updateUserBalance(fill.otherUserId, quoteAsset, fillValue, 0); // Add quote
        this.updateUserBalance(fill.otherUserId, baseAsset, 0, -fill.qty); // Unlock base
      } else {
        // Seller receives quote asset, gives base asset
        this.updateUserBalance(userId, quoteAsset, fillValue, 0); // Add quote
        this.updateUserBalance(userId, baseAsset, 0, -fill.qty); // Unlock base

        // Buyer receives base asset, pays quote asset
        this.updateUserBalance(fill.otherUserId, baseAsset, fill.qty, 0); // Add base
        this.updateUserBalance(fill.otherUserId, quoteAsset, 0, -fillValue); // Unlock quote
      }
    }
  }

  /**
   * Send all notifications after order execution
   */
  private notifyOrderExecution(
    order: Order,
    executedQty: number,
    fills: Fill[],
    market: string,
    userId: string
  ): void {
    // Update database with order and fill information
    this.updateDatabaseOrders(order, executedQty, fills, market);
    this.createDatabaseTrades(fills, market, userId);

    // Send WebSocket updates
    this.publishDepthUpdates(fills, order.price.toString(), order.side, market);
    this.publishTradeUpdates(fills, userId, market);
  }

  /**
   * Validate user has sufficient funds and lock them
   */
  private validateAndLockFunds(
    baseAsset: string,
    quoteAsset: string,
    side: "buy" | "sell",
    userId: string,
    price: string,
    quantity: string
  ): void {
    const userBalance = this.getUserBalance(userId);
    const numPrice = Number(price);
    const numQuantity = Number(quantity);

    if (side === "buy") {
      // Buying: need quote asset (e.g., INR to buy TATA)
      const requiredAmount = numQuantity * numPrice;
      const available = userBalance[quoteAsset]?.available || 0;

      if (available < requiredAmount) {
        throw new Error(
          `Insufficient ${quoteAsset} balance. Required: ${requiredAmount}, Available: ${available}`
        );
      }

      // Lock quote asset
      this.updateUserBalance(
        userId,
        quoteAsset,
        -requiredAmount,
        requiredAmount
      );
    } else {
      // Selling: need base asset (e.g., TATA to sell for INR)
      const available = userBalance[baseAsset]?.available || 0;

      if (available < numQuantity) {
        throw new Error(
          `Insufficient ${baseAsset} balance. Required: ${numQuantity}, Available: ${available}`
        );
      }

      // Lock base asset
      this.updateUserBalance(userId, baseAsset, -numQuantity, numQuantity);
    }
  }

  /**
   * Cancel order and unlock the appropriate funds
   */
  private cancelOrderAndUnlockFunds(
    orderbook: Orderbook,
    order: Order,
    baseAsset: string
  ): number | undefined {
    const remainingQuantity = order.quantity - order.filled;
    let cancelledPrice: number | undefined;

    if (order.side === "buy") {
      cancelledPrice = orderbook.cancelBid(order);
      if (cancelledPrice !== undefined) {
        // Unlock quote asset (INR)
        const lockedAmount = remainingQuantity * order.price;
        this.updateUserBalance(
          order.userId,
          BASE_CURRENCY,
          lockedAmount,
          -lockedAmount
        );
      }
    } else {
      cancelledPrice = orderbook.cancelAsk(order);
      if (cancelledPrice !== undefined) {
        // Unlock base asset (e.g., TATA)
        this.updateUserBalance(
          order.userId,
          baseAsset,
          remainingQuantity,
          -remainingQuantity
        );
      }
    }

    return cancelledPrice;
  }

  /**
   * Update database with order information
   */
  private updateDatabaseOrders(
    order: Order,
    executedQty: number,
    fills: Fill[],
    market: string
  ): void {
    // Update taker order
    RedisManager.getInstance().pushMessage({
      type: ORDER_UPDATE,
      data: {
        orderId: order.orderId,
        executedQty,
        market,
        price: order.price.toString(),
        quantity: order.quantity.toString(),
        side: order.side,
      },
    });

    // Update maker orders
    fills.forEach((fill) => {
      RedisManager.getInstance().pushMessage({
        type: ORDER_UPDATE,
        data: {
          orderId: fill.markerOrderId,
          executedQty: fill.qty,
        },
      });
    });
  }

  /**
   * Create trade records in database
   */
  private createDatabaseTrades(
    fills: Fill[],
    market: string,
    userId: string
  ): void {
    fills.forEach((fill) => {
      RedisManager.getInstance().pushMessage({
        type: TRADE_ADDED,
        data: {
          market,
          id: fill.tradeId.toString(),
          isBuyerMaker: fill.otherUserId === userId,
          price: fill.price,
          quantity: fill.qty.toString(),
          quoteQuantity: (fill.qty * Number(fill.price)).toString(),
          timestamp: Date.now(),
        },
      });
    });
  }

  /**
   * Publish trade updates to WebSocket subscribers
   */
  private publishTradeUpdates(
    fills: Fill[],
    userId: string,
    market: string
  ): void {
    fills.forEach((fill) => {
      RedisManager.getInstance().publishMessage(`trade@${market}`, {
        stream: `trade@${market}`,
        data: {
          e: "trade",
          t: fill.tradeId,
          m: fill.otherUserId === userId, // Is maker
          p: fill.price,
          q: fill.qty.toString(),
          s: market,
        },
      });
    });
  }

  /**
   * Publish market depth updates to WebSocket subscribers
   */
  private publishDepthUpdates(
    fills: Fill[],
    orderPrice: string,
    side: "buy" | "sell",
    market: string
  ): void {
    const orderbook = this.findOrderbook(market);
    const depth = orderbook.getDepth();
    
    // Send current state immediately
    this.publishDepthMessage(market, depth.asks, depth.bids);
    
    // Schedule another update to ensure state is consistent
    setTimeout(() => {
      const updatedDepth = orderbook.getDepth();
      this.publishDepthMessage(market, updatedDepth.asks, updatedDepth.bids);
    }, 100);
  }

  /**
   * Send depth update for a specific price level
   */
  private sendDepthUpdate(price: string, market: string): void {
    const orderbook = this.findOrderbook(market);
    const depth = orderbook.getDepth();

    const updatedBids = depth.bids.filter((bid) => bid[0] === price);
    const updatedAsks = depth.asks.filter((ask) => ask[0] === price);

    // If no quantity at this price, send zero quantity update
    const bidsUpdate: [string, string][] = updatedBids.length
      ? updatedBids
      : [[price, "0"]];
    const asksUpdate: [string, string][] = updatedAsks.length
      ? updatedAsks
      : [[price, "0"]];

    this.publishDepthMessage(market, asksUpdate, bidsUpdate);
  }

  /**
   * Helper to publish depth message to WebSocket
   */
  private publishDepthMessage(
    market: string,
    asks: [string, string][],
    bids: [string, string][]
  ): void {
    RedisManager.getInstance().publishMessage(`depth@${market}`, {
      stream: `depth@${market}`,
      data: {
        a: asks,
        b: bids,
        e: "depth",
      },
    });
  }

  /**
   * Add funds to user account (on-ramp functionality)
   */
  private addFundsToUser(userId: string, amount: number): void {
    const userBalance = this.balances.get(userId);

    if (!userBalance) {
      // Create new user with initial balance
      this.balances.set(userId, {
        [BASE_CURRENCY]: {
          available: amount,
          locked: 0,
        },
      });
    } else {
      // Add to existing balance
      if (!userBalance[BASE_CURRENCY]) {
        userBalance[BASE_CURRENCY] = { available: 0, locked: 0 };
      }
      userBalance[BASE_CURRENCY].available += amount;
    }
  }

  /**
   * Create demo user balances for testing
   */
  private createDemoUserBalances(): void {
    const demoUsers = ["1", "2", "3", "4", "5"];
    const initialBalance = 10_000_000; 

    demoUsers.forEach((userId) => {
      this.balances.set(userId, {
        [BASE_CURRENCY]: {
          available: initialBalance,
          locked: 0,
        },
        TATA: {
          available: initialBalance,
          locked: 0,
        },
      });
    });
  }

  // ===== UTILITY METHODS =====

  /**
   * Find orderbook by market ticker
   */
  private findOrderbook(market: string): Orderbook {
    const orderbook = this.orderbooks.find((book) => book.ticker() === market);
    if (!orderbook) {
      throw new Error(`Orderbook not found for market: ${market}`);
    }
    return orderbook;
  }

  /**
   * Find order by ID in orderbook
   */
  private findOrderById(
    orderbook: Orderbook,
    orderId: string
  ): Order | undefined {
    return [...orderbook.bids, ...orderbook.asks].find(
      (order) => order.orderId === orderId
    );
  }

  /**
   * Get user balance, creating default if doesn't exist
   */
  private getUserBalance(userId: string): UserBalance {
    let balance = this.balances.get(userId);
    if (!balance) {
      balance = {};
      this.balances.set(userId, balance);
    }
    return balance;
  }

  /**
   * Update user balance for a specific asset
   */
  private updateUserBalance(
    userId: string,
    asset: string,
    availableDelta: number,
    lockedDelta: number
  ): void {
    const userBalance = this.getUserBalance(userId);

    if (!userBalance[asset]) {
      userBalance[asset] = { available: 0, locked: 0 };
    }

    userBalance[asset].available += availableDelta;
    userBalance[asset].locked += lockedDelta;

    // Ensure balances don't go negative
    if (userBalance[asset].available < 0) {
      console.warn(
        `Negative available balance for user ${userId}, asset ${asset}`
      );
      userBalance[asset].available = 0;
    }
    if (userBalance[asset].locked < 0) {
      console.warn(
        `Negative locked balance for user ${userId}, asset ${asset}`
      );
      userBalance[asset].locked = 0;
    }
  }

  /**
   * Generate unique order ID
   */
  private generateOrderId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Send error response to API
   * Note: This might need to be adjusted based on your MessageToApi type definitions
   */
  private sendErrorResponse(clientId: string, error: string): void {
    // Since ERROR type might not be defined in MessageToApi,
    // we'll send an ORDER_CANCELLED response instead
    RedisManager.getInstance().sendToApi(clientId, {
      type: "ORDER_CANCELLED",
      payload: {
        orderId: "",
        executedQty: 0,
        remainingQty: 0,
      },
    });
    console.error(`Error for client ${clientId}: ${error}`);
  }

  /**
   * Add new orderbook to engine
   */
  addOrderbook(orderbook: Orderbook): void {
    this.orderbooks.push(orderbook);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }
    this.saveSnapshot(); // Final snapshot save
  }
}
