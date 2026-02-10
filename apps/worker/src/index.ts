import { getConsumer } from "./consumer.js";

const LAG_CHECK_INTERVAL = 30000; // 30 seconds
const HIGH_LAG_THRESHOLD = 1000;

async function runConsumer() {
    console.log("Initializing Kafka Consumer Service...");
    const consumer = getConsumer();

    // Handle graceful shutdown
    const shutdown = async () => {
        console.log("\nShutdown signal received. Closing consumer...");
        await consumer.stop();
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    try {
        await consumer.start();

        // Monitor consumer lag periodically
        setInterval(async () => {
            try {
                const lag = await consumer.getLag();
                if (lag > HIGH_LAG_THRESHOLD) {
                    console.warn(
                        `High consumer lag detected: ${lag} messages waiting.`,
                    );
                }
            } catch (error) {
                console.error(
                    "Failed to fetch consumer lag statistics:",
                    error,
                );
            }
        }, LAG_CHECK_INTERVAL);

        console.log("Worker service is active. Press Ctrl+C to stop.\n");
    } catch (error) {
        console.error("CRITICAL: Worker service failed to start:", error);
    }
}

runConsumer();
