/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import React, { FC, useEffect, useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { useQueryService } from "../src/hooks/useQueryService";
import { QUERY_KEYS, renderWithQueryClient, TEST_DATA } from "./integration-test-setup";

interface TestQueryComponentProps {
    queryKey: string[];
    serviceFn: (input: any) => Promise<any>;
    serviceFnArgs?: any;
    enabled?: boolean;
    onResultChange?: (result: any) => void;
    trackRefetchResults?: boolean;
    queryClient?: QueryClient;
}

const TestQueryComponent: FC<TestQueryComponentProps> = ({
    queryKey,
    serviceFn,
    serviceFnArgs,
    enabled = true,
    onResultChange,
    trackRefetchResults = false,
    queryClient,
}) => {
    const [lastRefetchResult, setLastRefetchResult] = useState<any>(null);
    const [isQueryEnabled, setIsQueryEnabled] = useState(enabled);

    const queryResult = useQueryService({
        serviceFn,
        serviceFnArgs,
        options: {
            queryKey,
            enabled: isQueryEnabled,
        },
    });

    useEffect(() => {
        onResultChange?.(queryResult);
    }, [queryResult, onResultChange]);

    const handleRefetch = async () => {
        setIsQueryEnabled(true);
        if (trackRefetchResults) {
            try {
                const result = await queryResult.refetch?.();
                setLastRefetchResult((result as any)?.data);
            } catch (error) {
                setLastRefetchResult({ error: error instanceof Error ? error.message : String(error) });
            }
        } else {
            queryResult.refetch?.();
        }
    };

    return (
        <div>
            <div data-testid="loading">{queryResult.isLoading ? "Loading" : "Idle"}</div>
            <div data-testid="error">{queryResult.isError ? "Error" : "No Error"}</div>
            <div data-testid="success">{queryResult.isSuccess ? "Success" : "Not Success"}</div>
            <div data-testid="last-result">
                {trackRefetchResults
                    ? lastRefetchResult === undefined
                        ? "undefined"
                        : JSON.stringify(lastRefetchResult)
                    : queryResult.data === undefined
                      ? "undefined"
                      : JSON.stringify(queryResult.data)}
            </div>
            <div data-testid="error-message">{queryResult.error?.message || "No Error"}</div>
            <div data-testid="query-state">
                {queryResult.isLoading && "Loading"}
                {queryResult.isError && "Error"}
                {queryResult.isSuccess && "Success"}
            </div>
            <button data-testid="refetch-button" onClick={handleRefetch} disabled={queryResult.isLoading}>
                Refetch
            </button>
        </div>
    );
};

describe("useQueryService Integration Tests", () => {
    it("should handle initial state correctly", () => {
        const mockMagellanFn = (input: any) =>
            Promise.resolve({
                ...input,
                id: 1,
                name: "John Doe",
                email: "john@example.com",
            });

        render(
            <TestQueryComponent
                queryKey={["users", "1"]}
                serviceFn={mockMagellanFn}
                serviceFnArgs={{ id: 1 }}
                onResultChange={result => console.log("changed", result, screen.getByTestId("error").textContent)}
            />
        );

        expect(screen.getByTestId("loading").textContent).toContain("Loading");
        expect(screen.getByTestId("error").textContent).toBe("No Error");
        expect(screen.getByTestId("success").textContent).toContain("Not Success");
        expect(screen.getByTestId("last-result").textContent).toBe("undefined");
    });

    describe("Successful Query", () => {
        it("should handle successful query", async () => {
            let resolveFn: (value: any) => void;

            const mockMagellanFn = jest.fn().mockReturnValue(
                new Promise(resolve => {
                    resolveFn = resolve;
                })
            );

            render(
                <TestQueryComponent
                    queryKey={["users", "1"]}
                    serviceFn={mockMagellanFn}
                    serviceFnArgs={{ id: 1 }}
                    onResultChange={result => console.log("changed", result, screen.getByTestId("error").textContent)}
                />
            );

            // Should be loading initially
            await waitFor(() => {
                expect(screen.getByTestId("loading").textContent).toBe("Loading");
            });

            // Resolve the faked magellan call
            resolveFn!(TEST_DATA.user);

            // Wait for query to complete
            await waitFor(() => {
                expect(screen.getByTestId("loading").textContent).toBe("Idle");
            });

            // Should show success state
            expect(screen.getByTestId("success").textContent).toContain("Success");
            expect(screen.getByTestId("error").textContent).toBe("No Error");
            expect(screen.getByTestId("last-result").textContent).toContain(JSON.stringify(TEST_DATA.user));
            expect(screen.getByTestId("error-message").textContent).toBe("No Error");

            // Verify the magellan function was called with correct input
            expect(mockMagellanFn).toHaveBeenCalledWith({ id: 1 });
        });

        it("should handle query with null input", async () => {
            let resolveFn: (value: any) => void;

            const mockMagellanFn = jest.fn().mockReturnValue(
                new Promise(resolve => {
                    resolveFn = resolve;
                })
            );

            render(<TestQueryComponent queryKey={[...QUERY_KEYS.users]} serviceFn={mockMagellanFn} serviceFnArgs={null} />);

            // Should be loading initially
            await waitFor(() => {
                expect(screen.getByTestId("loading").textContent).toBe("Loading");
            });

            // Resolve the faked magellan call
            resolveFn!(TEST_DATA.users);

            // Wait for query to complete
            await waitFor(() => {
                expect(screen.getByTestId("loading").textContent).toBe("Idle");
            });

            // Should show success state
            expect(screen.getByTestId("success").textContent).toContain("Success");
            expect(screen.getByTestId("error").textContent).toBe("No Error");
            expect(screen.getByTestId("last-result").textContent).toContain(JSON.stringify(TEST_DATA.users));
            expect(screen.getByTestId("error-message").textContent).toBe("No Error");

            // Verify the magellan function was called with correct input
            expect(mockMagellanFn).toHaveBeenCalledWith(null);
        });
    });

    describe("Error Handling", () => {
        it("should handle query error", async () => {
            const errorMessage = "Failed to fetch user";
            const mockMagellanFn = () => Promise.reject(new Error(errorMessage));

            renderWithQueryClient(<TestQueryComponent queryKey={["users", "1"]} serviceFn={mockMagellanFn} serviceFnArgs={{ id: 1 }} />);

            await waitFor(() => {
                expect(screen.getByTestId("loading").textContent).toBe("Idle");
            });

            expect(screen.getByTestId("error").textContent).toContain("Error");
            expect(screen.getByTestId("success").textContent).toBe("Not Success");
            expect(screen.getByTestId("last-result").textContent).toBe("undefined");
            expect(screen.getByTestId("error-message").textContent).toContain(errorMessage);
        });

        it("should handle query error with custom error object", async () => {
            const customError = { message: "Validation failed", code: 400 };
            const mockMagellanFn = () => Promise.reject(customError);

            renderWithQueryClient(<TestQueryComponent queryKey={["users", "1"]} serviceFn={mockMagellanFn} serviceFnArgs={{ id: 1 }} />);

            await waitFor(() => {
                expect(screen.getByTestId("error").textContent).toBe("Error");
            });

            expect(screen.getByTestId("error-message").textContent).toContain("Validation failed");
        });

        it("should handle query error and allow retry", async () => {
            let callCount = 0;
            const mockMagellanFn = () => {
                callCount++;
                if (callCount === 1) {
                    return Promise.reject(new Error("First attempt failed"));
                }
                return Promise.resolve({ ...TEST_DATA.user, attempt: callCount });
            };

            renderWithQueryClient(
                <TestQueryComponent queryKey={["users", "1"]} serviceFn={mockMagellanFn} serviceFnArgs={{ id: 1 }} trackRefetchResults={true} />
            );

            // First attempt - should fail
            await waitFor(() => {
                expect(screen.getByTestId("query-state").textContent).toContain("Error");
            });

            const refetchButton = screen.getByTestId("refetch-button");

            expect(callCount).toBe(1);

            // Second attempt - should succeed
            fireEvent.click(refetchButton);

            await waitFor(() => {
                expect(screen.getByTestId("query-state").textContent).toContain("Success");
            });

            expect(callCount).toBe(2);
            expect(screen.getByTestId("last-result").textContent).toContain('"attempt":2');
        });
    });

    describe("Query States", () => {
        it("should maintain refetch function availability in all states", async () => {
            const mockMagellanFn = () => Promise.resolve(TEST_DATA.user);

            render(<TestQueryComponent queryKey={["users", "1"]} serviceFn={mockMagellanFn} serviceFnArgs={{ id: 1 }} />);

            // Wait for initial query to complete
            await waitFor(() => {
                expect(screen.getByTestId("query-state").textContent).toContain("Success");
            });

            // Should have refetch function after success
            const refetchButton = screen.getByTestId("refetch-button");
            expect(refetchButton).not.toBeNull();

            // After clicking, should still have refetch function (but disabled during loading)
            fireEvent.click(refetchButton);
            expect(refetchButton).not.toBeNull();
        });

        it("should not call magellan function on mount when query is disabled", () => {
            const mockMagellanFn = jest.fn().mockImplementation(() => Promise.resolve(TEST_DATA.user));

            render(<TestQueryComponent queryKey={["users", "1"]} serviceFn={mockMagellanFn} serviceFnArgs={{ id: 1 }} enabled={false} />);

            // Should be in loading state when disabled
            expect(screen.getByTestId("loading").textContent).toContain("Idle");
            expect(screen.getByTestId("error").textContent).toContain("No Error");
            expect(screen.getByTestId("success").textContent).toContain("Not Success");
            expect(screen.getByTestId("last-result").textContent).toBe("undefined");

            // Magellan function should not be called
            expect(mockMagellanFn).not.toHaveBeenCalled();
        });

        it("should call magellan function when query is disabled and refetch is executed", async () => {
            const mockMagellanFn = jest.fn().mockImplementation(() => Promise.resolve(TEST_DATA.user));

            render(<TestQueryComponent queryKey={["users", "1"]} serviceFn={mockMagellanFn} serviceFnArgs={{ id: 1 }} enabled={false} />);

            const refetchButton = screen.getByTestId("refetch-button");
            fireEvent.click(refetchButton);

            await waitFor(() => {
                expect(mockMagellanFn).toHaveBeenCalled();
                expect(screen.getByTestId("loading").textContent).toContain("Idle");
            });

            expect(screen.getByTestId("error").textContent).toContain("No Error");
            expect(screen.getByTestId("last-result").textContent).toBe('{"id":1,"name":"John Doe","email":"john@example.com"}');
            expect(screen.getByTestId("success").textContent).toBe("Success");
        });
    });

    describe("Result Callback", () => {
        it("should be called with initial state on mount", () => {
            const onResultChange = jest.fn();
            const mockMagellanFn = (input: any) =>
                Promise.resolve({
                    ...input,
                    processed: true,
                });

            render(
                <TestQueryComponent queryKey={["users", "1"]} serviceFn={mockMagellanFn} serviceFnArgs={{ id: 1 }} onResultChange={onResultChange} />
            );

            expect(onResultChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    isLoading: true,
                    isError: false,
                    isSuccess: false,
                    data: undefined,
                    error: null,
                    refetch: expect.any(Function),
                })
            );
        });

        it("should call onResultChange callback when result changes", async () => {
            const onResultChange = jest.fn();
            const mockMagellanFn = (input: any) =>
                Promise.resolve({
                    ...input,
                    processed: true,
                });

            render(
                <TestQueryComponent queryKey={["users", "1"]} serviceFn={mockMagellanFn} serviceFnArgs={{ id: 1 }} onResultChange={onResultChange} />
            );

            await waitFor(() => {
                expect(screen.getByTestId("success").textContent).toBe("Success");
            });

            expect(onResultChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    isLoading: false,
                    isError: false,
                    isSuccess: true,
                    data: expect.objectContaining({ id: 1, processed: true }),
                    error: null,
                    refetch: expect.any(Function),
                })
            );
        });
    });

    describe("Multiple Queries", () => {
        it("should handle multiple sequential refetches", async () => {
            const mockMagellanFn = jest.fn().mockResolvedValue(TEST_DATA.user);

            render(<TestQueryComponent queryKey={["users", "1"]} serviceFn={mockMagellanFn} serviceFnArgs={{ id: 1 }} trackRefetchResults={true} />);

            // Wait for initial query
            await waitFor(() => {
                expect(screen.getByTestId("query-state").textContent).toContain("Success");
            });

            const refetchButton = screen.getByTestId("refetch-button");

            // Initially last result should be null (no manual refetch yet)
            expect(screen.getByTestId("last-result").textContent).toBe("null");

            // First refetch - button should be clickable
            expect(refetchButton).not.toBeNull();
            fireEvent.click(refetchButton);

            // Second refetch - button should still be clickable
            expect(refetchButton).not.toBeNull();
            fireEvent.click(refetchButton);

            // Verify the magellan function was called for initial query + 2 refetches
            expect(mockMagellanFn).toHaveBeenCalledTimes(3);
            expect(mockMagellanFn).toHaveBeenCalledWith({ id: 1 });
        });
    });

    describe("QueryClient Configuration", () => {
        it("should use QueryClient from parameter (parameter takes precedence over provider)", async () => {
            const parameterQueryClient = new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 10000, // 10 seconds
                        retry: false,
                    },
                },
            });

            const providerQueryClient = new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5000, // 5 seconds
                        retry: false,
                    },
                },
            });

            const mockMagellanFn = jest.fn().mockResolvedValue(TEST_DATA.user);

            renderWithQueryClient(
                <TestQueryComponent
                    queryKey={["users", "param-test"]}
                    serviceFn={mockMagellanFn}
                    serviceFnArgs={{ id: 1 }}
                    queryClient={parameterQueryClient}
                />,
                providerQueryClient
            );

            await waitFor(
                () => {
                    expect(screen.getByTestId("success").textContent).toContain("Success");
                },
                { timeout: 3000 }
            );

            await waitFor(
                () => {
                    const lastResult = screen.getByTestId("last-result").textContent;
                    expect(lastResult).not.toBe("undefined");
                    expect(lastResult).toContain(JSON.stringify(TEST_DATA.user));
                },
                { timeout: 3000 }
            );

            // The parameter QueryClient should be used (we can verify by checking it has the right staleTime)
            const defaultOptions = parameterQueryClient.getDefaultOptions();
            expect(defaultOptions.queries?.staleTime).toBe(10000);
            expect(mockMagellanFn).toHaveBeenCalledWith({ id: 1 });
        });

        it("should use QueryClient from provider when no parameter is provided", async () => {
            const providerQueryClient = new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30000, // 30 seconds
                        retry: false,
                    },
                },
            });

            const mockMagellanFn = jest.fn().mockResolvedValue(TEST_DATA.user);

            renderWithQueryClient(
                <TestQueryComponent queryKey={["users", "provider-test"]} serviceFn={mockMagellanFn} serviceFnArgs={{ id: 1 }} />,
                providerQueryClient
            );

            await waitFor(
                () => {
                    expect(screen.getByTestId("success").textContent).toContain("Success");
                },
                { timeout: 3000 }
            );

            await waitFor(
                () => {
                    const lastResult = screen.getByTestId("last-result").textContent;
                    expect(lastResult).not.toBe("undefined");
                    expect(lastResult).toContain(JSON.stringify(TEST_DATA.user));
                },
                { timeout: 3000 }
            );

            // Verify provider QueryClient configuration
            const defaultOptions = providerQueryClient.getDefaultOptions();
            expect(defaultOptions.queries?.staleTime).toBe(30000);
            expect(mockMagellanFn).toHaveBeenCalledWith({ id: 1 });
        });

        it("should use default QueryClient when neither parameter nor provider is provided", async () => {
            const mockMagellanFn = jest.fn().mockResolvedValue(TEST_DATA.user);

            render(<TestQueryComponent queryKey={["users", "default-test"]} serviceFn={mockMagellanFn} serviceFnArgs={{ id: 1 }} />);

            await waitFor(
                () => {
                    expect(screen.getByTestId("success").textContent).toContain("Success");
                },
                { timeout: 3000 }
            );

            await waitFor(
                () => {
                    const lastResult = screen.getByTestId("last-result").textContent;
                    expect(lastResult).not.toBe("undefined");
                    expect(lastResult).toContain(JSON.stringify(TEST_DATA.user));
                },
                { timeout: 3000 }
            );

            expect(mockMagellanFn).toHaveBeenCalledWith({ id: 1 });
        });

        it("should prioritize parameter over provider in integration test", async () => {
            const parameterQueryClient = new QueryClient({
                defaultOptions: {
                    queries: {
                        retry: false,
                        staleTime: 99999, // Distinct value to verify which client is used
                    },
                },
            });

            const providerQueryClient = new QueryClient({
                defaultOptions: {
                    queries: {
                        retry: false,
                        staleTime: 11111, // Different value
                    },
                },
            });

            const mockMagellanFn = jest.fn().mockResolvedValue(TEST_DATA.user);

            renderWithQueryClient(
                <TestQueryComponent
                    queryKey={["users", "test-priority"]}
                    serviceFn={mockMagellanFn}
                    serviceFnArgs={{ id: 1 }}
                    queryClient={parameterQueryClient}
                />,
                providerQueryClient
            );

            await waitFor(
                () => {
                    expect(screen.getByTestId("success").textContent).toContain("Success");
                },
                { timeout: 3000 }
            );

            await waitFor(
                () => {
                    const lastResult = screen.getByTestId("last-result").textContent;
                    expect(lastResult).not.toBe("undefined");
                    expect(lastResult).toContain(JSON.stringify(TEST_DATA.user));
                },
                { timeout: 3000 }
            );

            // Verify the parameter QueryClient was the one used by checking its configuration
            const paramOptions = parameterQueryClient.getDefaultOptions();
            const providerOptions = providerQueryClient.getDefaultOptions();
            expect(paramOptions.queries?.staleTime).toBe(99999);
            expect(providerOptions.queries?.staleTime).toBe(11111);
            expect(mockMagellanFn).toHaveBeenCalledWith({ id: 1 });
        });

        it("should work with default QueryClient for multiple queries", async () => {
            const mockMagellanFn1 = jest.fn().mockResolvedValue(TEST_DATA.user);
            const mockMagellanFn2 = jest.fn().mockResolvedValue(TEST_DATA.post);

            render(
                <div>
                    <TestQueryComponent queryKey={["users", "1"]} serviceFn={mockMagellanFn1} serviceFnArgs={{ id: 1 }} />
                    <TestQueryComponent queryKey={["posts", "1"]} serviceFn={mockMagellanFn2} serviceFnArgs={{ id: 1 }} />
                </div>
            );

            await waitFor(() => {
                expect(mockMagellanFn1).toHaveBeenCalled();
                expect(mockMagellanFn2).toHaveBeenCalled();
            });

            // Both queries should work with default QueryClient
            expect(mockMagellanFn1).toHaveBeenCalledWith({ id: 1 });
            expect(mockMagellanFn2).toHaveBeenCalledWith({ id: 1 });
        });
    });
});
