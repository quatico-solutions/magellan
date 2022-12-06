/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { packInput, serialize } from "@quatico/magellan-shared";
import { addNamespace, addTransport, initProjectConfiguration } from "../configuration";
import { initDependencyContext } from "../services";
import { transportRequest } from "./transport-request";

const transportHandler = jest.fn();

beforeAll(() => {
    initDependencyContext({ defaultTransportRequest: jest.fn(), defaultTransportHandler: transportHandler });
    addTransport("test", transportHandler);
    addNamespace("test", { endpoint: "/api", transport: "test" });
});

afterEach(() => {
    transportHandler.mockClear();
});

describe("transportRequest", () => {
    beforeEach(() => {
        // eslint-disable-next-line no-console
        console.warn = () => undefined;
    });

    it("calls fetch passing serialized input parameters with simple object", async () => {
        const target = { data: "whatever" };
        transportHandler.mockResolvedValueOnce(serialize(target));

        await transportRequest({ name: "whatever", data: target, namespace: "test" });

        expect(transportHandler).toHaveBeenCalledTimes(1);
        expect(transportHandler).toHaveBeenCalledWith(
            { endpoint: "/api", payload: packInput(target), name: "whatever", namespace: "test" },
            { headers: {} }
        );
    });

    it("calls fetch using no input parameter w/o data property", async () => {
        const target = {};
        transportHandler.mockResolvedValueOnce(serialize(target));

        await transportRequest({ name: "whatever", namespace: "test" });

        expect(transportHandler).toHaveBeenCalledTimes(1);
        expect(transportHandler).toHaveBeenCalledWith(
            { endpoint: "/api", payload: packInput(target), name: "whatever", namespace: "test" },
            { headers: {} }
        );
    });

    it("calls deserialize passing result from fetch", async () => {
        transportHandler.mockReturnValue(Buffer.from("expected"));
        const target = jest.fn();

        await transportRequest(
            { name: "whatever", data: "whatever", namespace: "test" },
            { headers: {} },
            {
                serialize: jest.fn(),
                deserialize: target,
            }
        );

        expect(target).toHaveBeenCalledWith(Buffer.from("expected"));
    });

    it("calls serialize passing result from fetch", async () => {
        transportHandler.mockReturnValue(serialize("expected"));
        const target = jest.fn();

        await transportRequest(
            { name: "whatever", data: "expected", namespace: "test" },
            { headers: {} },
            {
                serialize: target,
                deserialize: jest.fn(),
            }
        );

        expect(target).toHaveBeenCalledWith("expected");
    });

    it("calls fetch passing function name from input", async () => {
        transportHandler.mockReturnValue(serialize("whatever"));
        initProjectConfiguration({
            namespaces: { default: { endpoint: "http://expected-host:3000/api" } },
            transports: { default: transportHandler },
        });

        await transportRequest(
            { name: "expected", data: "whatever" },
            { headers: {} },
            {
                serialize: (val: unknown) => JSON.stringify(val),
                deserialize: (val: string) => JSON.parse(val),
            }
        );

        expect(transportHandler).toHaveBeenCalledTimes(1);
        expect(transportHandler).toHaveBeenCalledWith(
            { endpoint: "http://expected-host:3000/api", payload: JSON.stringify("whatever"), name: "expected", namespace: "default" },
            { headers: {} }
        );
    });

    it("calls fetch w/ baseUrl, servicePath", async () => {
        transportHandler.mockReturnValue(serialize("whatever"));
        initProjectConfiguration({
            namespaces: { default: { endpoint: "http://expected-host:3000/expected/path/function" } },
            transports: { default: transportHandler },
        });

        await transportRequest(
            { name: "target", data: "whatever" },
            { headers: {} },
            {
                serialize: (val: unknown) => JSON.stringify(val),
                deserialize: (val: string) => JSON.parse(val),
            }
        );

        expect(transportHandler).toHaveBeenCalledTimes(1);
        expect(transportHandler).toHaveBeenCalledWith(
            {
                endpoint: "http://expected-host:3000/expected/path/function",
                payload: JSON.stringify("whatever"),
                name: "target",
                namespace: "default",
            },
            { headers: {} }
        );
    });

    it("throws meaningful error when called without name property", async () => {
        const actual = transportRequest({} as any);

        await expect(actual).rejects.toThrow('Cannot invoke remote function without "name" property.');
    });

    it("throws meaningful error with error thrown by serialize", async () => {
        global.fetch = jest.fn().mockReturnValue(Promise.resolve({ text: () => "whatever" }));

        const actual = transportRequest(
            { name: "foobar", data: "whatever" },
            { headers: {} },
            {
                serialize: () => {
                    throw new Error("expected");
                },
                deserialize: jest.fn(),
            }
        );

        await expect(actual).rejects.toThrow('Cannot serialize input parameter for remote function: "foobar".');
    });

    it("yields meaningful error with error in deserialize", async () => {
        transportHandler.mockImplementation(() => "malformed JSON");

        const actual = transportRequest({ name: "whatever", data: "whatever", namespace: "test" });

        await expect(actual).rejects.toThrow('Cannot deserialize response from remote function: "whatever".');
    });
});
