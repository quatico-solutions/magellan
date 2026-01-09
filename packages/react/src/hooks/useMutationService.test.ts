/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { expectTypeOf } from "expect-type";
import { useMutation } from "@tanstack/react-query";
import { useContext } from "react";
import { useMutationService } from "./useMutationService";

jest.mock("@tanstack/react-query");

jest.mock("react", () => {
    const actualReact = jest.requireActual("react");
    // Create a simple useMemo implementation that just returns the value
    const mockUseMemo = <T>(factory: () => T): T => factory();
    return {
        ...actualReact,
        useContext: jest.fn(),
        useMemo: mockUseMemo,
    };
});

const mockedUseMutation = jest.mocked(useMutation);
const mockedUseContext = jest.mocked(useContext);
const mockedMutateAsync = jest.fn();

// Default mock return value for useMutation - provides a valid structure for type tests
beforeEach(() => {
    // Mock useContext to return undefined (no provider)
    mockedUseContext.mockReturnValue(undefined);

    mockedUseMutation.mockReturnValue({
        isPending: false,
        isError: false,
        isSuccess: false,
        isIdle: true,
        data: undefined,
        error: null,
        mutateAsync: mockedMutateAsync,
    } as any);
});

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

    describe("type narrowing with discriminated unions", () => {
        it("returns correct union types before narrowing", () => {
            const { isPending, isIdle, isError, isSuccess, data, error, mutate, status } = useMutationService({
                serviceFn: mockedMagellanFn,
                options: {
                    mutationKey: ["test"],
                },
            });

            // Mutate function type
            expectTypeOf(mutate).toEqualTypeOf<(input: ExampleInput) => Promise<ExampleResult>>();

            // All boolean flags are boolean type before narrowing
            expectTypeOf(isPending).toEqualTypeOf<boolean>();
            expectTypeOf(isIdle).toEqualTypeOf<boolean>();
            expectTypeOf(isError).toEqualTypeOf<boolean>();
            expectTypeOf(isSuccess).toEqualTypeOf<boolean>();

            // Status is a union of all possible states
            expectTypeOf(status).toEqualTypeOf<"idle" | "pending" | "error" | "success">();

            // Data and error are unions before narrowing
            expectTypeOf(data).toEqualTypeOf<ExampleResult | undefined>();
            expectTypeOf(error).toEqualTypeOf<Error | null>();
        });

        it("narrows types with isIdle check", () => {
            const { isIdle, data, error, status } = useMutationService({
                serviceFn: mockedMagellanFn,
                options: {
                    mutationKey: ["test"],
                },
            });

            if (isIdle) {
                // When idle, mutation hasn't been triggered yet
                expectTypeOf(error).toEqualTypeOf<null>();
                expectTypeOf(data).toEqualTypeOf<undefined>();
                expectTypeOf(status).toEqualTypeOf<"idle">();
            }
        });

        it("narrows types with isPending check", () => {
            const { isPending, data, error, status } = useMutationService({
                serviceFn: mockedMagellanFn,
                options: {
                    mutationKey: ["test"],
                },
            });

            if (isPending) {
                // When pending, mutation is in progress
                expectTypeOf(error).toEqualTypeOf<null>();
                expectTypeOf(data).toEqualTypeOf<undefined>();
                expectTypeOf(status).toEqualTypeOf<"pending">();
            }
        });

        it("narrows types with isError check", () => {
            const { isError, data, error, status } = useMutationService({
                serviceFn: mockedMagellanFn,
                options: {
                    mutationKey: ["test"],
                },
            });

            if (isError) {
                // When error, mutation failed and error is available
                expectTypeOf(error).toEqualTypeOf<Error>();
                expectTypeOf(data).toEqualTypeOf<undefined>();
                expectTypeOf(status).toEqualTypeOf<"error">();
            }
        });

        it("narrows types with isSuccess check", () => {
            const { isSuccess, data, error, status } = useMutationService({
                serviceFn: mockedMagellanFn,
                options: {
                    mutationKey: ["test"],
                },
            });

            if (isSuccess) {
                // When successful, data is available and error is null
                expectTypeOf(error).toEqualTypeOf<null>();
                expectTypeOf(data).toEqualTypeOf<ExampleResult>();
                expectTypeOf(status).toEqualTypeOf<"success">();
            }
        });

        it("narrows types using status field", () => {
            const { status, data, error } = useMutationService({
                serviceFn: mockedMagellanFn,
                options: {
                    mutationKey: ["test"],
                },
            });

            if (status === "idle") {
                expectTypeOf(data).toEqualTypeOf<undefined>();
                expectTypeOf(error).toEqualTypeOf<null>();
            } else if (status === "pending") {
                expectTypeOf(data).toEqualTypeOf<undefined>();
                expectTypeOf(error).toEqualTypeOf<null>();
            } else if (status === "error") {
                expectTypeOf(data).toEqualTypeOf<undefined>();
                expectTypeOf(error).toEqualTypeOf<Error>();
            } else {
                // status === "success"
                expectTypeOf(data).toEqualTypeOf<ExampleResult>();
                expectTypeOf(error).toEqualTypeOf<null>();
            }
        });
    });

    it("supports custom error types with TError generic", () => {
        type CustomError = { code: string; message: string };

        const { error, isError } = useMutationService<typeof mockedMagellanFn, CustomError>({
            serviceFn: mockedMagellanFn,
            options: {
                mutationKey: ["test"],
            },
        });

        expectTypeOf(error).toEqualTypeOf<CustomError | null>();

        if (isError) {
            expectTypeOf(error).toEqualTypeOf<CustomError>();
        }
    });
});
