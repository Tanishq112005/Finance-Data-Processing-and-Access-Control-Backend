import { RabbitMQClient } from "../RabbitMQClient";
import * as amqp from "amqplib";
import { BREVO_API_KEY, BREVO_SENDER_EMAIL } from "../../config/env";
const SibApiV3Sdk = require("@getbrevo/brevo");

export class EmailConsumer {
  private client: RabbitMQClient;
  private readonly queueName = "email_queue";
  private brevoInstance: any;

  constructor(client: RabbitMQClient) {
    this.client = client;
    this.initBrevo();
  }

  private initBrevo() {
    this.brevoInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    let apiKey = SibApiV3Sdk.ApiClient.instance.authentications["api-key"];
    apiKey.apiKey = BREVO_API_KEY;
  }

  public async start() {
    try {
      await this.client.assertQueue(this.queueName);
      const channel = this.client.getChannel();

      console.log(
        `[EmailConsumer] Waiting for messages in ${this.queueName}...`,
      );

      channel.consume(
        this.queueName,
        async (msg: amqp.ConsumeMessage | null) => {
          if (msg) {
            try {
              const content = JSON.parse(msg.content.toString());
              console.log(`[EmailConsumer] Received message:`, content);

              await this.sendEmail(content);

              channel.ack(msg);
              console.log(
                `[EmailConsumer] Message processed and acknowledged.`,
              );
            } catch (err) {
              console.error(`[EmailConsumer] Error processing message:`, err);

              channel.nack(msg, false, true);
            }
          }
        },
      );
    } catch (error) {
      console.error(`[EmailConsumer] Failed to start:`, error);
      throw error;
    }
  }

  private async sendEmail(data: { to: string; subject: string; body: string }) {
    const { to, subject, body } = data;

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = body;
    sendSmtpEmail.sender = {
      name: "Finance Dashboard",
      email: BREVO_SENDER_EMAIL,
    };
    sendSmtpEmail.to = [{ email: to }];

    try {
      const result = await this.brevoInstance.sendTransacEmail(sendSmtpEmail);
      console.log(
        `[EmailConsumer] Email sent successfully to ${to}. MessageId:`,
        result.messageId,
      );
    } catch (error) {
      console.error(`[EmailConsumer] Failed to send email via Brevo:`, error);
      throw error;
    }
  }
}
