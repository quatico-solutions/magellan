/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { formdataFetch } from "./formdata-fetch";
import { expandConfig, getConfiguration, initProjectConfiguration } from "./configuration-repository";
import { getDefaultConfiguration } from "./default-configuration";
import { Configuration } from "./Configuration";
import config from "./config";

jest.mock("./default-configuration");

beforeEach(() => {
    // @ts-ignore
    global.__qsMagellanConfig__ = undefined;
    jest.requireMock("./default-configuration").getDefaultConfiguration.mockReturnValue(config);
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
            transports: { default: formdataFetch },
        });
    });
});

describe("getConfiguration", () => {
    it("should read the local configuration w/o fetchable configuration", () => {
        const expected = getDefaultConfiguration();

        const actual = getConfiguration();

        // We are not interested in lastMerged
        delete actual.lastMerged;
        expect(actual).toEqual(expected);
    });

    it("should return a merged default configuration with a config.js different from global.__qsMagellanConfig__", () => {
        const preexistingConfig = <Configuration>{
            namespaces: { original: { endpoint: "/expected", transport: "default" } },
            transports: { default: formdataFetch },
            merge: true,
        };
        jest.requireMock("./default-configuration").getDefaultConfiguration.mockReturnValue(preexistingConfig);
        global.__qsMagellanConfig__ = config;
        const expected: Configuration = {
            namespaces: { ...config.namespaces, ...preexistingConfig.namespaces },
            transports: { default: formdataFetch },
        };

        const actual = getConfiguration();

        delete actual.lastMerged;
        expect(actual).toEqual(expected);
    });
});

describe("expandConfig", () => {
    it("should expand config w/ missing transport", () => {
        const actual = expandConfig({ namespaces: { default: { endpoint: "/expected" } } });

        expect(actual).toEqual({
            namespaces: { default: { endpoint: "/expected", transport: "default" } },
            transports: { default: formdataFetch },
        });
    });

    it("should expand config w/ missing namespace", () => {
        const actual = expandConfig({ transports: { default: formdataFetch } });

        expect(actual).toEqual({
            namespaces: { default: { endpoint: "/api", transport: "default" } },
            transports: { default: formdataFetch },
        });
    });

    it("should add default configuration w/ a non-default configuration", () => {
        const actual = expandConfig({ namespaces: { fun: { endpoint: "/fun" } } });

        expect(actual).toEqual({
            namespaces: {
                default: { endpoint: "/api", transport: "default" },
                fun: { endpoint: "/fun", transport: "default" },
            },
            transports: { default: formdataFetch },
        });
    });
});