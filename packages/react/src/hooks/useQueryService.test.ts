/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { expectTypeOf } from "expect-type";
import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { useQueryService } from "./useQueryService";

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

const mockedUseQuery = jest.mocked(useQuery);
const mockedUseContext = jest.mocked(useContext);
const mockedRefetch = jest.fn();

// Default mock return value for useQuery - provides a valid structure for type tests
beforeEach(() => {
    // Mock useContext to return undefined (no provider)
    mockedUseContext.mockReturnValue(undefined);

    mockedUseQuery.mockReturnValue({
        status: "pending",
        isLoading: false,
        isPending: false,
        isError: false,
        isSuccess: false,
        data: undefined,
        error: null,
        refetch: mockedRefetch,
    } as any);
});

type ExpectedResultType = {
    expectedString: "value";
    expectedNumber: 1;
    expectedBoolean: true;
    expectedArray: ["expectedString"];
    expectedObject: { expected: "value" };
};

describe("useQueryService", () => {
    const mockedMagellanFn: jest.MockedFunction<() => Promise<ExpectedResultType>> = jest.fn().mockResolvedValue({
        expectedString: "value",
        expectedNumber: 1,
        expectedBoolean: true,
        expectedArray: ["expectedString"],
        expectedObject: { expected: "value" },
    });

    describe("type narrowing with discriminated unions", () => {
        it("returns correct union types before narrowing", () => {
            const { isPending, isLoading, isError, isSuccess, data, error, status, isLoadingError, isRefetchError, isEnabled } = useQueryService({
                serviceFn: mockedMagellanFn,
                options: {
                    queryKey: ["test"],
                },
            });

            // All boolean flags are boolean type before narrowing
            expectTypeOf(isPending).toEqualTypeOf<boolean>();
            expectTypeOf(isLoading).toEqualTypeOf<boolean>();
            expectTypeOf(isError).toEqualTypeOf<boolean>();
            expectTypeOf(isSuccess).toEqualTypeOf<boolean>();
            expectTypeOf(isLoadingError).toEqualTypeOf<boolean>();
            expectTypeOf(isRefetchError).toEqualTypeOf<boolean>();
            expectTypeOf(isEnabled).toEqualTypeOf<boolean>();

            // Status is a union of all possible states
            expectTypeOf(status).toEqualTypeOf<"pending" | "error" | "success">();

            // Data and error are unions before narrowing
            expectTypeOf(data).toEqualTypeOf<ExpectedResultType | undefined>();
            expectTypeOf(error).toEqualTypeOf<Error | null>();
        });

        it("narrows types with isPending check", () => {
            const { isPending, data, error, status } = useQueryService({
                serviceFn: mockedMagellanFn,
                options: {
                    queryKey: ["test"],
                },
            });

            if (isPending) {
                // When pending, no data or error available yet
                expectTypeOf(data).toEqualTypeOf<undefined>();
                expectTypeOf(error).toEqualTypeOf<null>();
                expectTypeOf(status).toEqualTypeOf<"pending">();
            }
        });

        it("narrows types with isLoading check for initial fetch", () => {
            const { isLoading, isPending, data, error } = useQueryService({
                serviceFn: mockedMagellanFn,
                options: {
                    queryKey: ["test"],
                },
            });

            if (isLoading) {
                // isLoading specifically means "first fetch in progress"
                expectTypeOf(isPending).toEqualTypeOf<true>();
                expectTypeOf(data).toEqualTypeOf<undefined>();
                expectTypeOf(error).toEqualTypeOf<null>();
            }
        });

        it("narrows types with isError and isLoadingError checks", () => {
            const { isError, isLoadingError, data, error, status } = useQueryService({
                serviceFn: mockedMagellanFn,
                options: {
                    queryKey: ["test"],
                },
            });

            if (isError && isLoadingError) {
                // Loading error: initial fetch failed, no data available
                expectTypeOf(data).toEqualTypeOf<undefined>();
                expectTypeOf(error).toEqualTypeOf<Error>();
                expectTypeOf(status).toEqualTypeOf<"error">();
            }
        });

        it("narrows types with isError and isRefetchError checks", () => {
            const { isError, isRefetchError, data, error, status } = useQueryService({
                serviceFn: mockedMagellanFn,
                options: {
                    queryKey: ["test"],
                },
            });

            if (isError && isRefetchError) {
                // Refetch error: background refetch failed, stale data still available
                expectTypeOf(data).toEqualTypeOf<ExpectedResultType>();
                expectTypeOf(error).toEqualTypeOf<Error>();
                expectTypeOf(status).toEqualTypeOf<"error">();
            }
        });

        it("narrows types with isError check covering both error states", () => {
            const { isError, status } = useQueryService({
                serviceFn: mockedMagellanFn,
                options: {
                    queryKey: ["test"],
                },
            });

            if (isError) {
                // When only checking isError, status narrows to "error"
                expectTypeOf(status).toEqualTypeOf<"error">();
            }
        });

        it("narrows types with isSuccess check", () => {
            const { isSuccess, data, error, status } = useQueryService({
                serviceFn: mockedMagellanFn,
                options: {
                    queryKey: ["test"],
                },
            });

            if (isSuccess) {
                // When successful, data is available and error is null
                expectTypeOf(data).toEqualTypeOf<ExpectedResultType>();
                expectTypeOf(error).toEqualTypeOf<null>();
                expectTypeOf(status).toEqualTypeOf<"success">();
            }
        });

        it("narrows types with combined negative checks", () => {
            const { isPending, isError, data } = useQueryService({
                serviceFn: mockedMagellanFn,
                options: {
                    queryKey: ["test"],
                },
            });

            if (!isPending && !isError) {
                // Shortcut: if not pending and not error, must be success
                expectTypeOf(data).toEqualTypeOf<ExpectedResultType>();
            }
        });

        it("narrows types using status field", () => {
            const { status, data, error } = useQueryService({
                serviceFn: mockedMagellanFn,
                options: {
                    queryKey: ["test"],
                },
            });

            if (status === "success") {
                expectTypeOf(data).toEqualTypeOf<ExpectedResultType>();
                expectTypeOf(error).toEqualTypeOf<null>();
            } else if (status === "error") {
                expectTypeOf(error).toEqualTypeOf<Error>();
                // data could be undefined (loading error) or ExpectedResultType (refetch error)
                expectTypeOf(data).toEqualTypeOf<ExpectedResultType | undefined>();
            } else {
                // status === "pending"
                expectTypeOf(data).toEqualTypeOf<undefined>();
                expectTypeOf(error).toEqualTypeOf<null>();
            }
        });
    });

    it("supports custom error types with TError generic", () => {
        type CustomError = { code: string; message: string };

        const customServiceFn: jest.MockedFunction<() => Promise<ExpectedResultType>> = jest.fn();

        const { error, isError, isLoadingError } = useQueryService<typeof customServiceFn, CustomError>({
            serviceFn: customServiceFn,
            options: {
                queryKey: ["test"],
            },
        });

        expectTypeOf(error).toEqualTypeOf<CustomError | null>();

        if (isError && isLoadingError) {
            expectTypeOf(error).toEqualTypeOf<CustomError>();
        }
    });
});
