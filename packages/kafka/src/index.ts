export * from "./client";
export * from "./producer";

// Explicitly import and then export from kafkajs to satisfy Turbopack/ESM requirements
import { Kafka, logLevel, CompressionTypes } from "kafkajs";
export { Kafka, logLevel, CompressionTypes };

export type {
    Consumer,
    Producer,
    EachBatchPayload,
    EachMessagePayload,
    Message,
    RecordMetadata,
} from "kafkajs";
