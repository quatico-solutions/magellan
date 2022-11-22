/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { packInput, serialize } from "@quatico/magellan-shared";
import { remoteInvoke } from "./remote-invoke";
import { formdataFetch, initProjectConfiguration } from "./transport";

let formAppend: jest.Mock;
let formSet: jest.Mock;
let headerAppend: jest.Mock;
let headerSet: jest.Mock;
beforeAll(() => {
    formAppend = jest.fn();
    formSet = jest.fn();
    headerAppend = jest.fn();
    headerSet = jest.fn();

    function formDataMock() {
        // @ts-ignore
        this.append = formAppend;
        // @ts-ignore
        this.set = formSet;
    }

    // @ts-ignore
    global.FormData = formDataMock;

    function headerMock() {
        // @ts-ignore
        this.append = headerAppend;
        // @ts-ignore
        this.set = headerSet;
    }

    // @ts-ignore
    global.Headers = headerMock;
});

describe("remoteInvoke", () => {
    beforeEach(() => {
        // eslint-disable-next-line no-console
        console.warn = () => undefined;
    });

    it("calls fetch passing serialized input parameters with simple object", async () => {
        global.fetch = jest.fn().mockReturnValue(Promise.resolve({ text: () => serialize(target) }));
        const target = { data: "whatever" };

        await remoteInvoke({ name: "whatever", data: target });

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(`/api`, {
            body: expect.any(FormData),
            headers: expect.any(Headers),
            method: "POST",
        });

        expect(formSet).toHaveBeenCalledTimes(3);
        expect(formSet).toHaveBeenNthCalledWith(1, "name", "whatever");
        expect(formSet).toHaveBeenNthCalledWith(2, "data", packInput(target));
        expect(formSet).toHaveBeenNthCalledWith(3, "namespace", "default");
    });

    it("calls fetch using no input parameter w/o data property", async () => {
        const target = {};
        global.fetch = jest.fn().mockReturnValue(Promise.resolve({ text: () => serialize(target) }));

        await remoteInvoke({ name: "whatever" });

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(`/api`, {
            body: expect.any(FormData),
            headers: expect.any(Headers),
            method: "POST",
        });

        expect(formSet).toHaveBeenCalledTimes(3);
        expect(formSet).toHaveBeenNthCalledWith(1, "name", "whatever");
        expect(formSet).toHaveBeenNthCalledWith(2, "data", packInput(target));
        expect(formSet).toHaveBeenNthCalledWith(3, "namespace", "default");
    });

    it("calls deserialize passing result from fetch", async () => {
        global.fetch = jest.fn().mockReturnValue(Promise.resolve({ text: () => Buffer.from("expected") }));
        const target = jest.fn();

        await remoteInvoke(
            { name: "whatever", data: "whatever" },
            { headers: new Headers() },
            {
                serialize: jest.fn(),
                deserialize: target,
            }
        );

        expect(target).toHaveBeenCalledWith(Buffer.from("expected"));
    });

    it("calls serialize passing result from fetch", async () => {
        global.fetch = jest.fn().mockReturnValue(Promise.resolve({ text: () => serialize("expected") }));
        const target = jest.fn();

        await remoteInvoke(
            { name: "whatever", data: "expected" },
            { headers: new Headers() },
            {
                serialize: target,
                deserialize: jest.fn(),
            }
        );

        expect(target).toHaveBeenCalledWith("expected");
    });

    it("calls fetch passing function name from input", async () => {
        global.fetch = jest.fn().mockReturnValue(Promise.resolve({ text: () => serialize("whatever") }));
        initProjectConfiguration({ namespaces: { default: { endpoint: "http://expected-host:3000/api" } }, transports: { default: formdataFetch } });

        await remoteInvoke(
            { name: "expected", data: "whatever" },
            { headers: new Headers() },
            {
                serialize: val => JSON.stringify(val),
                deserialize: val => JSON.parse(val),
            }
        );

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(`http://expected-host:3000/api`, {
            body: expect.any(FormData),
            headers: expect.any(Headers),
            method: "POST",
        });

        expect(formSet).toHaveBeenCalledTimes(3);
        expect(formSet).toHaveBeenNthCalledWith(1, "name", "expected");
        expect(formSet).toHaveBeenNthCalledWith(2, "data", JSON.stringify("whatever"));
        expect(formSet).toHaveBeenNthCalledWith(3, "namespace", "default");
    });

    it("calls fetch w/ baseUrl, servicePath", async () => {
        global.fetch = jest.fn().mockReturnValue(Promise.resolve({ text: () => serialize("whatever") }));
        initProjectConfiguration({
            namespaces: { default: { endpoint: "http://expected-host:3000/expected/path/function" } },
            transports: { default: formdataFetch },
        });

        await remoteInvoke(
            { name: "target", data: "whatever" },
            { headers: new Headers() },
            {
                serialize: val => JSON.stringify(val),
                deserialize: val => JSON.parse(val),
            }
        );

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(`http://expected-host:3000/expected/path/function`, {
            body: expect.any(FormData),
            headers: expect.any(Headers),
            method: "POST",
        });

        expect(formSet).toHaveBeenCalledTimes(3);
        expect(formSet).toHaveBeenNthCalledWith(1, "name", "target");
        expect(formSet).toHaveBeenNthCalledWith(2, "data", JSON.stringify("whatever"));
        expect(formSet).toHaveBeenNthCalledWith(3, "namespace", "default");
    });

    it("throws meaningful error when called without name property", async () => {
        const actual = remoteInvoke({} as any);

        await expect(actual).rejects.toThrow('Cannot invoke remote function without "name" property.');
    });

    it("throws meaningful error with error thrown by serialize", async () => {
        global.fetch = jest.fn().mockReturnValue(Promise.resolve({ text: () => "whatever" }));

        const actual = remoteInvoke(
            { name: "foobar", data: "whatever" },
            { headers: new Headers() },
            {
                serialize: () => {
                    throw new Error("expected");
                },
                deserialize: jest.fn(),
            }
        );

        await expect(actual).rejects.toThrow('Cannot serialize input parameter for remote function: "foobar".');
    });

    it("throws meaningful error with error thrown by fetch", async () => {
        global.fetch = jest.fn().mockImplementation(() => {
            throw new Error("whatever");
        });

        const actual = remoteInvoke({ name: "foobar", data: "whatever" });

        await expect(actual).rejects.toThrow('Cannot invoke remote function: "foobar". Reason: "Error: whatever".');
    });

    it("throws meaningful error with error thrown by response data access", async () => {
        global.fetch = jest.fn().mockImplementation(() => ({
            text: () => {
                throw new Error("whatever");
            },
        }));

        const actual = remoteInvoke({ name: "foobar", data: "whatever" });

        await expect(actual).rejects.toThrow('Cannot invoke remote function: "foobar". Reason: "Error: whatever".');
    });

    it("yields meaningful error with error in deserialize", async () => {
        global.fetch = jest.fn().mockImplementation(() => ({
            text: () => "malformed JSON",
        }));

        const actual = remoteInvoke({ name: "whatever", data: "whatever" });

        await expect(actual).rejects.toThrow('Cannot deserialize response from remote function: "whatever".');
    });
});
