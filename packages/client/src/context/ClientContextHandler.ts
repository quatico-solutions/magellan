import { CLIENT_CONTEXT_CHANGED_EVENT_TYPE, type ClientContext, type ClientContextChangedEvent } from "@quatico/magellan-shared";
import { resolveNamespace } from "../transport";

declare global {
    interface WindowEventMap {
        [CLIENT_CONTEXT_CHANGED_EVENT_TYPE]: ClientContextChangedEvent;
    }
}

export class ClientContextHandler {
    static readonly #clientContextMap = new Map<string, ClientContext>();

    public static updateClientContext(namespace: string, context: ClientContext) {
        const resolvedNamespace = resolveNamespace(namespace);
        ClientContextHandler.#clientContextMap.set(resolvedNamespace.name, context);
    }

    public static getClientContext(namespace: string): ClientContext {
        const resolvedNamespace = resolveNamespace(namespace);
        return ClientContextHandler.#clientContextMap.get(resolvedNamespace.name) ?? { client: { headers: {} } };
    }

    public static addClientContextChangedListener(
        eventHandler: (event: ClientContextChangedEvent) => void = ClientContextHandler.defaultEventHandler
    ) {
        globalThis.addEventListener(CLIENT_CONTEXT_CHANGED_EVENT_TYPE, eventHandler);
    }

    public static removeClientContextChangedListener(
        eventHandler: (event: ClientContextChangedEvent) => void = ClientContextHandler.defaultEventHandler
    ) {
        globalThis.removeEventListener(CLIENT_CONTEXT_CHANGED_EVENT_TYPE, eventHandler);
    }

    private static defaultEventHandler(event: ClientContextChangedEvent) {
        ClientContextHandler.updateClientContext(event.namespace, event.context);
    }
}
