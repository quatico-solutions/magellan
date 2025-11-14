/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import React, { FC, useEffect, useState } from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { useMutationService } from "../src/hooks/useMutationService";
import { renderWithQueryClient } from "./integration-test-setup";

interface TestMutationComponentProps {
    mutationKey: string[];
    serviceFn: (input: any) => Promise<any>;
    onResultChange?: (result: any) => void;
}

const TestMutationComponent: FC<TestMutationComponentProps> = ({ mutationKey, serviceFn, onResultChange }) => {
    const mutationResult = useMutationService({
        serviceFn: serviceFn,
        options: {
            mutationKey: mutationKey,
        },
    });

    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        onResultChange?.(mutationResult);
    }, [mutationResult, onResultChange]);

    const handleMutate = async () => {
        try {
            const result = await mutationResult.mutate({ input: inputValue });
            console.log("Mutation result:", result);
        } catch (error) {
            console.error("Mutation error:", error);
        }
    };

    return (
        <div>
            <input data-testid="mutation-input" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Enter input" />
            <button data-testid="mutate-button" onClick={handleMutate} disabled={mutationResult.isPending}>
                {mutationResult.isPending ? "Mutating..." : "Mutate"}
            </button>
            <div data-testid="loading">{mutationResult.isPending ? "Loading" : "Idle"}</div>
            <div data-testid="error">{mutationResult.isError ? "Error" : "No Error"}</div>
            <div data-testid="success">{mutationResult.isSuccess ? "Success" : "Not Success"}</div>
            <div data-testid="last-result">{mutationResult.data === undefined ? "undefined" : JSON.stringify(mutationResult.data)}</div>
            <div data-testid="error-message">{mutationResult.error?.message || "No Error"}</div>
        </div>
    );
};

const TestContainerWithUseMagellanMutation: FC<{
    mutationKey: string[];
    serviceFn: (input: any) => Promise<any>;
}> = ({ mutationKey, serviceFn }) => {
    const mutationResult = useMutationService({
        serviceFn: serviceFn,
        options: {
            mutationKey: mutationKey,
        },
    });

    const [lastResult, setLastResult] = useState<any>(null);

    const handleMutate = async () => {
        try {
            mutationResult.mutate({ test: "data" }).then(result => {
                setLastResult(result);
            });
        } catch (error) {
            setLastResult({ error: error instanceof Error ? error.message : String(error) });
        }
    };

    return (
        <div>
            <button data-testid="mutate-button" onClick={handleMutate} disabled={mutationResult.isPending}>
                Mutate
            </button>
            <div data-testid="mutation-state">
                {mutationResult.isPending && "Loading"}
                {mutationResult.isError && "Error"}
                {mutationResult.isSuccess && "Success"}
            </div>
            <div data-testid="last-result">{lastResult === undefined ? "undefined" : JSON.stringify(lastResult)}</div>
        </div>
    );
};

