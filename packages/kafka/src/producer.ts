import { kafka, TOPICS } from "./client";
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
        this.producer = kafka.producer({
            allowAutoTopicCreation: false,
            transactionTimeout: 30000,
            idempotent: true,
            maxInFlightRequests: 5,
            retry: {
                retries: 5,
            },
        });
    }

    async connect() {
        if (!this.isConnected) {
            await this.producer.connect();
            this.isConnected = true;
            console.log("✅ Kafka Producer connected");
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
                        headers: {
                            "message-id": message.id,
                            "retry-count": "0",
                        },
                    },
                ],
            });

            return message.id;
        } catch (error) {
            console.error("❌ Failed to publish message:", error);
            throw error;
        }
    }

    async publishBatch(messages: ChatMessage[]): Promise<void> {
        await this.connect();

        const groupedByTopic = messages.reduce(
            (acc, msg) => {
                const topic = TOPICS.MESSAGES;
                if (!acc[topic]) acc[topic] = [];
                acc[topic].push(msg);
                return acc;
            },
            {} as Record<string, ChatMessage[]>,
        );

        try {
            for (const [topic, msgs] of Object.entries(groupedByTopic)) {
                await this.producer.send({
                    topic,
                    messages: msgs.map((msg) => ({
                        key: msg.channelId || msg.conversationId!,
                        value: JSON.stringify(msg),
                        headers: {
                            "message-id": msg.id,
                            batch: "true",
                        },
                    })),
                });
            }
            console.log(`📦 Batch published: ${messages.length} messages`);
        } catch (error) {
            console.error("❌ Failed to publish batch:", error);
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
