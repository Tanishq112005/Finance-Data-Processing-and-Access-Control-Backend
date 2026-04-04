"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQClient = void 0;
const amqp = __importStar(require("amqplib"));
const env_1 = require("../config/env");
class RabbitMQClient {
    static instance;
    connection;
    channel;
    url;
    constructor() {
        this.url = env_1.RABBITMQ_URL;
    }
    static getInstance() {
        if (!RabbitMQClient.instance) {
            RabbitMQClient.instance = new RabbitMQClient();
        }
        return RabbitMQClient.instance;
    }
    async connect() {
        if (this.connection && this.channel) {
            return;
        }
        try {
            console.log("[RabbitMQ] Connecting to broker...");
            this.connection = await amqp.connect(this.url);
            this.channel = await this.connection.createChannel();
            this.connection.on("error", (err) => {
                console.error("[RabbitMQ] Connection error:", err.message);
                this.connection = null;
                this.channel = null;
            });
            this.connection.on("close", () => {
                console.warn("[RabbitMQ] Connection closed.");
                this.connection = null;
                this.channel = null;
            });
            console.log("[RabbitMQ] Connected successfully.");
        }
        catch (error) {
            console.error("[RabbitMQ] Failed to connect:", error);
            throw error;
        }
    }
    getChannel() {
        if (!this.channel) {
            throw new Error("[RabbitMQ] Channel is not initialized. Call connect() first.");
        }
        return this.channel;
    }
    async disconnect() {
        try {
            if (this.channel) {
                await this.channel.close();
                this.channel = null;
            }
            if (this.connection) {
                await this.connection.close();
                this.connection = null;
            }
            console.log("[RabbitMQ] Disconnected gracefully.");
        }
        catch (error) {
            console.error("[RabbitMQ] Error during disconnect:", error);
        }
    }
    async assertQueue(queue, options = { durable: true }) {
        const channel = this.getChannel();
        await channel.assertQueue(queue, options);
        console.log(`[RabbitMQ] Queue "${queue}" asserted.`);
    }
}
exports.RabbitMQClient = RabbitMQClient;
