"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailProducer = exports.EmailProducer = void 0;
const RabbitMQProducer_1 = require("../RabbitMQProducer");
class EmailProducer extends RabbitMQProducer_1.RabbitMQProducer {
    queueName = "email_queue";
    async sendOtp(payload) {
        try {
            console.log(`[EmailProducer] Sending OTP email to ${payload.email_to}...`);
            return await this.publish(this.queueName, payload);
        }
        catch (error) {
            console.error(`[EmailProducer] Failed to send OTP:`, error);
            return false;
        }
    }
}
exports.EmailProducer = EmailProducer;
exports.emailProducer = new EmailProducer();
