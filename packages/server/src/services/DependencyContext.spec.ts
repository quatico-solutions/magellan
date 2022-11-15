/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { getDependencyContext, initDependencyContext } from "./DependencyContext";

describe("initDependencyContext", () => {
    it("yields context w/ valid DependencyContext", () => {
        const defaultTransportRequest = jest.fn();
        const defaultTransportHandler = jest.fn();
        const expected = { defaultTransportRequest, defaultTransportHandler };

        initDependencyContext(expected);

        expect(global.__qsMagellanDI__).toEqual(expected);
    });
});

describe("getDependencyContext", () => {
    it("yields context w/ valid DependencyContext", () => {
        const defaultTransportRequest = jest.fn();
        const defaultTransportHandler = jest.fn();
        const expected = (global.__qsMagellanDI__ = { defaultTransportRequest, defaultTransportHandler });

        const actual = getDependencyContext();

        expect(actual).toEqual(expected);
    });
});
