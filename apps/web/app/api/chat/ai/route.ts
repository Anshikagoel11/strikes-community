import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
    HumanMessage,
    AIMessage,
    SystemMessage,
} from "@langchain/core/messages";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

    try {
        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.0-flash",
            apiKey: API_KEY,
            temperature: 0.7,
            maxOutputTokens: 1000,
        });

        const { messages } = await req.json();

        if (!messages) {
            return NextResponse.json(
                { error: "Messages array is required" },
                { status: 400 },
            );
        }

        // Convert messages to LangChain format with context
        const formattedMessages = [
            new SystemMessage(
                "You are a helpful AI assistant in a community chat platform.",
            ),
            ...messages.map((msg: { role: string; content: string }) => {
                if (msg.role === "user") {
                    return new HumanMessage(msg.content);
                }
                return new AIMessage(msg.content);
            }),
        ];

        // Stream response
        const stream = await model.stream(formattedMessages);

        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const text = chunk.content;
                        if (typeof text === "string" && text.length > 0) {
                            controller.enqueue(
                                encoder.encode(
                                    `data: ${JSON.stringify({ content: text })}\n\n`,
                                ),
                            );
                        }
                    }
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    controller.close();
                } catch (error) {
                    console.error("Stream Error:", error);
                    controller.error(error);
                }
            },
        });

        return new Response(readableStream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        console.error("AI Chat Error:", error);
        return NextResponse.json(
            { error: "Failed to process chat request" },
            { status: 500 },
        );
    }
}