describe("useMutationService Integration Tests", () => {
    it("should handle initial state correctly", () => {
        const mockMagellanFn = (input: any) =>
            Promise.resolve({
                ...input,
                id: 1,
                createdAt: new Date().toISOString(),
            });

        renderWithQueryClient(
            <TestMutationComponent
                mutationKey={["createUser"]}
                serviceFn={mockMagellanFn}
                onResultChange={result => console.log("changed", result, screen.getByTestId("error").textContent)}
            />
        );

        expect(screen.getByTestId("loading").textContent).toContain("Idle");
        expect(screen.getByTestId("error").textContent).toBe("No Error");
        expect(screen.getByTestId("success").textContent).toContain("Not Success");
        expect(screen.getByTestId("last-result").textContent).toContain("undefined");
    });

    describe("Successful Mutation", () => {
        it("should handle successful mutation", async () => {
            let resolveFn: (value: any) => void;

            const mockMagellanFn = jest.fn().mockReturnValue(
                new Promise(resolve => {
                    resolveFn = resolve;
                })
            );

            renderWithQueryClient(
                <TestMutationComponent
                    mutationKey={["createUser"]}
                    serviceFn={mockMagellanFn}
                    onResultChange={result => console.log("changed", result, screen.getByTestId("error").textContent)}
                />
            );

            const input = screen.getByTestId("mutation-input");
            fireEvent.change(input, { target: { value: "test input" } });

            const mutateButton = screen.getByTestId("mutate-button");
            fireEvent.click(mutateButton);

            // Should be loading
            await waitFor(() => {
                expect(screen.getByTestId("loading").textContent).toBe("Loading");
            });

            // Resolve the faked magellan call
            resolveFn!({
                input: "test input",
                id: 1,
                createdAt: new Date().toISOString(),
            });

            // Wait for mutation to complete
            await waitFor(() => {
                expect(screen.getByTestId("loading").textContent).toBe("Idle");
            });

            // Should show success state
            expect(screen.getByTestId("success").textContent).toContain("Success");
            expect(screen.getByTestId("error").textContent).toBe("No Error");
            expect(screen.getByTestId("last-result").textContent).toContain("test input");
            expect(screen.getByTestId("error-message").textContent).toBe("No Error");
            expect(screen.getByTestId("loading").textContent).toContain("Idle");

            // Verify the magellan function was called with correct input
            expect(mockMagellanFn).toHaveBeenCalledWith({ input: "test input" });
        });

        it("should handle mutation with null input", async () => {
            const mockMagellanFn = () => Promise.resolve({ result: "success" });

            renderWithQueryClient(<TestContainerWithUseMagellanMutation mutationKey={["testMutation"]} serviceFn={mockMagellanFn} />);

            const mutateButton = screen.getByTestId("mutate-button");
            fireEvent.click(mutateButton);

            await waitFor(() => {
                expect(screen.getByTestId("mutation-state").textContent).toContain("Success");
            });

            expect(screen.getByTestId("last-result").textContent).toContain("success");
        });
    });

    describe("Error Handling", () => {
        it("should handle mutation error", async () => {
            const errorMessage = "Failed to create user";
            const mockMagellanFn = () => Promise.reject(new Error(errorMessage));

            renderWithQueryClient(<TestMutationComponent mutationKey={["createUser"]} serviceFn={mockMagellanFn} />);

            // Enter input and trigger mutation
            const input = screen.getByTestId("mutation-input");
            fireEvent.change(input, { target: { value: "test input" } });

            const mutateButton = screen.getByTestId("mutate-button");
            fireEvent.click(mutateButton);

            await waitFor(() => {
                expect(screen.getByTestId("loading").textContent).toContain("Idle");
            });

            expect(screen.getByTestId("error").textContent).toContain("Error");
            expect(screen.getByTestId("success").textContent).toBe("Not Success");
            expect(screen.getByTestId("last-result").textContent).toBe("undefined");
            expect(screen.getByTestId("error-message").textContent).toContain(errorMessage);
        });

        it("should handle mutation error with custom error object", async () => {
            const customError = { message: "Validation failed", code: 400 };
            const mockMagellanFn = () => Promise.reject(customError);

            renderWithQueryClient(<TestMutationComponent mutationKey={["createUser"]} serviceFn={mockMagellanFn} />);

            const mutateButton = screen.getByTestId("mutate-button");
            fireEvent.click(mutateButton);

            await waitFor(() => {
                expect(screen.getByTestId("error").textContent).toBe("Error");
            });

            expect(screen.getByTestId("error-message").textContent).toContain("Validation failed");
        });

        it("should handle mutation error and allow retry", async () => {
            let callCount = 0;
            const mockMagellanFn = () => {
                callCount++;
                if (callCount === 1) {
                    return Promise.reject(new Error("First attempt failed"));
                }
                return Promise.resolve({ success: true, attempt: callCount });
            };

            renderWithQueryClient(<TestMutationComponent mutationKey={["createUser"]} serviceFn={mockMagellanFn} />);

            const mutateButton = screen.getByTestId("mutate-button");

            // First attempt - should fail
            fireEvent.click(mutateButton);

            await waitFor(() => {
                expect(screen.getByTestId("error").textContent).toContain("Error");
            });

            expect(callCount).toBe(1);

            // Second attempt - should succeed
            fireEvent.click(mutateButton);

            await waitFor(() => {
                expect(screen.getByTestId("success").textContent).toContain("Success");
            });

            expect(callCount).toBe(2);
            expect(screen.getByTestId("last-result").textContent).toContain("success");
        });
    });

    describe("Mutation States", () => {
        it("should maintain mutate function availability in all states", () => {
            const mockMagellanFn = () => Promise.resolve();

            renderWithQueryClient(<TestMutationComponent mutationKey={["testMutation"]} serviceFn={mockMagellanFn} />);

            // Initially should have mutate function
            const mutateButton = screen.getByTestId("mutate-button");
            expect(mutateButton).not.toBeNull();
            expect(mutateButton).not.toBeNull();

            // After clicking, should still have mutate function (but disabled during loading)
            fireEvent.click(mutateButton);
            expect(mutateButton).not.toBeNull();
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

            renderWithQueryClient(
                <TestMutationComponent mutationKey={["testMutation"]} serviceFn={mockMagellanFn} onResultChange={onResultChange} />
            );

            expect(onResultChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    isIdle: true,
                    isPending: false,
                    isError: false,
                    isSuccess: false,
                    data: undefined,
                    error: null,
                    mutate: expect.any(Function),
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

            renderWithQueryClient(
                <TestMutationComponent mutationKey={["testMutation"]} serviceFn={mockMagellanFn} onResultChange={onResultChange} />
            );

            const input = screen.getByTestId("mutation-input");
            fireEvent.change(input, { target: { value: "test" } });

            const mutateButton = screen.getByTestId("mutate-button");
            fireEvent.click(mutateButton);

            await waitFor(() => {
                expect(screen.getByTestId("success").textContent).toBe("Success");
            });

            expect(onResultChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    isIdle: false,
                    isPending: false,
                    isError: false,
                    isSuccess: true,
                    data: expect.objectContaining({ input: "test", processed: true }),
                    error: null,
                    mutate: expect.any(Function),
                })
            );
        });
    });

    describe("Multiple Mutations", () => {
        it("should handle multiple sequential mutations", async () => {
            const mockMagellanFn = jest.fn().mockImplementation((input: any) =>
                Promise.resolve({
                    ...input,
                    timestamp: Date.now(),
                })
            );

            renderWithQueryClient(<TestMutationComponent mutationKey={["sequentialMutations"]} serviceFn={mockMagellanFn} />);

            const input = screen.getByTestId("mutation-input");
            const mutateButton = screen.getByTestId("mutate-button");

            // First mutation
            fireEvent.change(input, { target: { value: "first" } });
            fireEvent.click(mutateButton);

            await waitFor(() => {
                expect(screen.getByTestId("success").textContent).toContain("Success");
            });

            expect(screen.getByTestId("last-result").textContent).toContain("first");

            // Second mutation
            fireEvent.change(input, { target: { value: "second" } });
            fireEvent.click(mutateButton);

            await waitFor(() => {
                expect(screen.getByTestId("success").textContent).toContain("Success");
            });

            expect(screen.getByTestId("last-result").textContent).toContain("second");

            expect(mockMagellanFn).toHaveBeenCalledTimes(2);
            expect(mockMagellanFn).toHaveBeenNthCalledWith(1, { input: "first" });
            expect(mockMagellanFn).toHaveBeenNthCalledWith(2, { input: "second" });
        });
    });
});
