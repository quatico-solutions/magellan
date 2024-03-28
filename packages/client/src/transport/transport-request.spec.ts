/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { packInput } from "@quatico/magellan-shared";
import { initProjectConfiguration } from "./configuration-repository";
import { formdataFetch } from "./formdata-fetch";
import { transportRequest } from "./transport-request";

let formAppend: jest.Mock;
let formSet: jest.Mock;
beforeAll(() => {
    formAppend = jest.fn();
    formSet = jest.fn();

    function formDataMock() {
        // @ts-ignore
        this.append = formAppend;
        // @ts-ignore
        this.set = formSet;
    }

    // @ts-ignore
    global.FormData = formDataMock;
});

describe("transportRequest", () => {
    beforeEach(() => {
        // eslint-disable-next-line no-console
        console.warn = () => undefined;
    });

    it("calls fetch passing serialized input parameters with simple object", async () => {
        const target = { data: "whatever" };
        const mockResponse: Partial<Response> = {
            status: 200,
            ok: true,
            text: () => Promise.resolve(packInput(target)),
        };
        global.fetch = jest.fn().mockResolvedValue(mockResponse);

        await transportRequest({ name: "whatever", data: target });

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(`/api`, {
            body: expect.any(FormData),
            headers: expect.anything(),
            method: "POST",
        });

        expect(formSet).toHaveBeenCalledTimes(3);
        expect(formSet).toHaveBeenNthCalledWith(1, "name", "whatever");
        expect(formSet).toHaveBeenNthCalledWith(2, "data", packInput(target));
        expect(formSet).toHaveBeenNthCalledWith(3, "namespace", "default");
    });

    it("calls fetch using no input parameter w/o data property", async () => {
        const target = {};
        const mockResponse: Partial<Response> = {
            status: 200,
            ok: true,
            text: () => Promise.resolve(packInput(target)),
        };
        global.fetch = jest.fn().mockResolvedValue(mockResponse);

        await transportRequest({ name: "whatever" });

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(`/api`, {
            body: expect.any(FormData),
            headers: expect.anything(),
            method: "POST",
        });

        expect(formSet).toHaveBeenCalledTimes(3);
        expect(formSet).toHaveBeenNthCalledWith(1, "name", "whatever");
        expect(formSet).toHaveBeenNthCalledWith(2, "data", packInput(target));
        expect(formSet).toHaveBeenNthCalledWith(3, "namespace", "default");
    });

    it("calls deserialize passing result from fetch", async () => {
        const value = Buffer.from("expected");
        const mockResponse: Partial<Response> = {
            status: 200,
            ok: true,
            // @ts-ignore
            text: () => Promise.resolve(value),
        };
        global.fetch = jest.fn().mockResolvedValue(mockResponse);
        const target = jest.fn().mockImplementation(value => value);

        await transportRequest(
            { name: "whatever", data: "whatever" },
            { headers: {} },
            {
                serialize: jest.fn(),
                deserialize: target,
            }
        );

        expect(target).toHaveBeenCalledWith(value);
    });

    it("calls serialize passing result from fetch", async () => {
        const value = "expected";
        const mockResponse: Partial<Response> = {
            status: 200,
            ok: true,
            text: () => Promise.resolve(packInput(value)),
        };
        global.fetch = jest.fn().mockResolvedValue(mockResponse);
        const target = jest.fn();

        await transportRequest(
            { name: "whatever", data: value },
            { headers: {} },
            {
                serialize: target,
                deserialize: jest.fn().mockImplementation(value => value),
            }
        );

        expect(target).toHaveBeenCalledWith(value);
    });

    it("calls fetch passing function name from input", async () => {
        const value = "whatever";
        const mockResponse: Partial<Response> = {
            status: 200,
            ok: true,
            text: () => Promise.resolve(packInput(value)),
        };
        global.fetch = jest.fn().mockResolvedValue(mockResponse);
        initProjectConfiguration({
            namespaces: { default: { endpoint: "http://expected-host:3000/api" } },
            transports: { default: formdataFetch },
        });

        await transportRequest(
            { name: "expected", data: value },
            { headers: {} },
            {
                serialize: val => JSON.stringify(val),
                deserialize: val => JSON.parse(val),
            }
        );

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(`http://expected-host:3000/api`, {
            body: expect.any(FormData),
            headers: expect.anything(),
            method: "POST",
        });

        expect(formSet).toHaveBeenCalledTimes(3);
        expect(formSet).toHaveBeenNthCalledWith(1, "name", "expected");
        expect(formSet).toHaveBeenNthCalledWith(2, "data", JSON.stringify(value));
        expect(formSet).toHaveBeenNthCalledWith(3, "namespace", "default");
    });

    it("calls fetch w/ baseUrl, servicePath", async () => {
        const value = "whatever";
        const mockResponse: Partial<Response> = {
            status: 200,
            ok: true,
            text: () => Promise.resolve(packInput(value)),
        };
        global.fetch = jest.fn().mockResolvedValue(mockResponse);
        initProjectConfiguration({
            namespaces: { default: { endpoint: "http://expected-host:3000/expected/path/function" } },
            transports: { default: formdataFetch },
        });

        await transportRequest(
            { name: "target", data: value },
            { headers: {} },
            {
                serialize: val => JSON.stringify(val),
                deserialize: val => JSON.parse(val),
            }
        );

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(`http://expected-host:3000/expected/path/function`, {
            body: expect.any(FormData),
            headers: expect.anything(),
            method: "POST",
        });

        expect(formSet).toHaveBeenCalledTimes(3);
        expect(formSet).toHaveBeenNthCalledWith(1, "name", "target");
        expect(formSet).toHaveBeenNthCalledWith(2, "data", JSON.stringify(value));
        expect(formSet).toHaveBeenNthCalledWith(3, "namespace", "default");
    });

    it("throws meaningful error when called without name property", async () => {
        const actual = transportRequest({} as any);

        await expect(actual).rejects.toThrow('Cannot invoke remote function without "name" property.');
    });

    it("throws meaningful error with error thrown by fetch", async () => {
        global.fetch = jest.fn().mockImplementation(() => {
            throw new Error("whatever");
        });

        const actual = transportRequest({ name: "foobar", data: "whatever" });

        await expect(actual).rejects.toThrow('Cannot invoke remote function: "foobar". Reason: "Error: whatever".');
    });

    it("throws meaningful error with error thrown by response data access", async () => {
        global.fetch = jest.fn().mockImplementation(() => ({
            ok: true,
            status: 200,
            text: () => {
                throw new Error("whatever");
            },
        }));

        const actual = transportRequest({ name: "foobar", data: "whatever" });

        await expect(actual).rejects.toThrow('Cannot invoke remote function: "foobar". Reason: "Error: whatever".');
    });

    it("yield rejection with request with invalid format", async () => {
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

        await expect(actual).rejects.toBe("Serialization failed");
    });

    it("yields rejection with response with invalid format", async () => {
        global.fetch = jest.fn().mockImplementation(() => ({
            ok: true,
            status: 200,
            text: () => "malformed JSON",
        }));

        const actual = transportRequest({ name: "whatever", data: "whatever" });

        await expect(actual).rejects.toBe("Deserialization failed");
    });

    it("yields rejection with response with ok flag, status and statusText set", async () => {
        global.fetch = jest.fn().mockImplementation(() => ({
            ok: false,
            status: 404,
            statusText: "not found",
        }));

        const actual = transportRequest({ name: "whatever", data: "whatever" });

        await expect(actual).rejects.toStrictEqual({ message: "not found", status: 404 });
    });

    it("yields rejection with response with undefined ok flag", async () => {
        global.fetch = jest.fn().mockImplementation(() => ({
            status: 500,
        }));

        const actual = transportRequest({ name: "whatever", data: "whatever" });

        await expect(actual).rejects.toStrictEqual({ message: "", status: 500 });
    });
});
