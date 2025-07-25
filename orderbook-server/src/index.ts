import express from "express";
import { OrderInputSchema } from "./types";
import { orderbook, bookWithQuantity } from "./orderbook";

const BASE_ASSET = 'BTC';
const QUOTE_ASSET = 'USD';
const PORT = 3000;

const app = express();
let GLOBAL_TRADE_ID = 0

app.use(express.json())

app.get("/" , (req ,res) => {
    res.send("Hi there")
})

app.post("/api/v1/order" ,(req , res) => {

    const order = OrderInputSchema.safeParse(req.body);
    if (!order.success) {
        res.status(400).send(order.error.message);
        return;
    }
        console.log("Invalid base or5 ");

    const { baseAsset, quoteAsset, price, quantity, side, kind } = order.data;

    const orderId = getOrderId();


    if(baseAsset  !== BASE_ASSET || quoteAsset !== QUOTE_ASSET){
        res.status(400).send("Invalid base or quote")
        return;
    }

    const { executedQty , fills} = fillOrder(orderId , price , quantity , side ,kind);

    console.log(orderbook)
    console.log(fills)
    console.log()
    res.send({
        orderId,
        executedQty,
        fills
    })

})  

app.listen(PORT , () =>{
    console.log("Server is alive")
})

function getOrderId() : string {
    return Math.random().toString(36).substring(2,15) + Math.random().toString(36).substring(2,15);
}

interface fill {
    "price" :number,
    "quantity":number,
    "tradeId":number
}

function fillOrder(orderId: string, price: number, quantity: number, side: "buy" | "sell", kind?: "ioc")
: { status: "rejected" | "accepted"; executedQty: number; fills: fill[] } {

    const fills : fill[] = [];
    const maxFillQuantity = getFillAmount(price, quantity ,side);

    let executedQty = 0;

    if(kind==="ioc" && maxFillQuantity < quantity){
        return {
            status:"rejected",
            executedQty,
            fills:[]
        }
    }

     if (side === "buy") {
       // asks should be sorted before you try to fill them
       orderbook.asks.forEach((o) => {
         if (o.price <= price && quantity > 0) {
           const filledQuantity = Math.min(quantity, o.quantity);
           o.quantity -= filledQuantity;
           bookWithQuantity.asks[o.price] =
             (bookWithQuantity.asks[o.price] || 0) - filledQuantity;
           fills.push({
             price: o.price,
             quantity: filledQuantity,
             tradeId: GLOBAL_TRADE_ID++,
           });
           executedQty += filledQuantity;
           quantity -= filledQuantity;
           if (o.quantity === 0) {
             orderbook.asks.splice(orderbook.asks.indexOf(o), 1);
           }
           if (bookWithQuantity.asks[price] === 0) {
             delete bookWithQuantity.asks[price];
           }
         }
       });

       // Place on the book if order not filled
       if (quantity !== 0) {
         orderbook.bids.push({
           price,
           quantity: quantity - executedQty,
           side: "bid",
           orderId,
         });
         bookWithQuantity.bids[price] =
           (bookWithQuantity.bids[price] || 0) + (quantity - executedQty);
       }
     } else {
       orderbook.bids.forEach((o) => {
         if (o.price >= price && quantity > 0) {
           const filledQuantity = Math.min(quantity, o.quantity);
           o.quantity -= filledQuantity;
           bookWithQuantity.bids[price] =
             (bookWithQuantity.bids[price] || 0) - filledQuantity;
           fills.push({
             price: o.price,
             quantity: filledQuantity,
             tradeId: GLOBAL_TRADE_ID++,
           });
           executedQty += filledQuantity;
           quantity -= filledQuantity;
           if (o.quantity === 0) {
             orderbook.bids.splice(orderbook.bids.indexOf(o), 1);
           }
           if (bookWithQuantity.bids[price] === 0) {
             delete bookWithQuantity.bids[price];
           }
         }
       });

       // Place on the book if order not filled
       if (quantity !== 0) {
         orderbook.asks.push({
           price,
           quantity: quantity,
           side: "ask",
           orderId,
         });
         bookWithQuantity.asks[price] =
           (bookWithQuantity.asks[price] || 0) + quantity;
       }
     }


    return {
      status: "accepted",
      executedQty,
      fills,
    };
}

function getFillAmount(price: number , quantity:number , side:"buy" | "sell"): number {

    let filled = 0

    if(side === "buy"){
        orderbook.asks.forEach( o => {
            if(o.price < price){
                filled += Math.min(quantity , o.quantity)
            }
        })
    }else {
        orderbook.bids.forEach(o => {
            if(price < o.price){
                filled += Math.min(quantity , o.quantity)
            }
        })
    }
    return filled;
}