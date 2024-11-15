/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { initDependencyContext } from "../services";
import { getConfiguration, initProjectConfiguration } from "./configuration-repository";
import { setNamespace, setTransport } from "./namespace";

const defaultTransport = jest.fn();

beforeEach(() => {
    initDependencyContext({ defaultTransportRequest: jest.fn(), defaultTransportHandler: defaultTransport });
    initProjectConfiguration({ namespaces: { default: { endpoint: "/api", transport: "default" } }, transports: { default: defaultTransport } });
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
