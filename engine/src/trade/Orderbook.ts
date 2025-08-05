import { BASE_CURRENCY } from "./Engine";

export interface Order {
  price: number;
  quantity: number;
  orderId: string;
  filled: number;
  side: "buy" | "sell";
  userId: string;
}

export interface Fill {
  price: string;
  qty: number;
  tradeId: number;
  otherUserId: string;
  markerOrderId: string;
}

// Insert an order into orderList based on price 
function insertSorted(
  orderList: Order[],
  order: Order,
  descending: boolean = false
) {
  let i = 0;
  while (i < orderList.length) {
    // determine where to insert  based on asc/desc
    if (
      (descending && orderList[i].price < order.price) ||
      (!descending && orderList[i].price > order.price)
    ) {
      break;
    }
    i++;
  }
  orderList.splice(i, 0, order);
}

export class Orderbook {
  bids: Order[] = [];
  asks: Order[] = [];
  depthBids = new Map<number, number>();
  depthAsks = new Map<number, number>();
  baseAsset: string;
  quoteAsset: string = BASE_CURRENCY;
  lastTradeId: number;
  currentPrice: number;

  constructor(
    baseAsset: string,
    bids: Order[],
    asks: Order[],
    lastTradeId: number,
    currentPrice: number
  ) {
    this.baseAsset = baseAsset;
    this.lastTradeId = lastTradeId || 0;
    this.currentPrice = currentPrice || 0;

    // Insert initial orders sorted
    for (const b of bids) this.addOrder(b);
    for (const a of asks) this.addOrder(a);
  }

  // return ticker 
  ticker() {
    return `${this.baseAsset}_${this.quoteAsset}`;
  }

  // return 
  getSnapshot() {
    return {
      baseAsset: this.baseAsset,
      bids: this.bids,
      asks: this.asks,
      lastTradeId: this.lastTradeId,
      currentPrice: this.currentPrice,
    };
  }

  addOrder(order: Order): { executedQty: number; fills: Fill[] } {
    const result =
      order.side === "buy" ? this.matchBid(order) : this.matchAsk(order);
    order.filled = result.executedQty;

    if (order.quantity > result.executedQty) {
      const remaining = {
        ...order,
        quantity: order.quantity - result.executedQty,
        filled: 0,
      };
      if (order.side === "buy") {
        insertSorted(this.bids, remaining, true);
        this.updateDepth(this.depthBids, remaining.price, remaining.quantity);
      } else {
        insertSorted(this.asks, remaining, false);
        this.updateDepth(this.depthAsks, remaining.price, remaining.quantity);
      }
    }
    return result;
  }

  private matchBid(order: Order): { fills: Fill[]; executedQty: number } {
    const fills: Fill[] = [];
    let executedQty = 0;

    let i = 0;
    while (
      i < this.asks.length &&
      order.price >= this.asks[i].price &&
      executedQty < order.quantity
    ) {
      const ask = this.asks[i];
      const available = ask.quantity - ask.filled;
      const fillQty = Math.min(order.quantity - executedQty, available);

      if (fillQty > 0) {
        executedQty += fillQty;
        ask.filled += fillQty;

        fills.push({
          price: ask.price.toString(),
          qty: fillQty,
          tradeId: this.lastTradeId++,
          otherUserId: ask.userId,
          markerOrderId: ask.orderId,
        });
        // -fillQty executed from total qty 
        this.updateDepth(this.depthAsks, ask.price, -fillQty);
      }

      if (ask.filled === ask.quantity) {
        this.asks.splice(i, 1); // Remove fully filled ask
      } else {
        i++;
      }
    }

    return { fills, executedQty };
  }

  private matchAsk(order: Order): { fills: Fill[]; executedQty: number } {
    const fills: Fill[] = [];
    let executedQty = 0;

    let i = 0;
    while (
      i < this.bids.length &&
      order.price <= this.bids[i].price &&
      executedQty < order.quantity
    ) {
      const bid = this.bids[i];
      const available = bid.quantity - bid.filled;
      const fillQty = Math.min(order.quantity - executedQty, available);

      if (fillQty > 0) {
        executedQty += fillQty;
        bid.filled += fillQty;

        fills.push({
          price: bid.price.toString(),
          qty: fillQty,
          tradeId: this.lastTradeId++,
          otherUserId: bid.userId,
          markerOrderId: bid.orderId,
        });

        this.updateDepth(this.depthBids, bid.price, -fillQty);
      }

      if (bid.filled === bid.quantity) {
        this.bids.splice(i, 1); //  Remove the 
      } else {
        i++;
      }
    }

    return { fills, executedQty };
  }

  getDepth() {
    const bids = Array.from(this.depthBids.entries())
      .filter(([, qty]) => qty > 0)
      .sort((a, b) => b[0] - a[0])
      .map(
        ([price, qty]) => [price.toString(), qty.toString()] as [string, string]
      );

    const asks = Array.from(this.depthAsks.entries())
      .filter(([, qty]) => qty > 0)
      .sort((a, b) => a[0] - b[0])
      .map(
        ([price, qty]) => [price.toString(), qty.toString()] as [string, string]
      );

    return { bids, asks };
  }

  private updateDepth(map: Map<number, number>, price: number, delta: number) {
    const prev = map.get(price) || 0;
    const updated = prev + delta;
    if (updated <= 0) {
      map.delete(price);
    } else {
      map.set(price, updated);
    }
  }

  getOpenOrders(userId: string): Order[] {
    return [...this.bids, ...this.asks].filter((o) => o.userId === userId);
  }

  cancelBid(order: Order) {
    const index = this.bids.findIndex((x) => x.orderId === order.orderId);
    if (index !== -1) {
      const price = this.bids[index].price;
      this.updateDepth(this.depthBids, price, -this.bids[index].quantity);
      this.bids.splice(index, 1);
      return price;
    }
  }

  cancelAsk(order: Order) {
    const index = this.asks.findIndex((x) => x.orderId === order.orderId);
    if (index !== -1) {
      const price = this.asks[index].price;
      this.updateDepth(this.depthAsks, price, -this.asks[index].quantity);
      this.asks.splice(index, 1);
      return price;
    }
  }
}
