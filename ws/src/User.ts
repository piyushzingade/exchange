import { WebSocket } from "ws";
import { OutgoingMessage } from "./types/out";
import { IncomingMessage, SUBSCRIBE, UNSUBSCRIBE } from "./types/in";
import { SubscriptionManager } from "./SubsrciptionManager";


export class User {
  private id: string;
  private ws: WebSocket;

  constructor(id: string, ws: WebSocket) {
    this.id = id;
    this.ws = ws;
    this.addListeners();
  }

  emit(message: OutgoingMessage) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      console.log(`Sent message to user ${this.id}:`, message);
    }
  }

  private addListeners() {
    this.ws.on("message", (message: string) => {
      try {
        const parsedMessage: IncomingMessage = JSON.parse(message);
        console.log(`Received from user ${this.id}:`, parsedMessage);

        if (parsedMessage.method === SUBSCRIBE) {
          parsedMessage.params.forEach((subscription) => {
            console.log(`User ${this.id} subscribing to: ${subscription}`);
            SubscriptionManager.getInstance().subscribe(this.id, subscription);
          });
        }

        if (parsedMessage.method === UNSUBSCRIBE) {
          parsedMessage.params.forEach((subscription) => {
            console.log(`User ${this.id} unsubscribing from: ${subscription}`);
            SubscriptionManager.getInstance().unsubscribe(
              this.id,
              subscription
            );
          });
        }
      } catch (error) {
        console.error(`Error parsing message from user ${this.id}:`, error);
      }
    });

    this.ws.on("error", (error) => {
      console.error(`WebSocket error for user ${this.id}:`, error);
    });
  }

  getId() {
    return this.id;
  }
}
