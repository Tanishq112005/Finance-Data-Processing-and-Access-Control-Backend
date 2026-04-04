"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.financeProducer = exports.FinanceProducer = void 0;
const RabbitMQProducer_1 = require("../RabbitMQProducer");
class FinanceProducer extends RabbitMQProducer_1.RabbitMQProducer {
    queueName = "finance_queue";
    async dispatchJob(payload) {
        try {
            console.log(`[FinanceProducer] Dispatching ${payload.action} job to Background Queue for record ${payload.recordId}...`);
            return await this.publish(this.queueName, payload);
        }
        catch (error) {
            console.error(`[FinanceProducer] Failed to dispatch job:`, error);
            return false;
        }
    }
}
exports.FinanceProducer = FinanceProducer;
exports.financeProducer = new FinanceProducer();
