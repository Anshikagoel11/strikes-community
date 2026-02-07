export * from "./session-manager";
export * from "./message-cache";

import { MessageCache } from "./message-cache";

let messageCacheInstance: MessageCache | null = null;

export function getMessageCache(): MessageCache {
    if (!messageCacheInstance) {
        messageCacheInstance = new MessageCache();
    }
    return messageCacheInstance;
}
