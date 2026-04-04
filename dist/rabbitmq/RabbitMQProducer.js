"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQProducer = void 0;
const RabbitMQClient_1 = require("./RabbitMQClient");
class RabbitMQProducer {
    client;
    constructor() {
        this.client = RabbitMQClient_1.RabbitMQClient.getInstance();
    }
    async publish(queue, payload, options = { persistent: true }) {
        const channel = this.client.getChannel();
        await channel.assertQueue(queue, { durable: true });
        const messageBuffer = Buffer.from(JSON.stringify(payload));
        const sent = channel.sendToQueue(queue, messageBuffer, options);
        if (sent) {
            console.log(`[Producer] Message published to queue "${queue}":`, payload);
        }
        else {
            console.warn(`[Producer] Queue "${queue}" is full or write buffer is saturated.`);
        }
        return sent;
    }
    async publishToExchange(exchange, payload, options = { persistent: true }) {
        const channel = this.client.getChannel();
        await channel.assertExchange(exchange, "fanout", { durable: true });
        const messageBuffer = Buffer.from(JSON.stringify(payload));
        channel.publish(exchange, "", messageBuffer, options);
        console.log(`[Producer] Message published to exchange "${exchange}":`, payload);
    }
}
exports.RabbitMQProducer = RabbitMQProducer;
