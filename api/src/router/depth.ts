import { Router } from "express";
import { RedisManager } from "../RedisManager";
import { GET_DEPTH } from "../types";

export const depthRouter = Router();

depthRouter.get("/", async (req, res) => {
  try {
    const { symbol } = req.query;
    const response = await RedisManager.getInstance().sendAndAwait({
      type: GET_DEPTH,
      data: {
        market: symbol as string,
      },
    });

    res.json(response.payload);
  } catch (error) {
    res.status(400).json({
        message : "Error in depth endpoint"
    })
    console.log("Error in depth" , error)
  }
});
