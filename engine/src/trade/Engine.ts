import fs from "fs";
import { RedisManager } from "../RedisManager";
import { EngineSnapshot, ORDER_UPDATE, TRADE_ADDED, TradeData, UserBalance } from "../types/index";
import {
  CANCEL_ORDER,
  CREATE_ORDER,
  GET_DEPTH,
  GET_OPEN_ORDERS,
  MessageFromApi,
  ON_RAMP,
} from "../types/fromApi";
import { Fill, Order, Orderbook } from "./Orderbook";
import { DepthUpdateMessage, MarkPriceUpdateMessage, TickerUpdateMessage } from "../types/toWs";

export const BASE_CURRENCY = "INR";




export class Engine {
  private orderbooks: Orderbook[] = [];
  private balances: Map<string, UserBalance> = new Map();
  private snapshotInterval: NodeJS.Timeout | null = null;

  // Track market statistics for ticker updates
  private marketStats: Map<
    string,
    {
      lastPrice: string;
      high24h: string;
      low24h: string;
      volume24h: string;
      quoteVolume24h: string;
      openPrice: string;
      priceChange24h: string;
      priceChangePercent24h: string;
    }
  > = new Map();

  constructor() {
    this.initializeEngine();
    this.startAutoSave();
  }


  private initializeEngine(): void {
    const savedData = this.loadSavedData();

    if (savedData) {
      console.log(" Loading previous data...");
      this.restoreFromSavedData(savedData);
    } else {
      console.log(" Starting fresh - no saved data found");
      this.setupDefaultData();
    }
  }

