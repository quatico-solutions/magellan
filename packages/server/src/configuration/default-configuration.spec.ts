/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { initDependencyContext } from "../services";
import { completeConfig } from "./default-configuration";

beforeAll(() => {
    initDependencyContext({ defaultTransportRequest: jest.fn(), defaultTransportHandler: jest.fn() });
});

describe("completeConfig", () => {
    it("should complete a missing namespaces entry", () => {
        const target = jest.fn();

        const actual = completeConfig({ transports: { default: target } } as any);

        expect(actual).toEqual({
            namespaces: {},
            transports: { default: target },
        });
    });

    it("should complete a missing transports entry", () => {
        const actual = completeConfig({ namespaces: { default: { endpoint: "/expected" } } } as any);

        expect(actual).toEqual({
            namespaces: {
                default: {
                    endpoint: "/expected",
                },
            },
            transports: {},
        });
    });
});
