/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import {FunctionService} from "./FunctionService";
import {transportRequest} from "../transport";
import {addNamespace} from "../configuration";

describe("invokeFunction", () => {
    it("calls function with registered function", async () => {
        const target = jest.fn();

        const testObj = new FunctionService().registerFunction("target", target);

        await testObj.invokeFunction({name: "target", data: "expected"});

        expect(target).toHaveBeenCalledWith("expected");
    });

    it("requests remote execution with locally unregistered function", async () => {
        const target = jest.fn();
        const testObj = new FunctionService(target);
        addNamespace("remote", {endpoint: "/api", transport: "default"});

        testObj.invokeFunction({name: "target", data: "expected", namespace: "remote"});

        expect(target).toHaveBeenCalledWith({name: "target", data: "expected", namespace: "remote"});
    });

    // TODO: This assumption no longer holds until a full function registration with name and namespace becomes available across frontend, node and
    // java both for manually and automatically registered functions!
    it.skip("throws error with with unknown function", async () => {
        const testObj = new FunctionService();

        expect(() => testObj.invokeFunction({name: "target", data: "expected"})).toThrow(
            new Error('Cannot invoke function "target". Function is not registered.')
        );
    });
});

describe("registerFunction", () => {
    it("yields function with name", () => {
        const target = new Map();
        const expected = jest.fn();

        new FunctionService(transportRequest, target).registerFunction("expected", expected);

        expect(target.get("expected")).toBe(expected);
    });

    it("yields overridden function with existing name", () => {
        const target = new Map();
        const expected = jest.fn().mockName("expected");

        new FunctionService(transportRequest, target).registerFunction("expected", jest.fn().mockName("whatever"))
                                                     .registerFunction("expected", expected);

        expect(target.get("expected")).toBe(expected);
    });

    it("throws error with invalid function", () => {
        expect(() => new FunctionService().registerFunction("expected", null as any)).toThrow(new Error('Function "expected" is not a function.'));
    });

    it("throws error with invalid function name", () => {
        expect(() => new FunctionService().registerFunction("", jest.fn())).toThrow(new Error("Cannot register function without a name."));
    });
});