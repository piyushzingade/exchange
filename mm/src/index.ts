import axios from "axios";

const BASE_URL = "http://localhost:3001";
const TOTAL_BIDS = 15;
const TOTAL_ASK = 15;
const MARKET = "TATA_INR";
const USER_ID = "5";

function randomQuantity(min: number, max: number) {
  return (min + Math.random() * (max - min)).toFixed(2); // 2 decimal places
}

function randomPrice(base: number, range: number) {
  return (base + Math.random() * range).toFixed(2);
}

async function main() {
  const price = 1000 + Math.random() * 10;

  const openOrders = await axios.get(
    `${BASE_URL}/api/v1/order/open?userId=${USER_ID}&market=${MARKET}`
  );

  const totalBids = openOrders.data.filter((o: any) => o.side === "buy").length;
  const totalAsks = openOrders.data.filter(
    (o: any) => o.side === "sell"
  ).length;

  const cancelledBids = await cancelBidsMoreThan(openOrders.data, price);
  const cancelledAsks = await cancelAsksLessThan(openOrders.data, price);

  let bidsToAdd = TOTAL_BIDS - totalBids - cancelledBids;
  let asksToAdd = TOTAL_ASK - totalAsks - cancelledAsks;

  while (bidsToAdd > 0 || asksToAdd > 0) {
    if (bidsToAdd > 0) {
      await axios.post(`${BASE_URL}/api/v1/order`, {
        market: MARKET,
        price: (price - Math.random()).toFixed(2),
        quantity: randomQuantity(0.1, 5), // e.g. 0.10 - 5.00
        side: "buy",
        userId: USER_ID,
      });
      bidsToAdd--;
    }
    if (asksToAdd > 0) {
      await axios.post(`${BASE_URL}/api/v1/order`, {
        market: MARKET,
        price: (price + Math.random()).toFixed(2),
        quantity: randomQuantity(0.1, 5), // e.g. 0.10 - 5.00
        side: "sell",
        userId: USER_ID,
      });
      asksToAdd--;
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  main();
}

async function cancelBidsMoreThan(openOrders: any[], price: number) {
  let promises: any[] = [];
  openOrders.forEach((o) => {
    if (o.side === "buy" && (o.price > price || Math.random() < 0.1)) {
      promises.push(
        axios.delete(`${BASE_URL}/api/v1/order`, {
          data: { orderId: o.orderId, market: MARKET },
        })
      );
    }
  });
  await Promise.all(promises);
  return promises.length;
}

async function cancelAsksLessThan(openOrders: any[], price: number) {
  let promises: any[] = [];
  openOrders.forEach((o) => {
    if (o.side === "sell" && (o.price < price || Math.random() < 0.5)) {
      promises.push(
        axios.delete(`${BASE_URL}/api/v1/order`, {
          data: { orderId: o.orderId, market: MARKET },
        })
      );
    }
  });
  await Promise.all(promises);
  return promises.length;
}

main();
