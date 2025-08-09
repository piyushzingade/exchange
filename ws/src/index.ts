import { WebSocketServer } from "ws";
import { UserManager } from "./UserManager";

const wss = new WebSocketServer({ port: 3002 });

console.log("WebSocket server started on port 3002");

wss.on("connection", (ws) => {
  console.log("New client connected");
  UserManager.getInstance().addUser(ws);
});
