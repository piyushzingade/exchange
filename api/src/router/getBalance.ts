import { Router } from "express";
import { RedisManager } from "../RedisManager";

export const balanceRouter = Router();

balanceRouter.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Valid User ID is required" });
    }

    const message: any = {
      type: "BALANCE",
      data: { userId },
    };

    console.log("Fetching balance for user:", userId);

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Redis timeout")), 3000);
      });

      const response: any = await Promise.race([
        RedisManager.getInstance().sendAndAwait(message),
        timeoutPromise,
      ]);

      console.log("Balance response:", JSON.stringify(response));

      if (response?.type === "BALANCE") {
        return res.json({
          success: true,
          balances: response.payload,
        });
      }

      // Handle other response types
      if (response?.type === "ERROR") {
        return res.status(400).json({
          success: false,
          error: response.payload?.message || "Error fetching balance",
        });
      }
    } catch (redisError) {
      console.log("Redis timeout, returning mock balance for user:", userId);

      // Mock balance when Redis is not responding
      const mockBalance = {
        USDC: {
          available: 0,
          locked: 0,
        },
        SOL: {
          available: 0,
          locked: 0,
        },
      };

      return res.json({
        success: true,
        balances: mockBalance,
        mock: true, // Indicate this is mock data
      });
    }

    return res.status(400).json({ error: "Unexpected response from server" });
  } catch (error: any) {
    console.error("Balance error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
