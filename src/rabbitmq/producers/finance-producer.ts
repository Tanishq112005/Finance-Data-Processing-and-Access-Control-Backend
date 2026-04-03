import { RabbitMQProducer } from "../RabbitMQProducer";

export interface FinanceJobPayload {
  action: "CREATE" | "UPDATE" | "DELETE";
  userId: string;
  recordId: string;
  data?: any;
}

export class FinanceProducer extends RabbitMQProducer {
  private readonly queueName = "finance_queue";

  public async dispatchJob(payload: FinanceJobPayload): Promise<boolean> {
    try {
      console.log(
        `[FinanceProducer] Dispatching ${payload.action} job to Background Queue for record ${payload.recordId}...`
      );
      return await this.publish(this.queueName, payload);
    } catch (error) {
      console.error(`[FinanceProducer] Failed to dispatch job:`, error);
      return false;
    }
  }
}

export const financeProducer = new FinanceProducer();
