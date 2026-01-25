#!/usr/bin/env node

/**
 * Test Kafka setup by sending and receiving a test message
 */

import { getProducer } from "../producer";
import { v4 as uuidv4 } from "uuid";

async function testKafka() {
    console.log("🧪 Testing Kafka integration...\n");

    const producer = getProducer();

    try {
        // Send a test message
        const testMessage = {
            id: uuidv4(),
            content: "Test message from Kafka setup",
            memberId: "test-member-id",
            channelId: "test-channel-id",
            timestamp: Date.now(),
        };

        console.log("📤 Sending test message...");
        await producer.publishMessage(testMessage);
        console.log("✅ Test message sent successfully!");

        console.log("\n📋 Message details:");
        console.log(JSON.stringify(testMessage, null, 2));

        console.log(
            "\n💡 Check your consumer logs to verify the message was received.",
        );
        console.log("Run: bun run kafka:consumer\n");

        await producer.disconnect();
    } catch (error) {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }
}

testKafka();
