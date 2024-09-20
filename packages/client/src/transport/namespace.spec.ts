/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import type { NamespaceMapping, TransportHandler } from "@quatico/magellan-shared";
import { getConfiguration, initProjectConfiguration } from "./configuration-repository";
import { addNamespace, addNamespaceIfAbsent, addTransport, addTransportIfAbsent, resolveNamespace, setNamespace, setTransport } from "./namespace";
import { ResolvedNamespace } from "./ResolvedNamespace";

const defaultTransport = jest.fn();

beforeEach(() => {
    initProjectConfiguration({
        namespaces: { default: { endpoint: "/api", transport: "default" } },
        transports: { default: defaultTransport },
    });
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

describe("resolveNamespace", () => {
    it("should resolve 'default' namespace with default config", () => {
        const expected: ResolvedNamespace = {
            name: "default",
            endpoint: "/api",
            transport: defaultTransport,
        };

        const actual = resolveNamespace();

        expect(actual).toEqual(expected);
    });

    it("should resolve 'expected' namespace with expected config", () => {
        const expectedTransport: TransportHandler = jest.fn();
        const expectedNamespace: NamespaceMapping = { endpoint: "/expected", transport: "expected" };
        const expected: ResolvedNamespace = {
            name: "expected",
            endpoint: expectedNamespace.endpoint,
            transport: expectedTransport,
        };

        addTransport("expected", expectedTransport);
        addNamespace("expected", expectedNamespace);

        const actual = resolveNamespace("expected");

        expect(actual).toEqual(expected);
    });

    it("should resolve 'expected' namespace with default config", () => {
        const expectedNamespace: NamespaceMapping = { endpoint: "/expected" };
        const expected: ResolvedNamespace = {
            name: "expected",
            endpoint: expectedNamespace.endpoint,
            transport: defaultTransport,
        };

        addNamespace("expected", expectedNamespace);

        const actual = resolveNamespace("expected");

        expect(actual).toEqual(expected);
    });

    it("should throw if no configuration is found", () => {
        expect(() => resolveNamespace("test")).toThrow(new Error('Failed to resolve namespace "test". No configuration found.'));
    });
});
