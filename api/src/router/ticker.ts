import { Router } from "express";
import { RedisManager } from "../RedisManager";

export const tickerRouter = Router();

tickerRouter.get("/", async (req, res) => {
  try {
    const message: any = {
      type: "GET_TICKERS",
      data: {},
    };

    const response = await RedisManager.getInstance().sendAndAwait(message);

    if (response?.type === "TICKER") {
      return res.json(response.payload);
    }

    return res.status(400).json({ error: "Failed to get tickers" });
  } catch (error) {
    console.error("Tickers error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
