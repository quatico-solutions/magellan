/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { setNamespace } from "../configuration";
import { transportRequest } from "../transport";
import { initDependencyContext } from "./DependencyContext";
import { FunctionService } from "./FunctionService";

describe("invokeFunction", () => {
    beforeAll(() => {
        initDependencyContext({ defaultTransportRequest: jest.fn(), defaultTransportHandler: jest.fn() });
    });

    it("calls function with registered function", async () => {
        const target = jest.fn();

        const testObj = new FunctionService(jest.fn()).registerFunction("target", target);

        await testObj.invokeFunction({ name: "target", data: "expected" });

        expect(target).toHaveBeenCalledWith("expected", { server: {} });
    });

    it("requests remote execution with locally unregistered function", async () => {
        const target = jest.fn();
        const testObj = new FunctionService(target);
        setNamespace("remote", { endpoint: "/api", transport: "default" });

        await testObj.invokeFunction({ name: "target", data: "expected", namespace: "remote" });

        expect(target).toHaveBeenCalledWith({ name: "target", data: "expected", namespace: "remote" }, { server: {} });
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

        new FunctionService(transportRequest, target)
            .registerFunction("expected", jest.fn().mockName("whatever"))
            .registerFunction("expected", expected);

        expect(target.get("expected")).toBe(expected);
    });

    it("throws error with invalid function", () => {
        expect(() => new FunctionService(jest.fn()).registerFunction("expected", null as any)).toThrow(
            new Error('Function "expected" is not a function.')
        );
    });

    it("throws error with invalid function name", () => {
        expect(() => new FunctionService(jest.fn()).registerFunction("", jest.fn())).toThrow(new Error("Cannot register function without a name."));
    });
});
