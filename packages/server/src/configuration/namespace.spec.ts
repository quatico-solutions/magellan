/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { initDependencyContext } from "../services";
import { getConfiguration, initProjectConfiguration } from "./configuration-repository";
import { addNamespace, addNamespaceIfAbsent, addTransport, addTransportIfAbsent, setNamespace, setTransport } from "./namespace";

const defaultTransport = jest.fn();

beforeEach(() => {
    initDependencyContext({ defaultTransportRequest: jest.fn(), defaultTransportHandler: defaultTransport });
    initProjectConfiguration({ namespaces: { default: { endpoint: "/api", transport: "default" } }, transports: { default: defaultTransport } });
});

describe("addNamespace", () => {
    it("should add namespace if it does not exist", () => {
        const expected = { endpoint: "/expected", transport: "expected" };

        addNamespace("expected", expected);

        expect(getConfiguration().namespaces).toEqual({
            default: { endpoint: "/api", transport: "default" },
            expected: expected,
        });
    });

    it("should throw error when namespace is added that already exists", () => {
        expect(() => addNamespace("default", { endpoint: "/expected", transport: "expected" })).toThrow(
            new Error('Namespace "default" already registered.')
        );
    });
});

describe("addNamespaceIfAbsent", () => {
    it("should add namespace if it does not exist", () => {
        const expected = { endpoint: "/expected", transport: "expected" };

        addNamespaceIfAbsent("expected", expected);

        expect(getConfiguration().namespaces).toEqual({
            default: { endpoint: "/api", transport: "default" },
            expected: expected,
        });
    });

    it("should not add or alter namespace if it exists", () => {
        addNamespaceIfAbsent("default", { endpoint: "/expected", transport: "expected" });

        expect(getConfiguration().namespaces).toEqual({ default: { endpoint: "/api", transport: "default" } });
    });
});

describe("setNamespace", () => {
    it("should replace the default namespace", () => {
        const expected = { endpoint: "/expected", transport: "expected" };

        setNamespace("default", expected);

        expect(getConfiguration().namespaces).toEqual({ default: expected });
    });

    it("should add namespace if it does not exist", () => {
        const expected = { endpoint: "/expected", transport: "expected" };

        setNamespace("expected", expected);

        expect(getConfiguration().namespaces).toEqual({
            default: { endpoint: "/api", transport: "default" },
            expected: expected,
        });
    });
});

describe("addTransport", () => {
    it("should add transport if it does not exist", () => {
        const expected = jest.fn();

        addTransport("expected", expected);

        expect(getConfiguration().transports).toEqual({
            default: defaultTransport,
            expected: expected,
        });
    });

    it("should throw error when transport is added that already exists", () => {
        expect(() => addTransport("default", jest.fn())).toThrow(new Error('Transport "default" already registered.'));
    });
});

describe("addTransportIfAbsent", () => {
    it("should add transport if it does not exist", () => {
        const expected = jest.fn();

        addTransportIfAbsent("expected", expected);

        expect(getConfiguration().transports).toEqual({
            default: defaultTransport,
            expected: expected,
        });
    });

    it("should not add or alter transport if it exists", () => {
        const target = jest.fn();

        addTransportIfAbsent("default", target);

        expect(getConfiguration().transports).toEqual({ default: defaultTransport });
    });
});

describe("setTransport", () => {
    it("should replace the default transport", () => {
        const expected = jest.fn();

        setTransport("default", expected);

        expect(getConfiguration().transports).toEqual({ default: expected });
    });

    it("should add transport if it does not exist", () => {
        const expected = jest.fn();

        setTransport("expected", expected);

        expect(getConfiguration().transports).toEqual({
            default: defaultTransport,
            expected: expected,
        });
    });
});
