import { Router } from "express";
import { Client } from "pg";

const client = new Client({
  connectionString: "postgresql://myuser:mypassword@localhost:5432/mydatabase",
});

// Connect to database
client.connect();

export const onRampRouter = Router();

onRampRouter.post("/", async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const amountNum = parseFloat(amount);
    if (amountNum <= 0) {
      return res.status(400).json({ error: "Amount must be positive" });
    }

    // Create user if not exists, then add funds
    const query = `
      INSERT INTO users (user_id, balance) 
      VALUES ($1, $2) 
      ON CONFLICT (user_id) 
      DO UPDATE SET balance = users.balance + $2
      RETURNING balance
    `;

    const result = await client.query(query, [userId, amountNum]);

    return res.json({
      success: true,
      message: "Funds added successfully",
      balance: parseFloat(result.rows[0].balance),
    });
  } catch (error) {
    console.error("OnRamp error:", error);
    res.status(500).json({ error: "Database error" });
  }
});
