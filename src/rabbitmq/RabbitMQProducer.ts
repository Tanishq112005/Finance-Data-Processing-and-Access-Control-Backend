import * as amqp from "amqplib";
import { RabbitMQClient } from "./RabbitMQClient";

export class RabbitMQProducer {
  private client: RabbitMQClient;

  constructor() {
    this.client = RabbitMQClient.getInstance();
  }

  public async publish<T = unknown>(
    queue: string,
    payload: T,
    options: amqp.Options.Publish = { persistent: true },
  ): Promise<boolean> {
    const channel = this.client.getChannel();

    await channel.assertQueue(queue, { durable: true });

    const messageBuffer = Buffer.from(JSON.stringify(payload));
    const sent = channel.sendToQueue(queue, messageBuffer, options);

    if (sent) {
      console.log(`[Producer] Message published to queue "${queue}":`, payload);
    } else {
      console.warn(
        `[Producer] Queue "${queue}" is full or write buffer is saturated.`,
      );
    }

    return sent;
  }

  public async publishToExchange<T = unknown>(
    exchange: string,
    payload: T,
    options: amqp.Options.Publish = { persistent: true },
  ): Promise<void> {
    const channel = this.client.getChannel();

    await channel.assertExchange(exchange, "fanout", { durable: true });

    const messageBuffer = Buffer.from(JSON.stringify(payload));
    channel.publish(exchange, "", messageBuffer, options);

    console.log(
      `[Producer] Message published to exchange "${exchange}":`,
      payload,
    );
  }
}