  private loadSavedData(): EngineSnapshot | null {
    try {
      if (!process.env.WITH_SNAPSHOT) return null;

      const data = fs.readFileSync("./snapshot.json", "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.log("No saved data found, starting fresh");
      return null;
    }
  }

  private restoreFromSavedData(snapshot: EngineSnapshot): void {
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

    this.balances = new Map(snapshot.balances);

    // Initialize market stats for each orderbook
    this.orderbooks.forEach((orderbook) => {
      const market = orderbook.ticker();
      this.initializeMarketStats(market);
    });
  }

  private setupDefaultData(): void {
    this.orderbooks = [new Orderbook("TATA_INR", [], [], 0, 0)];
    this.createDemoUsers();
    this.initializeMarketStats("TATA_INR");
  }

  private initializeMarketStats(market: string): void {
    if (!this.marketStats.has(market)) {
      this.marketStats.set(market, {
        lastPrice: "0",
        high24h: "0",
        low24h: "0",
        volume24h: "0",
        quoteVolume24h: "0",
        openPrice: "0",
        priceChange24h: "0",
        priceChangePercent24h: "0",
      });
    }
  }

  private createDemoUsers(): void {
    const startingMoney = 10_000_000;
    const startingShares = 10_000_000;

    for (let userId = 1; userId <= 5; userId++) {
      this.balances.set(userId.toString(), {
        [BASE_CURRENCY]: { available: startingMoney, locked: 0 },
        TATA: { available: startingShares, locked: 0 },
      });
    }
  }


  private startAutoSave(): void {
    this.snapshotInterval = setInterval(() => {
      this.saveDataToDisk();
    }, 3000);
  }

  private saveDataToDisk(): void {
    try {
      const dataToSave: EngineSnapshot = {
        orderbooks: this.orderbooks.map((book) => book.getSnapshot()),
        balances: Array.from(this.balances.entries()),
      };

      fs.writeFileSync("./snapshot.json", JSON.stringify(dataToSave, null, 2));
    } catch (error) {
      console.error("Failed to save data:", error);
    }
  }


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
          this.handleNewOrder(message, clientId);
          break;
        case CANCEL_ORDER:
          this.handleCancelOrder(message, clientId);
          break;
        case GET_OPEN_ORDERS:
          this.handleGetOpenOrders(message, clientId);
          break;
        case ON_RAMP:
          this.handleAddMoney(message, clientId);
          break;
        case GET_DEPTH:
          this.handleGetDepth(message, clientId);
          break;
        default:
          console.log(` Unknown request type: ${(message as any).type}`);
      }
    } catch (error) {
      console.error(` Error processing ${message.type}:`, error);
      this.sendErrorResponse(clientId, `Failed to process ${message.type}`);
    }
  }

  private handleNewOrder(message: any, clientId: string): void {
    try {
      const { market, price, quantity, side, userId } = message.data;
      const result = this.createNewOrder(market, price, quantity, side, userId);

      RedisManager.getInstance().sendToApi(clientId, {
        type: "ORDER_PLACED",
        payload: {
          orderId: result.orderId,
          executedQty: result.executedQty,
          fills: result.fills,
        },
      });
    } catch (error) {
      console.error(" Order failed:", error);

      RedisManager.getInstance().sendToApi(clientId, {
        type: "ORDER_CANCELLED",
        payload: { orderId: "", executedQty: 0, remainingQty: 0 },
      });
    }
  }

  private handleCancelOrder(message: any, clientId: string): void {
    try {
      const { orderId, market } = message.data;
      const orderbook = this.findOrderbook(market);
      const [baseAsset] = market.split("_");

      const order = this.findOrderById(orderbook, orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      const cancelledPrice = this.cancelOrderAndRefundMoney(
        orderbook,
        order,
        baseAsset
      );

      if (cancelledPrice !== undefined) {
        this.updateOrderBookDisplay(cancelledPrice.toString(), market);
      }

      RedisManager.getInstance().sendToApi(clientId, {
        type: "ORDER_CANCELLED",
        payload: { orderId, executedQty: 0, remainingQty: 0 },
      });
    } catch (error) {
      console.error("Cancel failed:", error);
    }
  }

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
      console.error("Failed to get orders:", error);
      RedisManager.getInstance().sendToApi(clientId, {
        type: "OPEN_ORDERS",
        payload: [],
      });
    }
  }

  private handleAddMoney(message: any, clientId: string): void {
    const { userId, amount } = message.data;
    this.addMoneyToUser(userId, Number(amount));
  }

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
      console.error("Failed to get prices:", error);
      RedisManager.getInstance().sendToApi(clientId, {
        type: "DEPTH",
        payload: { bids: [], asks: [] },
      });
    }
  }


  createNewOrder(
    market: string,
    price: string,
    quantity: string,
    side: "buy" | "sell",
    userId: string
  ): { executedQty: number; fills: Fill[]; orderId: string } {
    console.log(
      `New ${side} order: ${quantity} ${market} at ₹${price} by user ${userId}`
    );

    const orderbook = this.findOrderbook(market);
    const [baseAsset, quoteAsset] = market.split("_");

    this.checkAndLockUserFunds(
      baseAsset,
      quoteAsset,
      side,
      userId,
      price,
      quantity
    );

    const order: Order = {
      price: Number(price),
      quantity: Number(quantity),
      orderId: this.generateUniqueOrderId(),
      filled: 0,
      side,
      userId,
    };

    const { fills, executedQty } = orderbook.addOrder(order);

    console.log(
      `Order processed: ${executedQty} shares executed, ${fills.length} trades made`
    );

    this.updateBalancesAfterTrades(userId, baseAsset, quoteAsset, side, fills);
    this.processTradeResults(order, executedQty, fills, market, userId);

    return { executedQty, fills, orderId: order.orderId };
  }

  private checkAndLockUserFunds(
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
      const moneyNeeded = numQuantity * numPrice;
      const moneyAvailable = userBalance[quoteAsset]?.available || 0;

      if (moneyAvailable < moneyNeeded) {
        throw new Error(
          `Not enough ${quoteAsset}! Need: ₹${moneyNeeded}, Have: ₹${moneyAvailable}`
        );
      }

      this.updateUserBalance(userId, quoteAsset, -moneyNeeded, moneyNeeded);
    } else {
      const sharesAvailable = userBalance[baseAsset]?.available || 0;

      if (sharesAvailable < numQuantity) {
        throw new Error(
          `Not enough ${baseAsset}! Need: ${numQuantity}, Have: ${sharesAvailable}`
        );
      }

      this.updateUserBalance(userId, baseAsset, -numQuantity, numQuantity);
    }
  }

  private updateBalancesAfterTrades(
    userId: string,
    baseAsset: string,
    quoteAsset: string,
    side: "buy" | "sell",
    fills: Fill[]
  ): void {
    for (const fill of fills) {
      const tradeValue = fill.qty * Number(fill.price);

      if (side === "buy") {
        this.updateUserBalance(userId, baseAsset, fill.qty, 0);
        this.updateUserBalance(userId, quoteAsset, 0, -tradeValue);

        this.updateUserBalance(fill.otherUserId, quoteAsset, tradeValue, 0);
        this.updateUserBalance(fill.otherUserId, baseAsset, 0, -fill.qty);
      } else {
        this.updateUserBalance(userId, quoteAsset, tradeValue, 0);
        this.updateUserBalance(userId, baseAsset, 0, -fill.qty);

        this.updateUserBalance(fill.otherUserId, baseAsset, fill.qty, 0);
        this.updateUserBalance(fill.otherUserId, quoteAsset, 0, -tradeValue);
      }
    }
  }

  private processTradeResults(
    order: Order,
    executedQty: number,
    fills: Fill[],
    market: string,
    userId: string
  ): void {
    // Process each individual fill as a separate trade
    for (const fill of fills) {
      const tradeData = this.createTradeRecord(fill, order, market, userId);
      this.saveTradeToDatabase(tradeData);

      // Send individual trade updates for EVERY fill (even 1 qty fills)
      this.sendMarkPriceUpdate(fill, market, order.side);

      // Update market statistics
      this.updateMarketStats(market, fill);
    }

    // Send ticker update if any trades happened
    if (fills.length > 0) {
      this.sendTickerUpdate(market);
    }

    this.updateOrderInDatabase(order, executedQty, fills, market);
    this.updateOrderBookDisplay(order.price.toString(), market);
  }

  private updateMarketStats(market: string, fill: Fill): void {
    const stats = this.marketStats.get(market);
    if (!stats) return;

    const price = Number(fill.price);
    const quantity = fill.qty;
    const quoteVolume = price * quantity;

    // Update last price
    stats.lastPrice = fill.price;

    // Update 24h high/low (simplified - in production you'd track time)
    if (stats.high24h === "0" || price > Number(stats.high24h)) {
      stats.high24h = fill.price;
    }
    if (stats.low24h === "0" || price < Number(stats.low24h)) {
      stats.low24h = fill.price;
    }

    // Update volumes
    stats.volume24h = (Number(stats.volume24h) + quantity).toString();
    stats.quoteVolume24h = (
      Number(stats.quoteVolume24h) + quoteVolume
    ).toString();

    // Calculate price change (simplified)
    if (stats.openPrice !== "0") {
      const priceChange = price - Number(stats.openPrice);
      const priceChangePercent = (priceChange / Number(stats.openPrice)) * 100;
      stats.priceChange24h = priceChange.toString();
      stats.priceChangePercent24h = priceChangePercent.toFixed(2);
    } else {
      stats.openPrice = fill.price;
    }
  }

  private createTradeRecord(
    fill: Fill,
    order: Order,
    market: string,
    userId: string
  ): TradeData {
    const isBuyerMaker = order.side === "sell";
    const tradeValue = fill.qty * Number(fill.price);

    return {
      id: fill.tradeId.toString(),
      market,
      price: fill.price,
      quantity: fill.qty.toString(),
      quoteQuantity: tradeValue.toString(),
      buyerUserId: isBuyerMaker ? fill.otherUserId : userId,
      sellerUserId: isBuyerMaker ? userId : fill.otherUserId,
      timestamp: Date.now(),
      isBuyerMaker,
    };
  }

  private saveTradeToDatabase(trade: TradeData): void {
    console.log(
      ` Saving trade ${trade.id}: ${trade.quantity} ${trade.market} at ₹${trade.price}`
    );

    RedisManager.getInstance().pushMessage({
      type: TRADE_ADDED,
      data: {
        id: trade.id,
        market: trade.market,
        price: trade.price,
        quantity: trade.quantity,
        quoteQuantity: trade.quoteQuantity,
        isBuyerMaker: trade.isBuyerMaker,
        timestamp: trade.timestamp,
      },
    });
  }

  // Send real-time mark price update to WebSocket clients

  private sendMarkPriceUpdate(
    fill: Fill,
    market: string,
    orderSide: "buy" | "sell"
  ): void {
    const orderbook = this.findOrderbook(market);
    const currentPrice = Number(fill.price);

    // Update the orderbook's current price
    (orderbook as any).currentPrice = currentPrice;

    console.log(
      `Broadcasting markPrice: ${market} = Rs${currentPrice} (qty: ${fill.qty})`
    );

    // Create mark price update message
    const markPriceMessage: MarkPriceUpdateMessage = {
      stream: `markPrice@${market}`,
      data: {
        e: "markPrice",
        s: market, // symbol
        p: fill.price, // price
        q: fill.qty.toString(), // quantity of THIS fill
        t: Date.now(), // timestamp
        m: orderSide === "sell", // is maker (seller is maker when buy order hits sell order)
      },
    };

    // Send to ONLY ONE stream to prevent duplicates
    RedisManager.getInstance().publishMessage(
      `markPrice@${market}`,
      markPriceMessage
    );

    console.log(
      `MarkPrice sent: ${market} @ Rs${fill.price} (qty: ${fill.qty})`
    );
  }

  // Also update the sendTickerUpdate method:
  private sendTickerUpdate(market: string): void {
    const stats = this.marketStats.get(market);
    if (!stats) return;

    console.log(`Broadcasting ticker update: ${market}`);

    const tickerMessage: TickerUpdateMessage= {
      stream: `ticker@${market}`,
      data: {
        e: "ticker",
        s: market, // symbol
        c: stats.lastPrice, // current/close price
        h: stats.high24h, // high price
        l: stats.low24h, // low price
        v: stats.volume24h, // volume
        V: stats.quoteVolume24h, // quote volume
        o: stats.openPrice, // open price
        id: Date.now(),
      },
    };

    // Send to ONLY ONE stream to prevent duplicates
    RedisManager.getInstance().publishMessage(
      `ticker@${market}`,
      tickerMessage
    );

    console.log(`Ticker sent: ${market} @ Rs${stats.lastPrice}`);
  }

  private updateOrderInDatabase(
    order: Order,
    executedQty: number,
    fills: Fill[],
    market: string
  ): void {
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

  private updateOrderBookDisplay(price: string, market: string): void {
    const orderbook = this.findOrderbook(market);
    const depth = orderbook.getDepth();

    // Create depth update message
    const depthMessage: DepthUpdateMessage = {
      stream: `depth@${market}`,
      data: {
        a: depth.asks,
        b: depth.bids,
        e: "depth",
      },
    };

    RedisManager.getInstance().publishMessage(`depth@${market}`, depthMessage);
  }

  private cancelOrderAndRefundMoney(
    orderbook: Orderbook,
    order: Order,
    baseAsset: string
  ): number | undefined {
    const unfilledQuantity = order.quantity - order.filled;
    let cancelledPrice: number | undefined;

    if (order.side === "buy") {
      cancelledPrice = orderbook.cancelBid(order);
      if (cancelledPrice !== undefined) {
        const lockedMoney = unfilledQuantity * order.price;
        this.updateUserBalance(
          order.userId,
          BASE_CURRENCY,
          lockedMoney,
          -lockedMoney
        );
      }
    } else {
      cancelledPrice = orderbook.cancelAsk(order);
      if (cancelledPrice !== undefined) {
        this.updateUserBalance(
          order.userId,
          baseAsset,
          unfilledQuantity,
          -unfilledQuantity
        );
      }
    }

    return cancelledPrice;
  }

  // ===== UTILITY FUNCTIONS =====

  private findOrderbook(market: string): Orderbook {
    const orderbook = this.orderbooks.find((book) => book.ticker() === market);
    if (!orderbook) {
      throw new Error(`Market ${market} not found`);
    }
    return orderbook;
  }

  private findOrderById(
    orderbook: Orderbook,
    orderId: string
  ): Order | undefined {
    return [...orderbook.bids, ...orderbook.asks].find(
      (order) => order.orderId === orderId
    );
  }

  private getUserBalance(userId: string): UserBalance {
    let balance = this.balances.get(userId);
    if (!balance) {
      balance = {};
      this.balances.set(userId, balance);
    }
    return balance;
  }

  private updateUserBalance(
    userId: string,
    asset: string,
    availableChange: number,
    lockedChange: number
  ): void {
    const userBalance = this.getUserBalance(userId);

    if (!userBalance[asset]) {
      userBalance[asset] = { available: 0, locked: 0 };
    }

    userBalance[asset].available += availableChange;
    userBalance[asset].locked += lockedChange;

    userBalance[asset].available = Math.max(0, userBalance[asset].available);
    userBalance[asset].locked = Math.max(0, userBalance[asset].locked);
  }

  private addMoneyToUser(userId: string, amount: number): void {
    const userBalance = this.balances.get(userId);

    if (!userBalance) {
      this.balances.set(userId, {
        [BASE_CURRENCY]: { available: amount, locked: 0 },
      });
    } else {
      if (!userBalance[BASE_CURRENCY]) {
        userBalance[BASE_CURRENCY] = { available: 0, locked: 0 };
      }
      userBalance[BASE_CURRENCY].available += amount;
    }

    console.log(`Added ₹${amount} to user ${userId}`);
  }

  private generateUniqueOrderId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private sendErrorResponse(clientId: string, error: string): void {
    RedisManager.getInstance().sendToApi(clientId, {
      type: "ORDER_CANCELLED",
      payload: { orderId: "", executedQty: 0, remainingQty: 0 },
    });
    console.error(`Error for client ${clientId}: ${error}`);
  }

  addOrderbook(orderbook: Orderbook): void {
    this.orderbooks.push(orderbook);
    const market = orderbook.ticker();
    this.initializeMarketStats(market);
  }

  destroy(): void {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }
    this.saveDataToDisk();
    console.log(" Engine shutdown complete");
  }
}
