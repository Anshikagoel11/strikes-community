import { Kafka, logLevel } from "kafkajs";

// Kafka client configuration (Aiven)
export const kafka = new Kafka({
    clientId: "strikes-community",
    brokers: [
        process.env.KAFKA_BROKER ||
            "discord-project-dicord.c.aivencloud.com:23563",
    ],
    sasl: {
        mechanism: "scram-sha-256", // Aiven uses SCRAM-SHA-256, not plain
        username: process.env.KAFKA_USERNAME!,
        password: process.env.KAFKA_PASSWORD!,
    },
    ssl: {
        rejectUnauthorized: false, // Disable for Aiven self-signed certs (dev only)
        // For production, download CA cert from Aiven and use:
        // ca: [fs.readFileSync('./ca.pem', 'utf-8')]
    },
    logLevel: logLevel.INFO, // Change to INFO for debugging
    retry: {
        initialRetryTime: 300,
        retries: 8,
        maxRetryTime: 30000,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
});

// Kafka Topics
export const TOPICS = {
    MESSAGES: "chat-messages",
    DIRECT_MESSAGES: "direct-messages",
    MESSAGE_ACKNOWLEDGMENTS: "message-acks",
    USER_PRESENCE: "user-presence",
    MESSAGE_EDITS: "message-edits",
    MESSAGE_DELETES: "message-deletes",
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
    [TOPICS.MESSAGE_ACKNOWLEDGMENTS]: {
        numPartitions: 1,
        replicationFactor: 1,
    },
    [TOPICS.USER_PRESENCE]: {
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
