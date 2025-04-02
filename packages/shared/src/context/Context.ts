/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
interface Ctx<C, S> {
    // client context
    client?: C;
    // server context
    server?: S;
}

type DefaultClientContext = { headers: Record<string, string> };

export interface ClientContext<C = DefaultClientContext> extends Ctx<C, never> {
    client: C;
}

type DefaultServerContext = Record<string, string>;

export interface ServerContext<S = DefaultServerContext> extends Ctx<never, S> {
    server: S;
}

export type Context<C = DefaultClientContext, S = DefaultServerContext> = ClientContext<C> | ServerContext<S>;

declare global {
    interface WindowEventMap {
        [CLIENT_CONTEXT_CHANGED_EVENT_TYPE]: ClientContextChangedEvent;
    }
}

export const CLIENT_CONTEXT_CHANGED_EVENT_TYPE = "CLIENT_CONTEXT_CHANGED_EVENT";

export class ClientContextChangedEvent extends Event {
    public readonly namespace: string;
    public readonly context: ClientContext;

    constructor(namespace: string, context: ClientContext) {
        super(CLIENT_CONTEXT_CHANGED_EVENT_TYPE);
        this.namespace = namespace;
        this.context = context;
    }
}
