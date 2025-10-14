/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { useQuery } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { useQueryService } from "./useQueryService";

jest.mock("@tanstack/react-query");

describe("useQueryService", () => {
    const mockedUseQuery = jest.mocked<any>(useQuery);
    const mockedRefetch = jest.fn();
    const testError = new Error("Test error");

    it("should return a loading state when the query is loading", () => {
        mockedUseQuery.mockReturnValue({
            isLoading: true,
            refetch: mockedRefetch,
        });

        const { result } = renderHook(() =>
            useQueryService({
                queryKey: ["whatever"],
                serviceFn: jest.fn(),
            })
        );

        expect(result.current).toStrictEqual({
            isLoading: true,
            isError: false,
            isSuccess: false,
            data: undefined,
            error: null,
            refetch: expect.any(Function),
            isEnabled: true,
        });
    });

    it("should return a query result with data when the query is successful", () => {
        mockedUseQuery.mockReturnValue({
            isLoading: false,
            isError: false,
            isSuccess: true,
            data: { foo: "bar" },
            refetch: mockedRefetch,
        });

        const { result } = renderHook(() =>
            useQueryService({
                queryKey: ["whatever"],
                serviceFn: jest.fn(),
            })
        );

        expect(result.current).toStrictEqual({
            isLoading: false,
            isError: false,
            isSuccess: true,
            data: { foo: "bar" },
            error: null,
            refetch: mockedRefetch,
            isEnabled: true,
        });
    });

    describe("error state", () => {
        it("should return when the query fails", () => {
            mockedUseQuery.mockReturnValue({
                isError: true,
                error: testError,
                refetch: mockedRefetch,
            });

            const { result } = renderHook(() =>
                useQueryService({
                    queryKey: ["whatever"],
                    serviceFn: jest.fn(),
                })
            );

            expect(result.current).toStrictEqual({
                isLoading: false,
                isError: true,
                isSuccess: false,
                data: undefined,
                error: testError,
                refetch: mockedRefetch,
                isEnabled: true,
            });
        });

        it("should return when the query fails with custom error object", () => {
            mockedUseQuery.mockReturnValue({
                isError: true,
                error: { message: "Custom error object" },
                refetch: mockedRefetch,
            });

            const { result } = renderHook(() =>
                useQueryService({
                    queryKey: ["whatever"],
                    serviceFn: jest.fn(),
                })
            );

            expect(result.current).toStrictEqual({
                isLoading: false,
                isError: true,
                isSuccess: false,
                data: undefined,
                error: new Error("Custom error object"),
                refetch: mockedRefetch,
                isEnabled: true,
            });
        });

        it("should return when the query fails with custom error message", () => {
            mockedUseQuery.mockReturnValue({
                isError: true,
                error: "Custom error message",
                refetch: mockedRefetch,
            });

            const { result } = renderHook(() =>
                useQueryService({
                    queryKey: ["whatever"],
                    serviceFn: jest.fn(),
                })
            );

            expect(result.current).toStrictEqual({
                isLoading: false,
                isError: true,
                isSuccess: false,
                data: undefined,
                error: new Error("Custom error message"),
                refetch: mockedRefetch,
                isEnabled: true,
            });
        });

        it("should return an error state with no success flag", () => {
            mockedUseQuery.mockReturnValue({
                isError: true,
                isSuccess: false,
                error: testError,
                refetch: mockedRefetch,
            });

            const { result } = renderHook(() =>
                useQueryService({
                    queryKey: ["whatever"],
                    serviceFn: jest.fn(),
                })
            );

            expect(result.current).toStrictEqual({
                isLoading: false,
                isError: true,
                isSuccess: false,
                data: undefined,
                error: testError,
                refetch: mockedRefetch,
                isEnabled: true,
            });
        });
    });

    describe("enabled flag", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should return a disabled state when enabled=false", () => {
            mockedUseQuery.mockReturnValue({
                refetch: mockedRefetch,
            });

            const { result } = renderHook(() =>
                useQueryService({
                    queryKey: ["whatever"],
                    serviceFn: jest.fn(),
                    enabled: false,
                })
            );

            expect(result.current).toStrictEqual({
                isLoading: false,
                isError: false,
                isSuccess: false,
                data: undefined,
                error: null,
                isEnabled: false,
                refetch: expect.any(Function),
            });

            expect(mockedUseQuery).toHaveBeenCalledWith({
                queryKey: ["whatever"],
                enabled: false,
                queryFn: expect.any(Function),
            });
        });

        it("should default enabled to true when not provided", () => {
            mockedUseQuery.mockReturnValue({
                refetch: mockedRefetch,
                isLoading: true,
            });

            renderHook(() =>
                useQueryService({
                    queryKey: ["whatever"],
                    serviceFn: jest.fn(),
                })
            );

            expect(mockedUseQuery).toHaveBeenCalledWith({
                queryKey: ["whatever"],
                enabled: true,
                queryFn: expect.any(Function),
            });
        });

        it("should pass enabled=true to useQuery by default", () => {
            mockedUseQuery.mockReturnValue({
                isLoading: false,
                isError: false,
                isSuccess: true,
                data: { test: "data" },
                refetch: mockedRefetch,
            });

            renderHook(() =>
                useQueryService({
                    queryKey: ["whatever"],
                    serviceFn: jest.fn(),
                })
            );

            expect(mockedUseQuery).toHaveBeenCalledWith({
                queryKey: ["whatever"],
                enabled: true,
                queryFn: expect.any(Function),
            });
        });

        it("should not call query function automatically when enabled=false", () => {
            const mockMagellanFn = jest.fn();
            mockedUseQuery.mockReturnValue({
                refetch: mockedRefetch,
            });

            renderHook(() =>
                useQueryService({
                    queryKey: ["whatever"],
                    serviceFn: mockMagellanFn,
                    enabled: false,
                })
            );

            expect(mockMagellanFn).not.toHaveBeenCalled();
        });

        it("should allow manual refetch when enabled=false", () => {
            const mockMagellanFn = jest.fn();

            mockedUseQuery.mockReturnValue({
                refetch: mockedRefetch,
            });

            const { result } = renderHook(() =>
                useQueryService({
                    queryKey: ["whatever"],
                    serviceFn: mockMagellanFn,
                    enabled: false,
                })
            );

            // refetch should be available even when disabled (for manual triggering)
            expect(result.current.refetch).toBe(mockedRefetch);
        });

        it("should handle transition from disabled to enabled", () => {
            mockedUseQuery.mockReturnValue({
                refetch: mockedRefetch,
            });

            const { result, rerender } = renderHook(
                ({ enabled }) =>
                    useQueryService({
                        queryKey: ["whatever"],
                        serviceFn: jest.fn(),
                        enabled,
                    }),
                {
                    initialProps: { enabled: false },
                }
            );

            expect(result.current.isEnabled).toBe(false);

            mockedUseQuery.mockReturnValue({
                isLoading: false,
                isError: false,
                isSuccess: true,
                data: { foo: "bar" },
                refetch: mockedRefetch,
            });

            rerender({ enabled: true });

            expect(mockedUseQuery).toHaveBeenLastCalledWith({
                queryKey: ["whatever"],
                enabled: true,
                queryFn: expect.any(Function),
            });
        });
    });
});
