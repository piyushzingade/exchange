import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from 'cors'
const app = express();

// Replace this with the target server URL
const targetUrl = "https://api.backpack.exchange";

// Handle CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Expose-Headers", "Content-Length, Content-Range");
  next();
});

app.use(
  "/",
  createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
  
  })
);

app.use(cors())
const port = 3333;
app.listen(port, () => {
  console.log(`Proxy server running on http://localhost:${port}`);
});
