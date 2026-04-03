import { RabbitMQClient } from "../RabbitMQClient";
import * as amqp from "amqplib";
import { financeRepository } from "../../repository/finance.repository";
import { redisClient } from "../../lib/redis";

export class FinanceConsumer {
  private client: RabbitMQClient;
  private readonly queueName = "finance_queue";

  constructor(client: RabbitMQClient) {
    this.client = client;
  }

  public async start() {
    try {
      await this.client.assertQueue(this.queueName);
      const channel = this.client.getChannel();

      console.log(`[FinanceConsumer] Waiting for messages in ${this.queueName}...`);

      channel.consume(
        this.queueName,
        async (msg: amqp.ConsumeMessage | null) => {
          if (msg) {
            try {
              const content = JSON.parse(msg.content.toString());
              console.log(`[FinanceConsumer] Processing job:`, content.action, content.recordId);

              await this.processJob(content);

              channel.ack(msg);
              console.log(`[FinanceConsumer] Job processed and fully committed to PostgreSQL.`);
            } catch (err) {
              console.error(`[FinanceConsumer] Error processing job:`, err);
              channel.nack(msg, false, false);
            }
          }
        }
      );
    } catch (error) {
      console.error(`[FinanceConsumer] Failed to start:`, error);
      throw error;
    }
  }

  private async processJob(payload: any) {
    const { action, userId, recordId, data } = payload;
    
    switch (action) {
      case "CREATE":
        await financeRepository.create({
          id: recordId,
          ...data,
          createdById: userId,
        });
        break;

      case "UPDATE":
        await financeRepository.update(recordId, data);
        break;

      case "DELETE":
        await financeRepository.delete(recordId);
        break;

      default:
        console.warn(`[FinanceConsumer] Unknown action: ${action}`);
    }
    
    await redisClient.hDel(`user:${userId}:records_cache`, recordId);
  }
}
