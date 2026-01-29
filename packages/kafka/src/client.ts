import { Kafka, logLevel } from "kafkajs";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

// Get current directory
const __dirname = process.cwd();

// Load CA certificate from file
let caCert: Buffer | undefined;
try {
    // Try multiple possible paths - assuming running from app root
    const possiblePaths = [
        resolve(process.cwd(), "certificate/ca.pem"),
        resolve(process.cwd(), "../certificate/ca.pem"), // If in apps/xxx
        resolve(__dirname, "../../../certificate/ca.pem"), // If checking relative to package (unlikely to work in monorepo build)
    ];

    for (const path of possiblePaths) {
        try {
            caCert = readFileSync(path);
            break;
        } catch {
            continue;
        }
    }
} catch (error) {
    // Ignore error, will use insecure or fail later
}

// Kafka client configuration (Aiven)
export const kafka = new Kafka({
    clientId: "strikes-community",
    brokers: [
        process.env.KAFKA_BROKER ||
            "discord-project-dicord.c.aivencloud.com:23563",
    ],
    sasl: {
        mechanism: "scram-sha-256", // Aiven uses SCRAM-SHA-256
        username: process.env.KAFKA_USERNAME!,
        password: process.env.KAFKA_PASSWORD!,
    },
    ssl: caCert
        ? {
              rejectUnauthorized: true,
              ca: [caCert],
          }
        : {
              rejectUnauthorized: false,
          },
    logLevel: logLevel.ERROR,
    retry: {
        initialRetryTime: 100,
        retries: 10,
        maxRetryTime: 30000,
    },
    connectionTimeout: 10000,
    requestTimeout: 30000,
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
