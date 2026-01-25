#!/usr/bin/env node

/**
 * Kafka Consumer Runner
 * Run this to start the message consumer in a separate process
 */

import { getConsumer } from "../consumer";

async function runConsumer() {
    console.log("🎯 Starting Kafka Message Consumer...\n");

    const consumer = getConsumer();

    // Graceful shutdown
    const shutdown = async () => {
        console.log("\n⚠️ Shutting down consumer...");
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
                    console.warn(
                        `⚠️ High consumer lag detected: ${lag} messages`,
                    );
                } else {
                    console.log(`📊 Consumer lag: ${lag} messages`);
                }
            } catch (error) {
                console.error("❌ Failed to get lag:", error);
            }
        }, 30000);

        console.log("✅ Consumer is running. Press Ctrl+C to stop.\n");
    } catch (error) {
        console.error("❌ Consumer failed to start:", error);
        process.exit(1);
    }
}

runConsumer();
