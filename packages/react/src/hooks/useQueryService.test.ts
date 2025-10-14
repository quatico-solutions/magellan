/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { expectTypeOf } from "expect-type";
import { useQueryService } from "./useQueryService";

jest.mock("@tanstack/react-query");

type ExampleResult = {
    expectedString: "value";
    expectedNumber: 1;
    expectedBoolean: true;
    expectedArray: ["expectedString"];
    expectedObject: { expected: "value" };
};

describe("useQueryService", () => {
    const mockedMagellanFn: jest.MockedFunction<() => Promise<ExampleResult>> = jest.fn().mockResolvedValue({
        expectedString: "value",
        expectedNumber: 1,
        expectedBoolean: true,
        expectedArray: ["expectedString"],
        expectedObject: { expected: "value" },
    });

    describe("type narrowing with discriminated unions", () => {
        it("narrows types with destructured members when enabled=true", () => {
            const { isLoading, isError, isSuccess, data, error } = useQueryService({
                queryKey: ["test"],
                serviceFn: mockedMagellanFn,
            });

            // Boolean and union types before narrowing
            expectTypeOf(isLoading).toEqualTypeOf<boolean>();
            expectTypeOf(isError).toEqualTypeOf<boolean>();
            expectTypeOf(isSuccess).toEqualTypeOf<boolean>();
            expectTypeOf(data).toEqualTypeOf<ExampleResult | undefined>();
            expectTypeOf(error).toEqualTypeOf<Error | null>();

            // Type narrowing with if/else chain
            if (isLoading) {
                expectTypeOf(data).toEqualTypeOf<undefined>();
                expectTypeOf(error).toEqualTypeOf<null>();
            } else if (isError) {
                expectTypeOf(data).toEqualTypeOf<undefined>();
                expectTypeOf(error).toEqualTypeOf<Error>();
            } else {
                expectTypeOf(data).toEqualTypeOf<ExampleResult>();
                expectTypeOf(error).toEqualTypeOf<null>();
            }

            // shortcuts with minimal checks also work (but only recommended if error and loading state dont need to be handled)
            if (!isLoading && !isError) {
                expectTypeOf(data).toEqualTypeOf<ExampleResult>();
            }
            if (isSuccess) {
                expectTypeOf(data).toEqualTypeOf<ExampleResult>();
            }
        });
    });

    it("requires isEnabled check when enabled is dynamic boolean", () => {
        const userIsLoggedIn: () => boolean = () => true;
        const { isLoading, isError, data, isEnabled, isSuccess } = useQueryService({
            queryKey: ["test"],
            serviceFn: mockedMagellanFn,
            enabled: userIsLoggedIn(),
        });

        // when enabled is dynamic, data can't be guaranteed to be defined
        if (!isLoading && !isError) {
            expectTypeOf(data).toEqualTypeOf<ExampleResult | undefined>();
        }

        // recommended pattern: check isEnabled first, then data is guaranteed to be defined
        if (isEnabled && !isLoading && !isError) {
            expectTypeOf(data).toEqualTypeOf<ExampleResult>();
        }
        // checking for isSuccess also guarantees data is defined
        if (isSuccess) {
            expectTypeOf(data).toEqualTypeOf<ExampleResult>();
        }
    });

    it("returns only disabled state when enabled=false", () => {
        const result = useQueryService({
            queryKey: ["test"],
            serviceFn: mockedMagellanFn,
            enabled: false,
        });

        // Literal types in disabled state
        expectTypeOf(result.isEnabled).toEqualTypeOf<false>();
        expectTypeOf(result.isLoading).toEqualTypeOf<false>();
        expectTypeOf(result.isError).toEqualTypeOf<false>();
        expectTypeOf(result.isSuccess).toEqualTypeOf<false>();
        expectTypeOf(result.data).toEqualTypeOf<undefined>();
        expectTypeOf(result.error).toEqualTypeOf<null>();
        expectTypeOf(result.refetch).toEqualTypeOf<() => Promise<unknown>>();
    });
});
