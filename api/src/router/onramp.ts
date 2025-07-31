import { Router } from "express";
import { Client } from "pg";

const client = new Client({
  user: "your_user",
  host: "localhost",
  database: "my_database",
  password: "your_password",
  port: 5432,
});

// Connect to database
client.connect();

export const onRampRouter = Router();

onRampRouter.post("/", async (req, res) => {
  try {
    const { userId, amount } = req.body;
    console.log("userId:", userId);
    console.log("amount:", amount);

    if (!userId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const amountNum = parseFloat(amount);
    if (amountNum <= 0) {
      return res.status(400).json({ error: "Amount must be positive" });
    }

    // Check if user exists, create if not
    const checkUserQuery = `
      INSERT INTO users (user_id, balance, locked, tata_inr_quantity) 
      VALUES ($1, 0, 0, 0) 
      ON CONFLICT (user_id) DO NOTHING
    `;
    await client.query(checkUserQuery, [userId]);

    // Update user balance (add USDC/INR)
    const updateBalanceQuery = `
      UPDATE users 
      SET balance = balance + $1 
      WHERE user_id = $2
      RETURNING balance, locked, tata_inr_quantity
    `;
    const result = await client.query(updateBalanceQuery, [amountNum, userId]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const userBalance = result.rows[0];

    return res.json({
      success: true,
      message: "Funds added successfully",
      balances: {
        INR: {
          available: userBalance.balance,
          locked: userBalance.locked,
        },
        TATA_INR: {
          quantity: userBalance.tata_inr_quantity,
        },
      },
    });
  } catch (error: any) {
    console.error("OnRamp error:", error);
    res.status(500).json({ error: "Database error" });
  }
});
