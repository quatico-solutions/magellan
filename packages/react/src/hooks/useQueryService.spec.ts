/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { QueryClient, useQuery } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { useContext } from "react";
import { useQueryService } from "./useQueryService";

jest.mock("@tanstack/react-query", () => {
    const actual = jest.requireActual("@tanstack/react-query");
    return {
        ...actual,
        useQuery: jest.fn(),
    };
});

jest.mock("react", () => {
    const actual = jest.requireActual("react");
    return {
        ...actual,
        useContext: jest.fn(),
    };
});

describe("useQueryService", () => {
    const mockedUseQuery = jest.mocked<any>(useQuery);
    const mockedUseContext = jest.mocked(useContext);
    const mockedRefetch = jest.fn();
    const testError = new Error("Test error");

    beforeEach(() => {
        // Default: no provider QueryClient
        mockedUseContext.mockReturnValue(undefined);
    });

    it("should return a loading state when the query is loading (first fetch)", () => {
        mockedUseQuery.mockReturnValue({
            status: "pending",
            isLoading: true,
            isPending: true,
            isError: false,
            isSuccess: false,
            data: undefined,
            error: null,
            refetch: mockedRefetch,
        });

        const { result } = renderHook(() =>
            useQueryService({
                serviceFn: jest.fn(),
                options: {
                    queryKey: ["whatever"],
                },
            })
        );

        expect(result.current).toStrictEqual({
            data: undefined,
            error: null,
            isError: false,
            isPending: true,
            isLoading: true,
            isLoadingError: false,
            isRefetchError: false,
            isSuccess: false,
            isEnabled: true,
            status: "pending",
            refetch: expect.any(Function),
        });
    });

    it("should return a pending state when the query hasn't started fetching", () => {
        mockedUseQuery.mockReturnValue({
            status: "pending",
            isLoading: false,
            isPending: true,
            isError: false,
            isSuccess: false,
            data: undefined,
            error: null,
            refetch: mockedRefetch,
        });

        const { result } = renderHook(() =>
            useQueryService({
                serviceFn: jest.fn(),
                options: {
                    queryKey: ["whatever"],
                },
            })
        );

        expect(result.current).toStrictEqual({
            data: undefined,
            error: null,
            isError: false,
            isPending: true,
            isLoading: false,
            isLoadingError: false,
            isRefetchError: false,
            isSuccess: false,
            isEnabled: true,
            status: "pending",
            refetch: expect.any(Function),
        });
    });

    it("should return a query result with data when the query is successful", () => {
        mockedUseQuery.mockReturnValue({
            status: "success",
            isLoading: false,
            isPending: false,
            isError: false,
            isSuccess: true,
            data: { foo: "bar" },
            error: null,
            refetch: mockedRefetch,
        });

        const { result } = renderHook(() =>
            useQueryService({
                serviceFn: jest.fn(),
                options: {
                    queryKey: ["whatever"],
                },
            })
        );

        expect(result.current).toStrictEqual({
            data: { foo: "bar" },
            error: null,
            isError: false,
            isPending: false,
            isLoading: false,
            isLoadingError: false,
            isRefetchError: false,
            isSuccess: true,
            isEnabled: true,
            status: "success",
            refetch: expect.any(Function),
        });
    });

    describe("error state", () => {
        it("should return loading error state when initial fetch fails (no data)", () => {
            mockedUseQuery.mockReturnValue({
                status: "error",
                isLoading: false,
                isPending: false,
                isError: true,
                isSuccess: false,
                data: undefined,
                error: testError,
                refetch: mockedRefetch,
            });

            const { result } = renderHook(() =>
                useQueryService({
                    serviceFn: jest.fn(),
                    options: {
                        queryKey: ["whatever"],
                    },
                })
            );

            expect(result.current).toStrictEqual({
                data: undefined,
                error: testError,
                isError: true,
                isPending: false,
                isLoading: false,
                isLoadingError: true,
                isRefetchError: false,
                isSuccess: false,
                isEnabled: true,
                status: "error",
                refetch: expect.any(Function),
            });
        });

        it("should return refetch error state when background refetch fails (stale data available)", () => {
            const staleData = { foo: "stale" };
            mockedUseQuery.mockReturnValue({
                status: "error",
                isLoading: false,
                isPending: false,
                isError: true,
                isSuccess: false,
                data: staleData,
                error: testError,
                refetch: mockedRefetch,
            });

            const { result } = renderHook(() =>
                useQueryService({
                    serviceFn: jest.fn(),
                    options: {
                        queryKey: ["whatever"],
                    },
                })
            );

            expect(result.current).toStrictEqual({
                data: staleData,
                error: testError,
                isError: true,
                isPending: false,
                isLoading: false,
                isLoadingError: false,
                isRefetchError: true,
                isSuccess: false,
                isEnabled: true,
                status: "error",
                refetch: expect.any(Function),
            });
        });

        it("should return loading error when the query fails with custom error object", () => {
            mockedUseQuery.mockReturnValue({
                status: "error",
                isLoading: false,
                isPending: false,
                isError: true,
                isSuccess: false,
                data: undefined,
                error: { message: "Custom error object" },
                refetch: mockedRefetch,
            });

            const { result } = renderHook(() =>
                useQueryService({
                    serviceFn: jest.fn(),
                    options: {
                        queryKey: ["whatever"],
                    },
                })
            );

            expect(result.current).toStrictEqual({
                data: undefined,
                error: new Error("Custom error object"),
                isError: true,
                isPending: false,
                isLoading: false,
                isLoadingError: true,
                isRefetchError: false,
                isSuccess: false,
                isEnabled: true,
                status: "error",
                refetch: expect.any(Function),
            });
        });

        it("should return loading error when the query fails with custom error message", () => {
            mockedUseQuery.mockReturnValue({
                status: "error",
                isLoading: false,
                isPending: false,
                isError: true,
                isSuccess: false,
                data: undefined,
                error: "Custom error message",
                refetch: mockedRefetch,
            });

            const { result } = renderHook(() =>
                useQueryService({
                    serviceFn: jest.fn(),
                    options: {
                        queryKey: ["whatever"],
                    },
                })
            );

            expect(result.current).toStrictEqual({
                data: undefined,
                error: new Error("Custom error message"),
                isError: true,
                isPending: false,
                isLoading: false,
                isLoadingError: true,
                isRefetchError: false,
                isSuccess: false,
                isEnabled: true,
                status: "error",
                refetch: expect.any(Function),
            });
        });
    });

    describe("enabled flag", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should pass enabled=false to useQuery when disabled", () => {
            mockedUseQuery.mockReturnValue({
                status: "pending",
                isLoading: false,
                isPending: true,
                isError: false,
                isSuccess: false,
                data: undefined,
                error: null,
                refetch: mockedRefetch,
            });

            const { result } = renderHook(() =>
                useQueryService({
                    serviceFn: jest.fn(),
                    options: {
                        queryKey: ["whatever"],
                        enabled: false,
                    },
                })
            );

            // When disabled, query stays in pending state with isEnabled: false
            expect(result.current).toStrictEqual({
                data: undefined,
                error: null,
                isError: false,
                isPending: true,
                isLoading: false,
                isLoadingError: false,
                isRefetchError: false,
                isSuccess: false,
                isEnabled: false,
                status: "pending",
                refetch: expect.any(Function),
            });

            expect(mockedUseQuery).toHaveBeenCalledWith(
                {
                    queryKey: ["whatever"],
                    enabled: false,
                    queryFn: expect.any(Function),
                },
                expect.any(QueryClient)
            );
        });

        it("should default enabled to true when not provided", () => {
            mockedUseQuery.mockReturnValue({
                status: "pending",
                isLoading: true,
                isPending: true,
                isError: false,
                isSuccess: false,
                data: undefined,
                error: null,
                refetch: mockedRefetch,
            });

            renderHook(() =>
                useQueryService({
                    serviceFn: jest.fn(),
                    options: {
                        queryKey: ["whatever"],
                    },
                })
            );

            expect(mockedUseQuery).toHaveBeenCalledWith(
                {
                    queryKey: ["whatever"],
                    enabled: true,
                    queryFn: expect.any(Function),
                },
                expect.any(QueryClient)
            );
        });

        it("should pass enabled=true to useQuery by default", () => {
            mockedUseQuery.mockReturnValue({
                status: "success",
                isLoading: false,
                isPending: false,
                isError: false,
                isSuccess: true,
                data: { test: "data" },
                error: null,
                refetch: mockedRefetch,
            });

            renderHook(() =>
                useQueryService({
                    serviceFn: jest.fn(),
                    options: {
                        queryKey: ["whatever"],
                    },
                })
            );

            expect(mockedUseQuery).toHaveBeenCalledWith(
                {
                    queryKey: ["whatever"],
                    enabled: true,
                    queryFn: expect.any(Function),
                },
                expect.any(QueryClient)
            );
        });

        it("should not call query function automatically when enabled=false", () => {
            const mockMagellanFn = jest.fn();
            mockedUseQuery.mockReturnValue({
                status: "pending",
                isLoading: false,
                isPending: true,
                isError: false,
                isSuccess: false,
                data: undefined,
                error: null,
                refetch: mockedRefetch,
            });

            renderHook(() =>
                useQueryService({
                    serviceFn: mockMagellanFn,
                    options: {
                        queryKey: ["whatever"],
                        enabled: false,
                    },
                })
            );

            expect(mockMagellanFn).not.toHaveBeenCalled();
        });

        it("should allow manual refetch when enabled=false", () => {
            const mockMagellanFn = jest.fn();

            mockedUseQuery.mockReturnValue({
                status: "pending",
                isLoading: false,
                isPending: true,
                isError: false,
                isSuccess: false,
                data: undefined,
                error: null,
                refetch: mockedRefetch,
            });

            const { result } = renderHook(() =>
                useQueryService({
                    serviceFn: mockMagellanFn,
                    options: {
                        queryKey: ["whatever"],
                        enabled: false,
                    },
                })
            );

            // refetch should be available even when disabled (for manual triggering)
            expect(result.current.refetch).toBeInstanceOf(Function);
        });

        it("should handle transition from disabled to enabled", () => {
            // First render: disabled, pending state
            mockedUseQuery.mockReturnValue({
                status: "pending",
                isLoading: false,
                isPending: true,
                isError: false,
                isSuccess: false,
                data: undefined,
                error: null,
                refetch: mockedRefetch,
            });

            const { result, rerender } = renderHook(
                ({ enabled }) =>
                    useQueryService({
                        serviceFn: jest.fn(),
                        options: {
                            queryKey: ["whatever"],
                            enabled,
                        },
                    }),
                {
                    initialProps: { enabled: false },
                }
            );

            expect(result.current.isPending).toBe(true);

            // Second render: enabled, success state
            mockedUseQuery.mockReturnValue({
                status: "success",
                isLoading: false,
                isPending: false,
                isError: false,
                isSuccess: true,
                data: { foo: "bar" },
                error: null,
                refetch: mockedRefetch,
            });

            rerender({ enabled: true });

            expect(mockedUseQuery).toHaveBeenLastCalledWith(
                {
                    queryKey: ["whatever"],
                    enabled: true,
                    queryFn: expect.any(Function),
                },
                expect.any(QueryClient)
            );
        });
    });

    describe("QueryClient configuration", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            // Reset useContext to default (no provider)
            mockedUseContext.mockReturnValue(undefined);
        });

        it("should use QueryClient from parameter when provided (parameter takes precedence over provider)", () => {
            const parameterQueryClient = new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 10000, // 10 seconds
                    },
                },
            });

            const providerQueryClient = new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5000, // 5 seconds
                    },
                },
            });

            // Mock useContext to return provider QueryClient
            mockedUseContext.mockReturnValue(providerQueryClient);

            mockedUseQuery.mockReturnValue({
                isLoading: false,
                isError: false,
                isSuccess: true,
                data: { test: "data" },
                refetch: mockedRefetch,
            });

            renderHook(() =>
                useQueryService({
                    serviceFn: jest.fn(),
                    options: {
                        queryKey: ["test"],
                        queryClient: parameterQueryClient,
                    },
                })
            );

            // Should use parameter QueryClient, not provider QueryClient
            expect(mockedUseQuery).toHaveBeenCalledWith(
                {
                    queryKey: ["test"],
                    enabled: true,
                    queryFn: expect.any(Function),
                },
                parameterQueryClient
            );

            // Verify it's not the provider QueryClient
            const callArgs = mockedUseQuery.mock.calls[0];
            const usedQueryClient = callArgs[1];
            expect(usedQueryClient).toBe(parameterQueryClient);
            expect(usedQueryClient).not.toBe(providerQueryClient);
        });

        it("should use QueryClient from provider when no parameter is provided", () => {
            const providerQueryClient = new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30000, // 30 seconds
                        retry: 3,
                    },
                },
            });

            // Mock useContext to return provider QueryClient
            mockedUseContext.mockReturnValue(providerQueryClient);

            mockedUseQuery.mockReturnValue({
                isLoading: false,
                isError: false,
                isSuccess: true,
                data: { test: "data" },
                refetch: mockedRefetch,
            });

            renderHook(() =>
                useQueryService({
                    serviceFn: jest.fn(),
                    options: {
                        queryKey: ["test"],
                    },
                })
            );

            // Should use provider QueryClient
            expect(mockedUseQuery).toHaveBeenCalledWith(
                {
                    queryKey: ["test"],
                    enabled: true,
                    queryFn: expect.any(Function),
                },
                providerQueryClient
            );
        });

        it("should use default QueryClient when neither parameter nor provider is provided", () => {
            // Mock useContext to return undefined (no provider)
            mockedUseContext.mockReturnValue(undefined);

            mockedUseQuery.mockReturnValue({
                isLoading: false,
                isError: false,
                isSuccess: true,
                data: { test: "data" },
                refetch: mockedRefetch,
            });

            renderHook(() =>
                useQueryService({
                    serviceFn: jest.fn(),
                    options: {
                        queryKey: ["test"],
                    },
                })
            );

            // Should use default QueryClient (created internally)
            expect(mockedUseQuery).toHaveBeenCalledWith(
                {
                    queryKey: ["test"],
                    enabled: true,
                    queryFn: expect.any(Function),
                },
                expect.any(QueryClient)
            );

            // Verify it's a QueryClient instance
            const callArgs = mockedUseQuery.mock.calls[0];
            const usedQueryClient = callArgs[1];
            expect(usedQueryClient).toBeInstanceOf(QueryClient);
        });

        it("should create default QueryClient with configured default options", () => {
            // Mock useContext to return undefined (no provider)
            mockedUseContext.mockReturnValue(undefined);

            mockedUseQuery.mockReturnValue({
                isLoading: false,
                isError: false,
                isSuccess: true,
                data: { test: "data" },
                refetch: mockedRefetch,
            });

            renderHook(() =>
                useQueryService({
                    serviceFn: jest.fn(),
                    options: {
                        queryKey: ["test"],
                    },
                })
            );

            const callArgs = mockedUseQuery.mock.calls[0];
            const usedQueryClient = callArgs[1] as QueryClient;

            // Verify default options are set correctly
            const defaultOptions = usedQueryClient.getDefaultOptions();
            expect(defaultOptions?.queries).toBeDefined();
            expect(defaultOptions.queries).toMatchObject({
                staleTime: 1000 * 60 * 5, // 5 minutes
                gcTime: 1000 * 60 * 10, // 10 minutes
                retry: 1,
                refetchOnWindowFocus: false,
            });
        });

        it("should prioritize parameter over provider, and provider over default", () => {
            const parameterQueryClient = new QueryClient();
            const providerQueryClient = new QueryClient();

            mockedUseContext.mockReturnValue(providerQueryClient);

            mockedUseQuery.mockReturnValue({
                isLoading: false,
                isError: false,
                isSuccess: true,
                data: { test: "data" },
                refetch: mockedRefetch,
            });

            // Test 1: With parameter - should use parameter
            renderHook(() =>
                useQueryService({
                    serviceFn: jest.fn(),
                    options: {
                        queryKey: ["test1"],
                        queryClient: parameterQueryClient,
                    },
                })
            );

            expect(mockedUseQuery).toHaveBeenLastCalledWith(expect.any(Object), parameterQueryClient);

            // Test 2: Without parameter, with provider - should use provider
            mockedUseContext.mockReturnValue(providerQueryClient);
            renderHook(() =>
                useQueryService({
                    serviceFn: jest.fn(),
                    options: {
                        queryKey: ["test2"],
                    },
                })
            );

            expect(mockedUseQuery).toHaveBeenLastCalledWith(expect.any(Object), providerQueryClient);

            // Test 3: Without parameter and provider - should use default
            mockedUseContext.mockReturnValue(undefined);
            renderHook(() =>
                useQueryService({
                    serviceFn: jest.fn(),
                    options: {
                        queryKey: ["test3"],
                    },
                })
            );

            const lastCall = mockedUseQuery.mock.calls[mockedUseQuery.mock.calls.length - 1];
            const defaultQueryClient = lastCall[1];
            expect(defaultQueryClient).toBeInstanceOf(QueryClient);
            expect(defaultQueryClient).not.toBe(parameterQueryClient);
            expect(defaultQueryClient).not.toBe(providerQueryClient);
        });

        it("should create default QueryClient instance", () => {
            mockedUseContext.mockReturnValue(undefined);

            mockedUseQuery.mockReturnValue({
                isLoading: false,
                isError: false,
                isSuccess: true,
                data: { test: "data" },
                refetch: mockedRefetch,
            });

            renderHook(() =>
                useQueryService({
                    serviceFn: jest.fn(),
                    options: {
                        queryKey: ["test"],
                    },
                })
            );

            const callArgs = mockedUseQuery.mock.calls[0];
            const defaultQueryClient = callArgs[1] as QueryClient;

            // Verify it's a QueryClient instance
            expect(defaultQueryClient).toBeInstanceOf(QueryClient);
        });

        it("should configure default QueryClient with correct query options", () => {
            mockedUseContext.mockReturnValue(undefined);

            mockedUseQuery.mockReturnValue({
                isLoading: false,
                isError: false,
                isSuccess: true,
                data: { test: "data" },
                refetch: mockedRefetch,
            });

            renderHook(() =>
                useQueryService({
                    serviceFn: jest.fn(),
                    options: {
                        queryKey: ["test"],
                    },
                })
            );

            const callArgs = mockedUseQuery.mock.calls[0];
            const defaultQueryClient = callArgs[1] as QueryClient;

            // Verify default options are configured correctly
            const defaultOptions = defaultQueryClient.getDefaultOptions();
            expect(defaultOptions?.queries).toBeDefined();
            expect(defaultOptions.queries).toMatchObject({
                staleTime: 1000 * 60 * 5, // 5 minutes
                gcTime: 1000 * 60 * 10, // 10 minutes
                retry: 1,
                refetchOnWindowFocus: false,
            });
        });

        it("should reuse the same default QueryClient instance across renders", () => {
            mockedUseContext.mockReturnValue(undefined);

            mockedUseQuery.mockReturnValue({
                isLoading: false,
                isError: false,
                isSuccess: true,
                data: { test: "data" },
                refetch: mockedRefetch,
            });

            const { rerender } = renderHook(
                ({ queryKey }) =>
                    useQueryService({
                        serviceFn: jest.fn(),
                        options: {
                            queryKey,
                        },
                    }),
                {
                    initialProps: { queryKey: ["test1"] },
                }
            );

            const firstCallClient = mockedUseQuery.mock.calls[0][1] as QueryClient;

            rerender({ queryKey: ["test2"] });

            const secondCallClient = mockedUseQuery.mock.calls[1][1] as QueryClient;

            // Should reuse the same default QueryClient instance (memoized)
            expect(firstCallClient).toBe(secondCallClient);
        });
    });
});
