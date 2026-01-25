#!/usr/bin/env node

/**
 * Kafka Consumer Runner
 * Run this to start the message consumer in a separate process
 */

import "dotenv/config";
import { getConsumer } from "../consumer";

// Suppress KafkaJS TimeoutNegativeWarning
process.removeAllListeners("warning");
process.on("warning", (warning) => {
    if (warning.name !== "TimeoutNegativeWarning") {
        console.warn(warning);
    }
});

async function runConsumer() {
    console.log("Starting Kafka Consumer...\n");
    const consumer = getConsumer();

    // Graceful shutdown
    const shutdown = async () => {
        await consumer.stop();
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    try {
        await consumer.start();

        // Monitor consumer lag every 30 seconds
        setInterval(async () => {
            try {
                const lag = await consumer.getLag();
                if (lag > 1000) {
                    console.warn(`⚠️  High lag: ${lag} messages`);
                }
            } catch (error) {
                console.error("❌ Failed to get lag:", error);
            }
        }, 30000);

        console.log("✅ Consumer running. Press Ctrl+C to stop.\n");
    } catch (error) {
        console.error("❌ Consumer failed to start:", error);
        process.exit(1);
    }
}

runConsumer();
