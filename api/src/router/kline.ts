import { Client } from "pg";
import { Router } from "express";

const client = new Client({
  connectionString: "postgresql://user:root@localhost:5432/my_database",
});

// const pgClient = new Client({connectionString : "postgresql://your_user:your_password@localhost:5432/my_database"})
client.connect();

export const klineRouter = Router();

klineRouter.get("/", async (req, res) => {
  const { market, interval, startTime, endTime } = req.query;

  // Validate and convert query parameters
  if (!startTime || !endTime || !interval || !market) {
    return res
      .status(400)
      .json({
        error: "Missing required parameters: startTime, endTime, interval",
      });
  }

  // Convert to numbers and validate
  const startTimeNum = parseInt(startTime as string);
  const endTimeNum = parseInt(endTime as string);

  if (isNaN(startTimeNum) || isNaN(endTimeNum)) {
    return res
      .status(400)
      .json({ error: "startTime and endTime must be valid numbers" });
  }

  let query: string;
  switch (interval) {
    case "1m":
      query = `SELECT * FROM klines_1m WHERE bucket >= $1 AND bucket <= $2`;
      break;
    case "1h":
      query = `SELECT * FROM klines_1h WHERE bucket >= $1 AND bucket <= $2`; // Fixed: was klines_1m
      break;
    case "1w":
      query = `SELECT * FROM klines_1w WHERE bucket >= $1 AND bucket <= $2`;
      break;
    default:
      return res
        .status(400)
        .json({ error: "Invalid interval. Supported: 1m, 1h, 1w" });
  }

  try {
    const result = await client.query(query, [
      new Date(startTimeNum * 1000), 
      new Date(endTimeNum * 1000), // Convert Unix timestamp to Date
    ]);

    res.json(
      result.rows.map((x) => ({
        close: x.close,
        end: x.bucket,
        high: x.high,
        low: x.low,
        open: x.open,
        quoteVolume: x.quoteVolume,
        start: x.start,
        trades: x.trades,
        volume: x.volume,
      }))
    );
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
