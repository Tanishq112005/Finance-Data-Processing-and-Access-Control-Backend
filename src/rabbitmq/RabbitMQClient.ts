import * as amqp from "amqplib";
import { RABBITMQ_URL } from "../config/env";

export class RabbitMQClient {
  private static instance: RabbitMQClient;
  private connection: any;
  private channel: any;
  private readonly url: string;

  private constructor() {
    this.url = RABBITMQ_URL;
  }

  public static getInstance(): RabbitMQClient {
    if (!RabbitMQClient.instance) {
      RabbitMQClient.instance = new RabbitMQClient();
    }
    return RabbitMQClient.instance;
  }

  public async connect(): Promise<void> {
    if (this.connection && this.channel) {
      return;
    }

    try {
      console.log("[RabbitMQ] Connecting to broker...");
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();

      this.connection.on("error", (err: Error) => {
        console.error("[RabbitMQ] Connection error:", err.message);
        this.connection = null;
        this.channel = null;
      });

      this.connection.on("close", () => {
        console.warn("[RabbitMQ] Connection closed.");
        this.connection = null;
        this.channel = null;
      });

      console.log("[RabbitMQ] Connected successfully.");
    } catch (error) {
      console.error("[RabbitMQ] Failed to connect:", error);
      throw error;
    }
  }

  public getChannel(): amqp.Channel {
    if (!this.channel) {
      throw new Error(
        "[RabbitMQ] Channel is not initialized. Call connect() first.",
      );
    }
    return this.channel;
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      console.log("[RabbitMQ] Disconnected gracefully.");
    } catch (error) {
      console.error("[RabbitMQ] Error during disconnect:", error);
    }
  }

  public async assertQueue(
    queue: string,
    options: amqp.Options.AssertQueue = { durable: true },
  ): Promise<void> {
    const channel = this.getChannel();
    await channel.assertQueue(queue, options);
    console.log(`[RabbitMQ] Queue "${queue}" asserted.`);
  }
}
