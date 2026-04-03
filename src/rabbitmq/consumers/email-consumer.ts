import { RabbitMQClient } from "../RabbitMQClient";
import * as amqp from "amqplib";
import { BREVO_API_KEY, BREVO_SENDER_EMAIL } from "../../config/env";
import { BrevoClient } from "@getbrevo/brevo";

export class EmailConsumer {
  private client: RabbitMQClient;
  private readonly queueName = "email_queue";
  private brevoClient: BrevoClient;

  constructor(client: RabbitMQClient) {
    this.client = client;
    this.brevoClient = new BrevoClient({
      apiKey: BREVO_API_KEY
    });
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
            } catch (err: any) {
              const errorMessage = err?.body?.message || "";
              
              if (errorMessage.includes("unrecognised IP address")) {
                console.error("\n" + "=".repeat(60));
                console.error("⛔ BREVO SECURITY ALERT: IP ADDRESS NOT AUTHORIZED");
                console.error("------------------------------------------------------------");
                console.error(errorMessage);
                console.error("------------------------------------------------------------");
                console.error("👉 ACTION REQUIRED: Add your IP to the Brevo dashboard here:");
                console.error("🔗 https://app.brevo.com/security/authorised_ips");
                console.error("=".repeat(60) + "\n");
                
                // Do not requeue if the IP is not authorized (it will only keep failing)
                channel.nack(msg, false, false);
              } else {
                console.error(`[EmailConsumer] Error processing message:`, err);
                channel.nack(msg, false, true);
              }
            }
          }
        },
      );
    } catch (error) {
      console.error(`[EmailConsumer] Failed to start:`, error);
      throw error;
    }
  }

  private async sendEmail(data: { email_to: string; subject: string; content: string }) {
    const { email_to, subject, content } = data;

    try {
      const result = await this.brevoClient.transactionalEmails.sendTransacEmail({
        subject: subject,
        htmlContent: content,
        sender: {
          name: "Finance Dashboard",
          email: BREVO_SENDER_EMAIL,
        },
        to: [{ email: email_to }],
      });
      console.log(
        `[EmailConsumer] Email sent successfully to ${email_to}. MessageId:`,
        result.messageId,
      );
    } catch (error) {
      console.error(`[EmailConsumer] Failed to send email via Brevo:`, error);
      throw error;
    }
  }
}
