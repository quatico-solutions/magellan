/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { QueryClient, useMutation } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { useContext } from "react";
import { useMutationService } from "./useMutationService";

jest.mock("@tanstack/react-query", () => {
    const actual = jest.requireActual("@tanstack/react-query");
    return {
        ...actual,
        useMutation: jest.fn(),
    };
});

jest.mock("react", () => {
    const actual = jest.requireActual("react");
    return {
        ...actual,
        useContext: jest.fn(),
    };
});

describe("useMutationService", () => {
    const mockedUseMutation = jest.mocked<any>(useMutation);
    const mockedUseContext = jest.mocked(useContext);
    const mockedMutateAsync = jest.fn();
    const testError = new Error("Test error");

    beforeEach(() => {
        jest.clearAllMocks();
        // Default: no provider QueryClient
        mockedUseContext.mockReturnValue(undefined);
    });

    it("should return idle state when the mutation hasn't been triggered", () => {
        mockedUseMutation.mockReturnValue({
            isPending: false,
            isError: false,
            isSuccess: false,
            data: undefined,
            error: null,
            mutateAsync: mockedMutateAsync,
        });

        const { result } = renderHook(() =>
            useMutationService({
                serviceFn: jest.fn(),
                options: {
                    mutationKey: ["target"],
                },
            })
        );

        expect(result.current).toStrictEqual({
            data: undefined,
            error: null,
            isError: false,
            isPending: false,
            isIdle: true,
            isSuccess: false,
            status: "idle",
            mutate: expect.any(Function),
        });
    });

    it("should return pending state when the mutation is in progress", () => {
        mockedUseMutation.mockReturnValue({
            isPending: true,
            isError: false,
            isSuccess: false,
            data: undefined,
            error: null,
            mutateAsync: mockedMutateAsync,
        });

        const { result } = renderHook(() =>
            useMutationService({
                serviceFn: jest.fn(),
                options: {
                    mutationKey: ["target"],
                },
            })
        );

        expect(result.current).toStrictEqual({
            data: undefined,
            error: null,
            isError: false,
            isPending: true,
            isIdle: false,
            isSuccess: false,
            status: "pending",
            mutate: expect.any(Function),
        });
    });

    it("should return a mutation result with data when the mutation is successful", () => {
        mockedUseMutation.mockReturnValue({
            isPending: false,
            isError: false,
            isSuccess: true,
            data: { expected: "value" },
            error: null,
            mutateAsync: mockedMutateAsync,
        });

        const { result } = renderHook(() =>
            useMutationService({
                serviceFn: jest.fn(),
                options: {
                    mutationKey: ["target"],
                },
            })
        );

        expect(result.current).toStrictEqual({
            data: { expected: "value" },
            error: null,
            isError: false,
            isPending: false,
            isIdle: false,
            isSuccess: true,
            status: "success",
            mutate: expect.any(Function),
        });
    });

    describe("error state", () => {
        it("should return error state when the mutation fails", () => {
            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: true,
                isSuccess: false,
                data: undefined,
                error: testError,
                mutateAsync: mockedMutateAsync,
            });

            const { result } = renderHook(() =>
                useMutationService({
                    options: {
                        mutationKey: ["target"],
                    },
                    serviceFn: jest.fn(),
                })
            );

            expect(result.current).toStrictEqual({
                data: undefined,
                error: testError,
                isError: true,
                isPending: false,
                isIdle: false,
                isSuccess: false,
                status: "error",
                mutate: expect.any(Function),
            });
        });

        it("should return error state when the mutation fails with custom error object", () => {
            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: true,
                isSuccess: false,
                data: undefined,
                error: { message: "Custom error object" },
                mutateAsync: mockedMutateAsync,
            });

            const { result } = renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["target"],
                    },
                })
            );

            expect(result.current).toStrictEqual({
                data: undefined,
                error: new Error("Custom error object"),
                isError: true,
                isPending: false,
                isIdle: false,
                isSuccess: false,
                status: "error",
                mutate: expect.any(Function),
            });
        });

        it("should return error state when the mutation fails with custom error message", () => {
            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: true,
                isSuccess: false,
                data: undefined,
                error: "Custom error message",
                mutateAsync: mockedMutateAsync,
            });

            const { result } = renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["target"],
                    },
                })
            );

            expect(result.current).toStrictEqual({
                data: undefined,
                error: new Error("Custom error message"),
                isError: true,
                isPending: false,
                isIdle: false,
                isSuccess: false,
                status: "error",
                mutate: expect.any(Function),
            });
        });
    });

    describe("mutate function", () => {
        it("should return a function for mutate", () => {
            const customMutateAsync = jest.fn();
            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: false,
                isSuccess: true,
                data: { result: "success" },
                error: null,
                mutateAsync: customMutateAsync,
            });

            const { result } = renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["target"],
                    },
                })
            );

            expect(typeof result.current.mutate).toBe("function");
        });

        it("should be available in all states", () => {
            // Test in idle state
            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: false,
                isSuccess: false,
                data: undefined,
                error: null,
                mutateAsync: mockedMutateAsync,
            });

            const { result: idleResult } = renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["target"],
                    },
                })
            );

            expect(typeof idleResult.current.mutate).toBe("function");

            // Test in pending state
            mockedUseMutation.mockReturnValue({
                isPending: true,
                isError: false,
                isSuccess: false,
                data: undefined,
                error: null,
                mutateAsync: mockedMutateAsync,
            });

            const { result: pendingResult } = renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["target"],
                    },
                })
            );

            expect(typeof pendingResult.current.mutate).toBe("function");

            // Test in error state
            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: true,
                isSuccess: false,
                data: undefined,
                error: testError,
                mutateAsync: mockedMutateAsync,
            });

            const { result: errorResult } = renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["target"],
                    },
                })
            );

            expect(typeof errorResult.current.mutate).toBe("function");
        });

        it("should call mutateAsync when invoked", async () => {
            const mockMutateAsync = jest.fn().mockResolvedValue("test result");
            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: false,
                isSuccess: true,
                data: { result: "success" },
                error: null,
                mutateAsync: mockMutateAsync,
            });

            const { result } = renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["target"],
                    },
                })
            );

            const testInput = { test: "data" };
            await result.current.mutate(testInput);

            expect(mockMutateAsync).toHaveBeenCalledWith(testInput);
        });
    });

    describe("mutationFn behavior", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should call serviceFn with the provided input parameter", async () => {
            const mockServiceFn = jest.fn().mockResolvedValue({ result: "success" });
            const inputData = { id: 123, name: "test" };

            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: false,
                isSuccess: true,
                data: { result: "success" },
                error: null,
                mutateAsync: jest.fn(),
            });

            renderHook(() =>
                useMutationService({
                    serviceFn: mockServiceFn,
                    options: {
                        mutationKey: ["test"],
                    },
                })
            );

            // Extract the mutationFn that was passed to useMutation
            const useMutationCall = mockedUseMutation.mock.calls[0][0];
            const mutationFn = useMutationCall.mutationFn;

            // Call the mutationFn to verify it calls serviceFn with correct input
            await mutationFn(inputData);

            expect(mockServiceFn).toHaveBeenCalledWith(inputData);
            expect(mockServiceFn).toHaveBeenCalledTimes(1);
        });

        it("should call serviceFn with different inputs on multiple calls", async () => {
            const mockServiceFn = jest.fn().mockResolvedValue({ result: "success" });

            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: false,
                isSuccess: true,
                data: { result: "success" },
                error: null,
                mutateAsync: jest.fn(),
            });

            renderHook(() =>
                useMutationService({
                    serviceFn: mockServiceFn,
                    options: {
                        mutationKey: ["test"],
                    },
                })
            );

            // Extract the mutationFn that was passed to useMutation
            const useMutationCall = mockedUseMutation.mock.calls[0][0];
            const mutationFn = useMutationCall.mutationFn;

            // First call with first input
            const firstInput = { id: 1, action: "create" };
            await mutationFn(firstInput);
            expect(mockServiceFn).toHaveBeenCalledWith(firstInput);

            // Second call with different input
            const secondInput = { id: 2, action: "update" };
            await mutationFn(secondInput);
            expect(mockServiceFn).toHaveBeenCalledWith(secondInput);

            // Third call with yet another input
            const thirdInput = { id: 3, action: "delete" };
            await mutationFn(thirdInput);
            expect(mockServiceFn).toHaveBeenCalledWith(thirdInput);

            // Verify all calls used their respective inputs
            expect(mockServiceFn).toHaveBeenCalledTimes(3);
            expect(mockServiceFn.mock.calls[0][0]).toEqual(firstInput);
            expect(mockServiceFn.mock.calls[1][0]).toEqual(secondInput);
            expect(mockServiceFn.mock.calls[2][0]).toEqual(thirdInput);
        });

        it("should pass through the exact input without modification", async () => {
            const mockServiceFn = jest.fn().mockResolvedValue({ result: "success" });
            const complexInput = {
                nested: { deeply: { value: 123 } },
                array: [1, 2, 3],
                nullValue: null,
                undefinedValue: undefined,
                booleanValue: true,
            };

            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: false,
                isSuccess: true,
                data: { result: "success" },
                error: null,
                mutateAsync: jest.fn(),
            });

            renderHook(() =>
                useMutationService({
                    serviceFn: mockServiceFn,
                    options: {
                        mutationKey: ["test"],
                    },
                })
            );

            // Extract the mutationFn that was passed to useMutation
            const useMutationCall = mockedUseMutation.mock.calls[0][0];
            const mutationFn = useMutationCall.mutationFn;

            await mutationFn(complexInput);

            expect(mockServiceFn).toHaveBeenCalledWith(complexInput);
            expect(mockServiceFn.mock.calls[0][0]).toBe(complexInput); // Same reference
        });

        it("should return null when serviceFn returns undefined", async () => {
            const mockServiceFn = jest.fn().mockResolvedValue(undefined);

            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: false,
                isSuccess: true,
                data: null,
                error: null,
                mutateAsync: jest.fn(),
            });

            renderHook(() =>
                useMutationService({
                    serviceFn: mockServiceFn,
                    options: {
                        mutationKey: ["test"],
                    },
                })
            );

            // Extract the mutationFn that was passed to useMutation
            const useMutationCall = mockedUseMutation.mock.calls[0][0];
            const mutationFn = useMutationCall.mutationFn;

            const result = await mutationFn({ test: "input" });

            expect(result).toBe(null);
        });

        it("should handle null input parameter", async () => {
            const mockServiceFn = jest.fn().mockResolvedValue({ result: "success" });

            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: false,
                isSuccess: true,
                data: { result: "success" },
                error: null,
                mutateAsync: jest.fn(),
            });

            renderHook(() =>
                useMutationService({
                    serviceFn: mockServiceFn,
                    options: {
                        mutationKey: ["test"],
                    },
                })
            );

            // Extract the mutationFn that was passed to useMutation
            const useMutationCall = mockedUseMutation.mock.calls[0][0];
            const mutationFn = useMutationCall.mutationFn;

            await mutationFn(null);

            expect(mockServiceFn).toHaveBeenCalledWith(null);
        });

        it("should preserve input parameters across hook rerenders", async () => {
            const mockServiceFn = jest.fn().mockResolvedValue({ result: "success" });

            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: false,
                isSuccess: true,
                data: { result: "success" },
                error: null,
                mutateAsync: jest.fn(),
            });

            const { rerender } = renderHook(() =>
                useMutationService({
                    serviceFn: mockServiceFn,
                    options: {
                        mutationKey: ["test"],
                    },
                })
            );

            // Extract the mutationFn from first render
            const firstMutationFn = mockedUseMutation.mock.calls[0][0].mutationFn;
            const firstInput = { id: 100, render: "first" };
            await firstMutationFn(firstInput);

            // Rerender the hook
            rerender();

            // Extract the mutationFn from second render
            const secondMutationFn = mockedUseMutation.mock.calls[1][0].mutationFn;
            const secondInput = { id: 200, render: "second" };
            await secondMutationFn(secondInput);

            // Each call should use its respective input
            expect(mockServiceFn).toHaveBeenCalledTimes(2);
            expect(mockServiceFn.mock.calls[0][0]).toEqual(firstInput);
            expect(mockServiceFn.mock.calls[1][0]).toEqual(secondInput);
        });
    });

    describe("ensureErrorType function", () => {
        it("should handle null error", () => {
            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: true,
                isSuccess: false,
                data: undefined,
                error: null,
                mutateAsync: mockedMutateAsync,
            });

            const { result } = renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["target"],
                    },
                })
            );

            expect(result.current.error).toEqual(new Error("null"));
        });

        it("should handle undefined error", () => {
            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: true,
                isSuccess: false,
                data: undefined,
                error: undefined,
                mutateAsync: mockedMutateAsync,
            });

            const { result } = renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["target"],
                    },
                })
            );

            expect(result.current.error).toEqual(new Error("undefined"));
        });

        it("should handle object without message property", () => {
            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: true,
                isSuccess: false,
                data: undefined,
                error: { someOtherProp: "value" },
                mutateAsync: mockedMutateAsync,
            });

            const { result } = renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["target"],
                    },
                })
            );

            expect(result.current.error).toEqual(new Error("[object Object]"));
        });

        it("should handle non-object errors", () => {
            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: true,
                isSuccess: false,
                data: undefined,
                error: 42,
                mutateAsync: mockedMutateAsync,
            });

            const { result } = renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["target"],
                    },
                })
            );

            expect(result.current.error).toEqual(new Error("42"));
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

            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: false,
                isSuccess: true,
                data: { test: "data" },
                error: null,
                mutateAsync: mockedMutateAsync,
            });

            renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["test"],
                        queryClient: parameterQueryClient,
                    },
                })
            );

            // Should use parameter QueryClient, not provider QueryClient
            expect(mockedUseMutation).toHaveBeenCalledWith(
                {
                    mutationKey: ["test"],
                    mutationFn: expect.any(Function),
                },
                parameterQueryClient
            );

            // Verify it's not the provider QueryClient
            const callArgs = mockedUseMutation.mock.calls[0];
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

            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: false,
                isSuccess: true,
                data: { test: "data" },
                error: null,
                mutateAsync: mockedMutateAsync,
            });

            renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["test"],
                    },
                })
            );

            // Should use provider QueryClient
            expect(mockedUseMutation).toHaveBeenCalledWith(
                {
                    mutationKey: ["test"],
                    mutationFn: expect.any(Function),
                },
                providerQueryClient
            );
        });

        it("should use default QueryClient when neither parameter nor provider is provided", () => {
            // Mock useContext to return undefined (no provider)
            mockedUseContext.mockReturnValue(undefined);

            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: false,
                isSuccess: true,
                data: { test: "data" },
                error: null,
                mutateAsync: mockedMutateAsync,
            });

            renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["test"],
                    },
                })
            );

            // Should use default QueryClient (created internally)
            expect(mockedUseMutation).toHaveBeenCalledWith(
                {
                    mutationKey: ["test"],
                    mutationFn: expect.any(Function),
                },
                expect.any(QueryClient)
            );

            // Verify it's a QueryClient instance
            const callArgs = mockedUseMutation.mock.calls[0];
            const usedQueryClient = callArgs[1];
            expect(usedQueryClient).toBeInstanceOf(QueryClient);
        });

        it("should create default QueryClient with configured default options", () => {
            // Mock useContext to return undefined (no provider)
            mockedUseContext.mockReturnValue(undefined);

            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: false,
                isSuccess: true,
                data: { test: "data" },
                error: null,
                mutateAsync: mockedMutateAsync,
            });

            renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["test"],
                    },
                })
            );

            const callArgs = mockedUseMutation.mock.calls[0];
            const usedQueryClient = callArgs[1] as QueryClient;

            // Verify default options are set correctly for mutations
            const defaultOptions = usedQueryClient.getDefaultOptions();
            expect(defaultOptions?.mutations).toBeDefined();
            expect(defaultOptions.mutations).toMatchObject({
                gcTime: 1000 * 60 * 10, // 10 minutes
                retry: 0, // mutations should not retry by default
            });
        });

        it("should prioritize parameter over provider, and provider over default", () => {
            const parameterQueryClient = new QueryClient();
            const providerQueryClient = new QueryClient();

            mockedUseContext.mockReturnValue(providerQueryClient);

            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: false,
                isSuccess: true,
                data: { test: "data" },
                error: null,
                mutateAsync: mockedMutateAsync,
            });

            // Test 1: With parameter - should use parameter
            renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["test1"],
                        queryClient: parameterQueryClient,
                    },
                })
            );

            expect(mockedUseMutation).toHaveBeenLastCalledWith(expect.any(Object), parameterQueryClient);

            // Test 2: Without parameter, with provider - should use provider
            mockedUseContext.mockReturnValue(providerQueryClient);
            renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["test2"],
                    },
                })
            );

            expect(mockedUseMutation).toHaveBeenLastCalledWith(expect.any(Object), providerQueryClient);

            // Test 3: Without parameter and provider - should use default
            mockedUseContext.mockReturnValue(undefined);
            renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["test3"],
                    },
                })
            );

            const lastCall = mockedUseMutation.mock.calls[mockedUseMutation.mock.calls.length - 1];
            const defaultQueryClient = lastCall[1];
            expect(defaultQueryClient).toBeInstanceOf(QueryClient);
            expect(defaultQueryClient).not.toBe(parameterQueryClient);
            expect(defaultQueryClient).not.toBe(providerQueryClient);
        });

        it("should create default QueryClient instance", () => {
            mockedUseContext.mockReturnValue(undefined);

            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: false,
                isSuccess: true,
                data: { test: "data" },
                error: null,
                mutateAsync: mockedMutateAsync,
            });

            renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["test"],
                    },
                })
            );

            const callArgs = mockedUseMutation.mock.calls[0];
            const defaultQueryClient = callArgs[1] as QueryClient;

            // Verify it's a QueryClient instance
            expect(defaultQueryClient).toBeInstanceOf(QueryClient);
        });

        it("should configure default QueryClient with correct mutation options", () => {
            mockedUseContext.mockReturnValue(undefined);

            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: false,
                isSuccess: true,
                data: { test: "data" },
                error: null,
                mutateAsync: mockedMutateAsync,
            });

            renderHook(() =>
                useMutationService({
                    serviceFn: jest.fn(),
                    options: {
                        mutationKey: ["test"],
                    },
                })
            );

            const callArgs = mockedUseMutation.mock.calls[0];
            const defaultQueryClient = callArgs[1] as QueryClient;

            // Verify default options are configured correctly for mutations
            const defaultOptions = defaultQueryClient.getDefaultOptions();
            expect(defaultOptions?.mutations).toBeDefined();
            expect(defaultOptions.mutations).toMatchObject({
                gcTime: 1000 * 60 * 10, // 10 minutes
                retry: 0, // mutations should not retry by default
            });
        });

        it("should reuse the same default QueryClient instance across renders", () => {
            mockedUseContext.mockReturnValue(undefined);

            mockedUseMutation.mockReturnValue({
                isPending: false,
                isError: false,
                isSuccess: true,
                data: { test: "data" },
                error: null,
                mutateAsync: mockedMutateAsync,
            });

            const { rerender } = renderHook(
                ({ mutationKey }) =>
                    useMutationService({
                        serviceFn: jest.fn(),
                        options: {
                            mutationKey,
                        },
                    }),
                {
                    initialProps: { mutationKey: ["test1"] as string[] },
                }
            );

            const firstCallClient = mockedUseMutation.mock.calls[0][1] as QueryClient;

            rerender({ mutationKey: ["test2"] });

            const secondCallClient = mockedUseMutation.mock.calls[1][1] as QueryClient;

            // Should reuse the same default QueryClient instance (memoized)
            expect(firstCallClient).toBe(secondCallClient);
        });
    });
});
