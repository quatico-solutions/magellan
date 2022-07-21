/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
/**
 * @jest-environment node
 */
import { externalFunctionInvoke } from "./external-invocation";

// tests skipped because no server environment exists during tests, use in IDE for testing with sandbox
// eslint-disable-next-line jest/no-disabled-tests
describe.skip("externalFunctionInvoke", () => {
    it("calls invokeFunction on server", async () => {
        const result = await externalFunctionInvoke("com.quatico.magellan.java.services.CalculateFibonacci", { input: { value: 8 } });
        expect(result).toStrictEqual({ result: 21 });
    });
    it("throws for undefined function on server", async () => {
        await expect(async () => {
            await externalFunctionInvoke("com.quatico.magellan.java.services.CalculateFibonacci-UNDEFINED", { value: 8 });
        }).rejects.toThrow("function error: 'error during function invocation: Function not defined'");
    });
});
