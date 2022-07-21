/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import {Sdk} from "./sdk";
import {FunctionService} from "./services";

afterEach(() => {
    global.functionService = new FunctionService();
});
describe("invokeFunction", () => {
    it("invokes function with registered function", async () => {
        const target = jest.fn();

        await new Sdk().registerFunction("test", target).invokeFunction("test", "whatever");

        expect(target).toHaveBeenCalledTimes(1);
    });

    // TODO: This assumption no longer holds until a full function registration with name and namespace becomes available across frontend, node and java
    //          both for manually and automatically registered functions!
    it.skip("throws error without registering functions", async () => {
        expect(() => new Sdk().invokeFunction("test", "whatever")).toThrow(new Error('Cannot invoke function "test". Function is not registered.'));
    });
});