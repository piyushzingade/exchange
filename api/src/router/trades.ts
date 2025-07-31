

import { Router } from "express";

export const tradesRouter = Router();

tradesRouter.get("/", async (req, res) => {
  try {
    const { market } = req.query;

    if (!market) {
      return res.status(400).json({ error: "Market parameter is required" });
    }

    // Mock trades data - replace with actual DB query
    const mockTrades = [
      {
        id: "12345",
        price: "103.75",
        qty: "25.50",
        quoteQty: "2645.625",
        time: Date.now() - 300000, 
        isBuyerMaker: true,
      },
      {
        id: "12344",
        price: "103.50",
        qty: "10.00",
        quoteQty: "1035.00",
        time: Date.now() - 600000,
        isBuyerMaker: false,
      },
      {
        id: "12343",
        price: "104.00",
        qty: "15.75",
        quoteQty: "1638.00",
        time: Date.now() - 900000,
        isBuyerMaker: true,
      },
      {
        id: "12342",
        price: "103.25",
        qty: "50.00",
        quoteQty: "5162.50",
        time: Date.now() - 1200000,
        isBuyerMaker: false,
      },
      {
        id: "12341",
        price: "103.80",
        qty: "8.25",
        quoteQty: "856.35",
        time: Date.now() - 1500000, 
        isBuyerMaker: true,
      },
    ];

    // Filter mock data based on market (in real implementation, this would be a DB query)
    const filteredTrades = mockTrades.map((trade) => ({
      ...trade,
      symbol: market as string,
    }));

    res.json(filteredTrades);
  } catch (error) {
    console.error("Trades error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});




// import { Router } from "express";
// import { Client } from "pg";

// const pgClient = new Client({
//   user: "your_user",
//   host: "localhost",
//   database: "my_database",
//   password: "your_password",
//   port: 5432,
// });
// pgClient.connect();

// export const tradesRouter = Router();

// tradesRouter.get("/", async (req, res) => {
//   try {
//     const { market, limit = "50" } = req.query;

//     if (!market) {
//       return res.status(400).json({ error: "Market parameter is required" });
//     }

//     const limitNum = parseInt(limit as string);
//     if (isNaN(limitNum) || limitNum <= 0 || limitNum > 500) {
//       return res.status(400).json({
//         error: "Limit must be a number between 1 and 500",
//       });
//     }

//     const query = `
//       SELECT 
//         id,
//         price,
//         quantity as qty,
//         (price * quantity) as quoteQty,
//         timestamp as time,
//         is_buyer_maker as "isBuyerMaker"
//       FROM trades 
//       WHERE market = $1 
//       ORDER BY timestamp DESC 
//       LIMIT $2
//     `;

//     const result = await pgClient.query(query, [market, limitNum]);

//     // Format the response
//     const trades = result.rows.map((row) => ({
//       id: row.id.toString(),
//       price: row.price.toString(),
//       qty: row.qty.toString(),
//       quoteQty: row.quoteqty.toString(),
//       time: new Date(row.time).getTime(),
//       isBuyerMaker: row.isBuyerMaker,
//     }));

//     res.json(trades);
//   } catch (error) {
//     console.error("Trades database error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });
