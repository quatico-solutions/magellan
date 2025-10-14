/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { useMutation } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { useMutationService } from "./useMutationService";

jest.mock("@tanstack/react-query");

describe("useMutationService", () => {
    const mockedUseMutation = jest.mocked<any>(useMutation);
    const mockedMutateAsync = jest.fn();
    const testError = new Error("Test error");

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return a loading state when the mutation is pending", () => {
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
                mutationKey: ["test"],
                serviceFn: jest.fn(),
            })
        );

        expect(result.current).toStrictEqual({
            isLoading: true,
            isError: false,
            isSuccess: false,
            data: undefined,
            error: null,
            mutate: expect.any(Function),
        });
    });

    it("should return a mutation result with data when the mutation is successful", () => {
        mockedUseMutation.mockReturnValue({
            isPending: false,
            isError: false,
            isSuccess: true,
            data: { foo: "bar" },
            error: null,
            mutateAsync: mockedMutateAsync,
        });

        const { result } = renderHook(() =>
            useMutationService({
                mutationKey: ["test"],
                serviceFn: jest.fn(),
            })
        );

        expect(result.current).toStrictEqual({
            isLoading: false,
            isError: false,
            isSuccess: true,
            data: { foo: "bar" },
            error: null,
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
                    mutationKey: ["test"],
                    serviceFn: jest.fn(),
                })
            );

            expect(result.current).toStrictEqual({
                isLoading: false,
                isError: true,
                isSuccess: false,
                data: undefined,
                error: testError,
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
                    mutationKey: ["test"],
                    serviceFn: jest.fn(),
                })
            );

            expect(result.current).toStrictEqual({
                isLoading: false,
                isError: true,
                isSuccess: false,
                data: undefined,
                error: new Error("Custom error object"),
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
                    mutationKey: ["test"],
                    serviceFn: jest.fn(),
                })
            );

            expect(result.current).toStrictEqual({
                isLoading: false,
                isError: true,
                isSuccess: false,
                data: undefined,
                error: new Error("Custom error message"),
                mutate: expect.any(Function),
            });
        });

        it("should return an error state when mutation is not successful and has an error", () => {
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
                    mutationKey: ["test"],
                    serviceFn: jest.fn(),
                })
            );

            expect(result.current).toStrictEqual({
                isLoading: false,
                isError: true,
                isSuccess: false,
                data: undefined,
                error: testError,
                mutate: expect.any(Function),
            });
        });

        it("should return an error state when mutation is not successful and has no error", () => {
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
                    mutationKey: ["test"],
                    serviceFn: jest.fn(),
                })
            );

            expect(result.current).toStrictEqual({
                isLoading: false,
                isError: false,
                isSuccess: false,
                data: undefined,
                error: null,
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
                    mutationKey: ["test"],
                    serviceFn: jest.fn(),
                })
            );

            expect(typeof result.current.mutate).toBe("function");
        });

        it("should be available in all states", () => {
            // Test in loading state
            mockedUseMutation.mockReturnValue({
                isPending: true,
                isError: false,
                isSuccess: false,
                data: undefined,
                error: null,
                mutateAsync: mockedMutateAsync,
            });

            const { result: loadingResult } = renderHook(() =>
                useMutationService({
                    mutationKey: ["test"],
                    serviceFn: jest.fn(),
                })
            );

            expect(typeof loadingResult.current.mutate).toBe("function");

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
                    mutationKey: ["test"],
                    serviceFn: jest.fn(),
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
                    mutationKey: ["test"],
                    serviceFn: jest.fn(),
                })
            );

            const testInput = { test: "data" };
            await result.current.mutate(testInput);

            expect(mockMutateAsync).toHaveBeenCalledWith(testInput);
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
                    mutationKey: ["test"],
                    serviceFn: jest.fn(),
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
                    mutationKey: ["test"],
                    serviceFn: jest.fn(),
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
                    mutationKey: ["test"],
                    serviceFn: jest.fn(),
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
                    mutationKey: ["test"],
                    serviceFn: jest.fn(),
                })
            );

            expect(result.current.error).toEqual(new Error("42"));
        });
    });
});
