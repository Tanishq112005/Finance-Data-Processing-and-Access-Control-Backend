import { RabbitMQProducer } from "../RabbitMQProducer";
import { email_data } from "../../types/email.worker.types";

export class EmailProducer extends RabbitMQProducer {
  private readonly queueName = "email_queue";

  public async sendOtp(payload: email_data): Promise<boolean> {
    try {
      console.log(
        `[EmailProducer] Sending OTP email to ${payload.email_to}...`,
      );
      return await this.publish(this.queueName, payload);
    } catch (error) {
      console.error(`[EmailProducer] Failed to send OTP:`, error);
      return false;
    }
  }
}

export const emailProducer = new EmailProducer();
