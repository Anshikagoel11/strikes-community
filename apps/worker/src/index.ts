import { getConsumer } from "./consumer.js";

async function runConsumer() {
  console.log("Starting Kafka Consumer...\n");
  const consumer = getConsumer();

  const shutdown = async () => {
    await consumer.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  try {
    await consumer.start();

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
