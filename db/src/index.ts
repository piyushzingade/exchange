import { Client } from "pg";
import { createClient } from "redis";
import { DbMessage } from "./types";

const client = new Client({
  connectionString: "postgresql://myuser:mypassword@localhost:5432/mydatabase",
});

client.connect();

async function main() {
  const redisClient = createClient();
  await redisClient.connect();
  console.log("connected to redis");

  while (true) {
    const response = await redisClient.rPop("db_processor" as string);
    if (!response) {
      // Wait a bit if no messages
      await new Promise((resolve) => setTimeout(resolve, 100));
    } else {
      const data: DbMessage = JSON.parse(response);
      if (data.type === "TRADE_ADDED") {
        console.log("adding data");
        console.log(data);

        const price = parseFloat(data.data.price);
        const volume = parseFloat(data.data.quantity); 
        const timestamp = new Date(data.data.timestamp);

        // Insert into tata_prices with volume
        const query =
          "INSERT INTO tata_prices (time, price, volume) VALUES ($1, $2, $3)";
        const values = [timestamp, price, volume];

        try {
          await client.query(query, values);
          console.log(
            `Trade data inserted: Price ${price}, Volume ${volume}`
          );
        } catch (error) {
          console.error("Error inserting data:", error);
        }
      }
    }
  }
}

main();
