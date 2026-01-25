#!/usr/bin/env node

/**
 * Kafka Setup Script
 * Run this to initialize Kafka topics and verify connectivity
 */

import { initializeTopics, kafka } from "../client";

async function setup() {
    console.log("🚀 Starting Kafka setup...\n");

    try {
        // Test connection
        console.log("📡 Testing Kafka connection...");
        const admin = kafka.admin();
        await admin.connect();
        console.log("✅ Successfully connected to Kafka\n");

        // List existing topics
        const topics = await admin.listTopics();
        console.log("📋 Existing topics:", topics.join(", ") || "None");

        await admin.disconnect();

        // Initialize topics
        console.log("\n🏗️ Creating topics...");
        await initializeTopics();

        console.log("\n✅ Kafka setup completed successfully!");
        console.log("\n📝 Next steps:");
        console.log("1. Start the consumer: bun run kafka:consumer");
        console.log("2. Test with a message: bun run kafka:test");
        console.log("3. Update your API routes to use the producer\n");
    } catch (error) {
        console.error("\n❌ Kafka setup failed:", error);
        console.error("\n🔧 Troubleshooting:");
        console.error("1. Verify KAFKA_BROKER is correct in .env");
        console.error("2. Check KAFKA_USERNAME and KAFKA_PASSWORD");
        console.error("3. Ensure Kafka cluster is accessible");
        console.error("4. Check firewall/network settings\n");
        process.exit(1);
    }
}

setup();
