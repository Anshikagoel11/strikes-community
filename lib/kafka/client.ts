import { Kafka, logLevel } from "kafkajs";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Get current directory for Bun compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load CA certificate from file
let caCert: Buffer | undefined;
try {
    // Try multiple possible paths
    const possiblePaths = [
        resolve(__dirname, "../../certificate/ca.pem"),
        resolve(process.cwd(), "certificate/ca.pem"),
    ];

    for (const path of possiblePaths) {
        try {
            caCert = readFileSync(path);
            console.log(`✅ CA certificate loaded`);
            break;
        } catch {
            continue;
        }
    }

    if (!caCert) {
        throw new Error("CA certificate not found in any expected location");
    }
} catch (error) {
    console.warn(
        "⚠️ CA certificate not found. Using insecure connection (dev only)",
    );
    console.warn(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
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
              rejectUnauthorized: false, // Fallback: disable cert validation (dev only)
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
    DIRECT_MESSAGES: "direct-messages",
} as const;

// Topic configurations (minimal config for Aiven free tier)
// Aiven enforces strict policies - using defaults to avoid POLICY_VIOLATION
export const TOPIC_CONFIGS = {
    [TOPICS.MESSAGES]: {
        numPartitions: 1, // Aiven free tier: use 1 partition
        replicationFactor: 1, // Aiven free tier: use 1 replica (not 2)
        // No custom configEntries - use Aiven defaults
    },
    [TOPICS.DIRECT_MESSAGES]: {
        numPartitions: 1,
        replicationFactor: 1,
    },
};

// Initialize topics (run this once during setup)
export async function initializeTopics() {
    const admin = kafka.admin();

    try {
        await admin.connect();

        const existingTopics = await admin.listTopics();
        const topicsToCreate = Object.entries(TOPIC_CONFIGS)
            .filter(([topic]) => !existingTopics.includes(topic))
            .map(([topic, config]) => ({
                topic,
                ...config,
            }));

        if (topicsToCreate.length > 0) {
            await admin.createTopics({
                topics: topicsToCreate,
            });
            console.log(
                `✅ Created topics: ${topicsToCreate.map((t) => t.topic).join(", ")}`,
            );
        } else {
            console.log("✅ All topics already exist");
        }
    } catch (error) {
        console.error("❌ Failed to initialize topics:", error);
        throw error;
    } finally {
        await admin.disconnect();
    }
}
