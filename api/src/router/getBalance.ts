import { Router } from "express";
import { Client } from "pg";

const client = new Client({
  connectionString: "postgresql://myuser:mypassword@localhost:5432/mydatabase",
});

client.connect();

export const balanceRouter = Router();

balanceRouter.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const result = await client.query(
      "SELECT balance, locked FROM users WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        balance: 0,
        locked: 0,
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      balance: parseFloat(user.balance),
      locked: parseFloat(user.locked),
    });
  } catch (error) {
    console.error("Balance error:", error);
    res.status(500).json({ error: "Database error" });
  }
});
