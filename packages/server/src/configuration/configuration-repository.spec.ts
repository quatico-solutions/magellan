/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { TransportHandler } from "@quatico/magellan-shared";
import { initDependencyContext } from "../services";
import { expandConfig, getConfiguration, initProjectConfiguration } from "./configuration-repository";
import { getDefaultConfiguration } from "./default-configuration";

const defaultTransportHandler: TransportHandler = jest.fn();

beforeEach(() => {
    // @ts-ignore
    global.__qsMagellanServerConfig__ = undefined;
    initDependencyContext({ defaultTransportRequest: jest.fn(), defaultTransportHandler });
});

describe("initProjectConfiguration", () => {
    it("should return the same configuration", () => {
        const expected = {
            namespaces: { default: { endpoint: "http://localhost:8080/api", transport: "default" } },
            transports: { default: jest.fn() },
        };

        const actual = initProjectConfiguration(expected);

        expect(actual).toEqual(expected);
    });
});

describe("getDefaultConfig", () => {
    it("should return the minimal default configuration", () => {
        const actual = getDefaultConfiguration();

        expect(actual).toEqual({
            namespaces: { default: { endpoint: "/api", transport: "default" } },
            transports: { default: defaultTransportHandler },
        });
    });
});

describe("getConfiguration", () => {
    it("should read the local configuration w/o fetchable configuration", () => {
        const expected = getDefaultConfiguration();

        const actual = getConfiguration();

        expect(actual).toEqual(expected);
    });
});

describe("expandConfig", () => {
    it("should expand config w/ missing transport", () => {
        const actual = expandConfig({ namespaces: { default: { endpoint: "/expected" } } });

        expect(actual).toEqual({
            namespaces: { default: { endpoint: "/expected", transport: "default" } },
            transports: { default: defaultTransportHandler },
        });
    });

    it("should expand config w/ missing namespace", () => {
        const actual = expandConfig({ transports: { default: defaultTransportHandler } });

        expect(actual).toEqual({
            namespaces: { default: { endpoint: "/api", transport: "default" } },
            transports: { default: defaultTransportHandler },
        });
    });

    it("should add default configuration w/ a non-default configuration", () => {
        const actual = expandConfig({ namespaces: { fun: { endpoint: "/fun" } } });

        expect(actual).toEqual({
            namespaces: { default: { endpoint: "/api", transport: "default" }, fun: { endpoint: "/fun", transport: "default" } },
            transports: { default: defaultTransportHandler },
        });
    });
});
