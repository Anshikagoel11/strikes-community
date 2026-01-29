import { Kafka, logLevel } from "kafkajs";
import "dotenv/config";

export const kafka = new Kafka({
    clientId: "strikes-community",
    brokers: (process.env.KAFKA_BROKER || "localhost:9092").split(","),
    logLevel: logLevel.ERROR,
    retry: {
        initialRetryTime: 100,
        retries: 8,
    },
});

// Kafka Topics
export const TOPICS = {
    MESSAGES: "chat-messages",
} as const;

// Topic configurations
export const TOPIC_CONFIGS = {
    [TOPICS.MESSAGES]: {
        numPartitions: 1,
        replicationFactor: 1,
    },
};
