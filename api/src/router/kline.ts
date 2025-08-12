import { Client } from "pg";
import { Router } from "express";

const client = new Client({
  connectionString: "postgresql://myuser:mypassword@localhost:5432/mydatabase",
});
// const pgClient = new Client({connectionString : "postgresql://your_user:your_password@localhost:5432/my_database"})
client.connect();

export const klineRouter = Router();

klineRouter.get("/", async (req, res) => {
  // const { market, interval, startTime, endTime } = req.query;


  const query = `
    SELECT open, high, low, close, time
    FROM klines
    ORDER BY time ASC
  `;


  try {
    
    const result  = await client.query(query)

    res.json(
      result.rows.map((x) => ({
        open:x.open,
        high:x.high,
        low:x.low,
        close : x.close,
        time:x.time
      }))
    );
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
