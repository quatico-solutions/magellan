/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import type { NamespaceMapping, TransportHandler } from "@quatico/magellan-shared";
import { getConfiguration, initProjectConfiguration } from "./configuration-repository";
import { resolveNamespace, setNamespace, setTransport } from "./namespace";
import { type ResolvedNamespace } from "./ResolvedNamespace";

const defaultTransport = jest.fn();

beforeEach(() => {
    initProjectConfiguration({
        namespaces: { default: { endpoint: "/api", transport: "default" } },
        transports: { default: defaultTransport },
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

        setTransport("expected", expectedTransport);
        setNamespace("expected", expectedNamespace);

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

        setNamespace("expected", expectedNamespace);

        const actual = resolveNamespace("expected");

        expect(actual).toEqual(expected);
    });

    it("should throw if no configuration is found", () => {
        expect(() => resolveNamespace("test")).toThrow(new Error('Failed to resolve namespace "test". No configuration found.'));
    });
});
