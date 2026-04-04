"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailConsumer = void 0;
const env_1 = require("../../config/env");
const brevo_1 = require("@getbrevo/brevo");
class EmailConsumer {
    client;
    queueName = "email_queue";
    brevoClient;
    constructor(client) {
        this.client = client;
        this.brevoClient = new brevo_1.BrevoClient({
            apiKey: env_1.BREVO_API_KEY
        });
    }
    async start() {
        try {
            await this.client.assertQueue(this.queueName);
            const channel = this.client.getChannel();
            console.log(`[EmailConsumer] Waiting for messages in ${this.queueName}...`);
            channel.consume(this.queueName, async (msg) => {
                if (msg) {
                    try {
                        const content = JSON.parse(msg.content.toString());
                        console.log(`[EmailConsumer] Received message:`, content);
                        await this.sendEmail(content);
                        channel.ack(msg);
                        console.log(`[EmailConsumer] Message processed and acknowledged.`);
                    }
                    catch (err) {
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
                        }
                        else {
                            console.error(`[EmailConsumer] Error processing message:`, err);
                            channel.nack(msg, false, true);
                        }
                    }
                }
            });
        }
        catch (error) {
            console.error(`[EmailConsumer] Failed to start:`, error);
            throw error;
        }
    }
    async sendEmail(data) {
        const { email_to, subject, content } = data;
        try {
            const result = await this.brevoClient.transactionalEmails.sendTransacEmail({
                subject: subject,
                htmlContent: content,
                sender: {
                    name: "Finance Dashboard",
                    email: env_1.BREVO_SENDER_EMAIL,
                },
                to: [{ email: email_to }],
            });
            console.log(`[EmailConsumer] Email sent successfully to ${email_to}. MessageId:`, result.messageId);
        }
        catch (error) {
            console.error(`[EmailConsumer] Failed to send email via Brevo:`, error);
            throw error;
        }
    }
}
exports.EmailConsumer = EmailConsumer;
