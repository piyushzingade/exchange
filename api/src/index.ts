import express from "express";
import cors from "cors"
import { orderRouter } from "./router/orderRouter";
import { depthRouter } from "./router/depth";
import { tradesRouter } from "./router/trades";
// import { klineRouter } from "./router/kline";
import { tickerRouter } from "./router/ticker";
import { balanceRouter } from "./router/getBalance";
import { onRampRouter } from "./router/onramp";

const app = express();
app.use(cors());
app.use(express.json())

app.get("/"  ,(req ,res ) => {
    res.send("API server is running")
})

app.use("/api/v1/order", orderRouter);
app.use("/api/v1/depth", depthRouter);
app.use("/api/v1/trades", tradesRouter);
// app.use("/api/v1/klines", klineRouter);
app.use("/api/v1/tickers", tickerRouter);
app.use("/api/v1/balance" , balanceRouter);
app.use("/api/v1/onramp", onRampRouter);

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});