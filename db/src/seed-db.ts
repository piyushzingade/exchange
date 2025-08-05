const { Client } = require("pg");


// const client = new Client({
//   user: "user",
//   host: "localhost",
//   database: "my_database",
//   password: "root",
//   port: 5432,
// });

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
        tata_inr_quantity DOUBLE PRECISION DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("Users table created");

    // Create tata_prices table
    await client.query(`
      DROP TABLE IF EXISTS "tata_prices" CASCADE;
      CREATE TABLE "tata_prices"(
        time TIMESTAMP WITH TIME ZONE NOT NULL,
        price DOUBLE PRECISION,
        volume DOUBLE PRECISION,
        currency_code VARCHAR (10)
      );
    `);
    console.log("TATA prices table created");

    // Create hypertable (TimescaleDB specific)
    try {
      await client.query(
        `SELECT create_hypertable('tata_prices', 'time', 'price', 2);`
      );
      console.log("Hypertable created");
    } catch (err) {
      console.log("Hypertable creation skipped (might already exist)");
    }

    // Insert sample users
    await client.query(`
      INSERT INTO users (user_id, balance, locked, tata_inr_quantity) VALUES
      ('1', 1000, 0, 0),
      ('2', 500, 0, 10),
      ('3', 2000, 100, 5)
      ON CONFLICT (user_id) DO NOTHING;
    `);
    console.log("Sample users inserted");

    await client.end();
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Database initialization error:", error);
    process.exit(1);
  }
}

initializeDB();
