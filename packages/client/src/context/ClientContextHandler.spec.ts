/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { CLIENT_CONTEXT_CHANGED_EVENT_TYPE, ClientContextChangedEvent } from "@quatico/magellan-shared";
import { setNamespace } from "../transport";
import { ClientContextHandler } from "./ClientContextHandler";

describe("ClientContextHandler", () => {
    it("should return default headers for default namespace in browser if client context is not set", () => {
        const context = ClientContextHandler.getClientContext("default");
        expect(context).toEqual({ client: { headers: {} } });
    });

    it("should return context for default namespace in browser if client context is set", () => {
        ClientContextHandler.updateClientContext("default", { client: { headers: { "header-1": "test" } } });
        const context = ClientContextHandler.getClientContext("default");
        expect(context).toEqual({ client: { headers: { "header-1": "test" } } });
    });

    it("should return context for custom namespace in browser if client context is set", () => {
        setNamespace("custom", { endpoint: "/custom", transport: "default" });

        ClientContextHandler.updateClientContext("custom", { client: { headers: { "header-2": "test" } } });
        const context = ClientContextHandler.getClientContext("custom");
        expect(context).toEqual({ client: { headers: { "header-2": "test" } } });
    });

    it("should throw error if namespace is not registered", () => {
        expect(() => ClientContextHandler.getClientContext("unknown")).toThrow('Failed to resolve namespace "unknown". No configuration found.');
    });

    it("should update client context for custom namespacewhen event is dispatched", () => {
        setNamespace("custom", { endpoint: "/custom", transport: "default" });

        const dispatchEventSpy = jest.spyOn(globalThis, "dispatchEvent");
        const eventListenerSpy = jest.spyOn(globalThis, "addEventListener");

        ClientContextHandler.addClientContextChangedListener();
        expect(eventListenerSpy).toHaveBeenCalledWith(CLIENT_CONTEXT_CHANGED_EVENT_TYPE, expect.any(Function));

        // create and dispatch event
        const event = new ClientContextChangedEvent("custom", { client: { headers: { "header-2": "test" } } });
        globalThis.dispatchEvent(event);
        expect(dispatchEventSpy).toHaveBeenCalledWith(event);

        // verify context was updated
        const context = ClientContextHandler.getClientContext("custom");
        expect(context).toStrictEqual({ client: { headers: { "header-2": "test" } } });

        // cleanup
        ClientContextHandler.removeClientContextChangedListener();
        dispatchEventSpy.mockRestore();
        eventListenerSpy.mockRestore();
    });

    it("should update client context for default namespace when event is dispatched", () => {
        setNamespace("custom", { endpoint: "/custom", transport: "default" });

        const dispatchEventSpy = jest.spyOn(globalThis, "dispatchEvent");
        const eventListenerSpy = jest.spyOn(globalThis, "addEventListener");

        ClientContextHandler.addClientContextChangedListener();
        expect(eventListenerSpy).toHaveBeenCalledWith(CLIENT_CONTEXT_CHANGED_EVENT_TYPE, expect.any(Function));

        // create and dispatch event
        const event = new ClientContextChangedEvent("default", { client: { headers: { "header-1": "test" } } });
        globalThis.dispatchEvent(event);
        expect(dispatchEventSpy).toHaveBeenCalledWith(event);

        // verify context was updated
        const context = ClientContextHandler.getClientContext("default");
        expect(context).toStrictEqual({ client: { headers: { "header-1": "test" } } });

        // cleanup
        ClientContextHandler.removeClientContextChangedListener();
        dispatchEventSpy.mockRestore();
        eventListenerSpy.mockRestore();
    });
});
