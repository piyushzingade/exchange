const { Client } = require("pg");

const client = new Client({
  connectionString: "postgresql://myuser:mypassword@localhost:5432/mydatabase",
});

async function initializeDB() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL");

    // Create users table
    await client.query(`
      DROP TABLE IF EXISTS "users" CASCADE;
      CREATE TABLE "users"(
        user_id VARCHAR(50) PRIMARY KEY,
        balance DOUBLE PRECISION DEFAULT 0,
        locked DOUBLE PRECISION DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("Users table created");

    // Create stocks/ticker table
    await client.query(`
      DROP TABLE IF EXISTS "stocks" CASCADE;
      CREATE TABLE "stocks"(
        symbol VARCHAR(20) PRIMARY KEY,
        current_price DOUBLE PRECISION DEFAULT 0,
        last_trade_price DOUBLE PRECISION DEFAULT 0,
        volume DOUBLE PRECISION DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("Stocks table created");

    // Create user_holdings table to track user stock quantities
    await client.query(`
      DROP TABLE IF EXISTS "user_holdings" CASCADE;
      CREATE TABLE "user_holdings"(
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
        symbol VARCHAR(20) REFERENCES stocks(symbol) ON DELETE CASCADE,
        quantity DOUBLE PRECISION DEFAULT 0,
        average_price DOUBLE PRECISION DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, symbol)
      );
    `);
    console.log("User holdings table created");

    // Create trades table
    await client.query(`
      DROP TABLE IF EXISTS "trades" CASCADE;
      CREATE TABLE "trades"(
        trade_id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
        symbol VARCHAR(20) REFERENCES stocks(symbol) ON DELETE CASCADE,
        trade_type VARCHAR(10) CHECK (trade_type IN ('BUY', 'SELL')),
        quantity DOUBLE PRECISION NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        total_amount DOUBLE PRECISION NOT NULL,
        status VARCHAR(20) DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
        trade_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("Trades table created");

    // Create hypertable for trades (TimescaleDB specific - optional)
    try {
      await client.query(`SELECT create_hypertable('trades', 'trade_time');`);
      console.log("Trades hypertable created");
    } catch (err) {
      console.log(
        "Hypertable creation skipped (TimescaleDB not available or already exists)"
      );
    }

    // Insert sample stock (TATA_INR)
    await client.query(`
      INSERT INTO stocks (symbol, current_price, last_trade_price, volume) VALUES
      ('TATA_INR', 3500.00, 3500.00, 1300000000000)
      ON CONFLICT (symbol) DO UPDATE SET
        current_price = EXCLUDED.current_price,
        last_trade_price = EXCLUDED.last_trade_price,
        updated_at = NOW();
    `);
    console.log("Sample stock (TATA_INR) inserted");

    // Insert 5 sample users
    await client.query(`
      INSERT INTO users (user_id, balance, locked) VALUES
      ('1', 1000000.00, 0),
      ('2', 5000000.00, 0),
      ('3', 200000.00, 100.00),
      ('4', 150000.00, 200.00),
      ('5', 800000.00, 50.00)
      ON CONFLICT (user_id) DO NOTHING;
    `);
    console.log("5 sample users inserted");

    // Insert sample user holdings for TATA_INR stock
    await client.query(`
      INSERT INTO user_holdings (user_id, symbol, quantity, average_price) VALUES
      ('1', 'TATA_INR', 100, 3400.00),
      ('2', 'TATA_INR', 50, 3450.00),
      ('3', 'TATA_INR', 25, 3500.00),
      ('4', 'TATA_INR', 10, 3480.00),
      ('5', 'TATA_INR', 75, 3420.00)
      ON CONFLICT (user_id, symbol) DO NOTHING;
    `);
    console.log("Sample user holdings inserted");

    // Insert sample trades
    await client.query(`
      INSERT INTO trades (user_id, symbol, trade_type, quantity, price, total_amount) VALUES
      ('1', 'TATA_INR', 'BUY', 50, 3400.00, 170000.00),
      ('1', 'TATA_INR', 'BUY', 50, 3450.00, 172500.00),
      ('2', 'TATA_INR', 'BUY', 30, 3420.00, 102600.00),
      ('2', 'TATA_INR', 'BUY', 20, 3480.00, 69600.00),
      ('3', 'TATA_INR', 'BUY', 25, 3500.00, 87500.00),
      ('4', 'TATA_INR', 'BUY', 10, 3480.00, 34800.00),
      ('5', 'TATA_INR', 'BUY', 75, 3420.00, 256500.00),
      ('2', 'TATA_INR', 'SELL', 10, 3500.00, 35000.00)
    `);
    console.log("Sample trades inserted");

    //Inset some randon klines data to fetch from the data

    // Create klines table
    await client.query(`
    DROP TABLE IF EXISTS "klines" CASCADE;
    CREATE TABLE "klines"(
      id SERIAL PRIMARY KEY,
      open DOUBLE PRECISION NOT NULL,
      high DOUBLE PRECISION NOT NULL,
      low DOUBLE PRECISION NOT NULL,
      close DOUBLE PRECISION NOT NULL,
      time BIGINT NOT NULL -- storing as UNIX timestamp
    );
  `);
    console.log("Klines table created");

    function generateRandomKlines(count: number) {
      const klines = [];
      let basePrice = Math.random() * (3000 - 1000) + 1000;

      for (let i = 0; i < count; i++) {
        const open = +(basePrice + Math.random() * 20 - 10).toFixed(2);
        const high = +(open + Math.random() * 15).toFixed(2);
        const low = +(open - Math.random() * 15).toFixed(2);
        const close = +(low + Math.random() * (high - low)).toFixed(2);
        const time = Math.floor(Date.now() / 1000) - (count - i) * 86400;
        basePrice = close;
        klines.push({ open, high, low, close, time });
      }
      return klines;
    }

    const data = generateRandomKlines(10);

    await client.query(`
      INSERT INTO klines (open, high, low, close, time) VALUES
      ${data
        .map((k) => `(${k.open}, ${k.high}, ${k.low}, ${k.close}, ${k.time})`)
        .join(", ")}
      `);

    // Create function to update stock price based on last trade
    await client.query(`
      CREATE OR REPLACE FUNCTION update_stock_price()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE stocks 
        SET 
          last_trade_price = NEW.price,
          current_price = NEW.price,
          updated_at = NOW()
        WHERE symbol = NEW.symbol;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger to automatically update stock price after each trade
    await client.query(`
      DROP TRIGGER IF EXISTS update_stock_price_trigger ON trades;
      CREATE TRIGGER update_stock_price_trigger
        AFTER INSERT ON trades
        FOR EACH ROW
        EXECUTE FUNCTION update_stock_price();
    `);
    console.log("Stock price update trigger created");

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
      CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
      CREATE INDEX IF NOT EXISTS idx_trades_time ON trades(trade_time);
      CREATE INDEX IF NOT EXISTS idx_user_holdings_user_id ON user_holdings(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_holdings_symbol ON user_holdings(symbol);
    `);
    console.log("Database indexes created");

    await client.end();
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Database initialization error:", error);
    await client.end();
    process.exit(1);
  }
}

initializeDB();
 