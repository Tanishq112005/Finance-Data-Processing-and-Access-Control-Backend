"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceConsumer = void 0;
const finance_repository_1 = require("../../repository/finance.repository");
const redis_1 = require("../../lib/redis");
class FinanceConsumer {
    client;
    queueName = "finance_queue";
    constructor(client) {
        this.client = client;
    }
    async start() {
        try {
            await this.client.assertQueue(this.queueName);
            const channel = this.client.getChannel();
            console.log(`[FinanceConsumer] Waiting for messages in ${this.queueName}...`);
            channel.consume(this.queueName, async (msg) => {
                if (msg) {
                    try {
                        const content = JSON.parse(msg.content.toString());
                        console.log(`[FinanceConsumer] Processing job:`, content.action, content.recordId);
                        await this.processJob(content);
                        channel.ack(msg);
                        console.log(`[FinanceConsumer] Job processed and fully committed to PostgreSQL.`);
                    }
                    catch (err) {
                        console.error(`[FinanceConsumer] Error processing job:`, err);
                        channel.nack(msg, false, false);
                    }
                }
            });
        }
        catch (error) {
            console.error(`[FinanceConsumer] Failed to start:`, error);
            throw error;
        }
    }
    async processJob(payload) {
        const { action, userId, recordId, data } = payload;
        switch (action) {
            case "CREATE":
                await finance_repository_1.financeRepository.create({
                    id: recordId,
                    ...data,
                    createdById: userId,
                });
                break;
            case "UPDATE":
                await finance_repository_1.financeRepository.update(recordId, data);
                break;
            case "DELETE":
                await finance_repository_1.financeRepository.delete(recordId);
                break;
            default:
                console.warn(`[FinanceConsumer] Unknown action: ${action}`);
        }
        await redis_1.redisClient.hDel(`user:${userId}:records_cache`, recordId);
    }
}
exports.FinanceConsumer = FinanceConsumer;
