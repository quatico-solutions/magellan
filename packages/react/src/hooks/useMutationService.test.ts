/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { expectTypeOf } from "expect-type";
import { useMutationService } from "./useMutationService";

jest.mock("@tanstack/react-query");

type ExampleResult = {
    expectedString: "value";
    expectedNumber: 1;
    expectedBoolean: true;
    expectedArray: ["expectedString"];
    expectedObject: { expected: "value" };
};

type ExampleInput = {
    expectedString: "value";
    expectedNumber: 1;
    expectedBoolean: true;
    expectedArray: ["expectedString"];
    expectedObject: { expected: "value" };
};

describe("useMutationService", () => {
    const mockedMagellanFn: jest.MockedFunction<(arg0: ExampleInput) => Promise<ExampleResult>> = jest.fn().mockResolvedValue({
        expectedString: "value",
        expectedNumber: 1,
        expectedBoolean: true,
        expectedArray: ["expectedString"],
        expectedObject: { expected: "value" },
    });

    it("infers and narrows the correct types for useMutationService hook result members", () => {
        const { isLoading, isError, isSuccess, data, error, mutate } = useMutationService({
            mutationKey: ["test"],
            serviceFn: mockedMagellanFn,
        });

        expectTypeOf(mutate).toEqualTypeOf<(input: ExampleInput) => Promise<ExampleResult>>();
        expectTypeOf(isLoading).toEqualTypeOf<boolean>();
        expectTypeOf(isError).toEqualTypeOf<boolean>();
        expectTypeOf(data).toEqualTypeOf<ExampleResult | undefined>();
        expectTypeOf(error).toEqualTypeOf<Error | null>();

        // When we've checked the loading state, data and error are not present yet
        if (isLoading) {
            expectTypeOf(error).toEqualTypeOf<null>();
            expectTypeOf(data).toEqualTypeOf<undefined>();

            // When we've checked the error state, types are narrowed to the error type being present and data being undefined
        } else if (isError) {
            expectTypeOf(error).toEqualTypeOf<Error>();
            expectTypeOf(data).toEqualTypeOf<undefined>();

            // And vice versa, when we've checked the success state, types are narrowed to the data type being present and error being null
        } else if (isSuccess) {
            expectTypeOf(error).toEqualTypeOf<null>();
            expectTypeOf(data).toEqualTypeOf<ExampleResult>();
        } else {
            expectTypeOf(error).toEqualTypeOf<null>();
            expectTypeOf(data).toEqualTypeOf<undefined>();
        }
    });
});
