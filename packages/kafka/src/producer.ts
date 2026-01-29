import { kafka, TOPICS } from "./client.js";
import type { Producer } from "kafkajs";

export interface ChatMessage {
    id: string;
    content: string;
    memberId: string;
    channelId?: string;
    conversationId?: string;
    fileUrl?: string;
    timestamp: number;
    serverId?: string;
    [key: string]: any;
}

export class MessageProducer {
    private producer: Producer;
    private isConnected = false;

    constructor() {
        this.producer = kafka.producer();
    }

    async connect() {
        if (!this.isConnected) {
            await this.producer.connect();
            this.isConnected = true;
        }
    }

    async disconnect() {
        if (this.isConnected) {
            await this.producer.disconnect();
            this.isConnected = false;
        }
    }

    async publishMessage(message: ChatMessage): Promise<string> {
        await this.connect();

        const topic = TOPICS.MESSAGES;
        const partitionKey = message.channelId || message.conversationId!;

        try {
            await this.producer.send({
                topic,
                messages: [
                    {
                        key: partitionKey,
                        value: JSON.stringify(message),
                    },
                ],
            });

            return message.id;
        } catch (error) {
            console.error("Failed to publish message:", error);
            throw error;
        }
    }
}

// Singleton instance
let producerInstance: MessageProducer | null = null;

export function getProducer(): MessageProducer {
    if (!producerInstance) {
        producerInstance = new MessageProducer();
    }
    return producerInstance;
}
