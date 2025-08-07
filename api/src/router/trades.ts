import { Router } from "express";
import { Client } from "pg";

export const tradesRouter = Router();

// Database connection
const client = new Client({
  connectionString: "postgresql://myuser:mypassword@localhost:5432/mydatabase",
});

// Initialize database connection
client.connect().catch(console.error);

tradesRouter.get("/", async (req, res) => {
  try {
    const { symbol } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: "Symbol parameter is required" });
    }

    // Query to fetch recent trades from database
    const query = `
      SELECT 
        trade_id as id,
        price,
        quantity as qty,
        total_amount as "quoteQty",
        EXTRACT(EPOCH FROM trade_time) * 1000 as time,
        CASE 
          WHEN trade_type = 'SELL' THEN true 
          ELSE false 
        END as "isBuyerMaker",
        symbol
      FROM trades 
      WHERE symbol = $1 
      ORDER BY trade_time DESC 
      LIMIT 50
    `;

    const result = await client.query(query, [symbol]);

    // Transform the data to match your API format
    const trades = result.rows.map((trade) => ({
      id: trade.id,
      price: trade.price.toString(), // Convert to string to match your format
      qty: trade.qty.toString(),
      quoteQty: trade.quoteQty.toString(),
      time: parseInt(trade.time), // Convert to number (timestamp in milliseconds)
      isBuyerMaker: trade.isBuyerMaker,
      symbol: trade.symbol,
    }));

    // If no trades found, return empty array
    if (trades.length === 0) {
      return res.json([]);
    }

    res.json(trades);
  } catch (error) {
    console.error("Trades error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
