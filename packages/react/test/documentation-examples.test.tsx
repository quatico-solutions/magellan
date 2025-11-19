/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

/**
 * E2E tests for documentation examples from docs/magellan/how-to/service-function-hooks.md
 * These tests ensure the examples in the documentation actually work
 */

import { useQueryClient } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React, { FC, useEffect, useState } from "react";
import { useMutationService } from "../src/hooks/useMutationService";
import { useQueryService } from "../src/hooks/useQueryService";
import { renderWithQueryClient } from "./integration-test-setup";

describe("Documentation Examples E2E Tests", () => {
    describe("Conditional Queries", () => {
        describe("Authentication Gates", () => {
            type AuthContextType = {
                isAuthenticated: boolean;
                user: { id: string } | null;
            };

            const AuthContext = React.createContext<AuthContextType>({
                isAuthenticated: false,
                user: null,
            });

            const useAuth = () => React.useContext(AuthContext);

            const Dashboard: FC = () => {
                const { isAuthenticated, user } = useAuth();

                const { data: preferences, isEnabled } = useQueryService({
                    serviceFn: (args: { userId: string }) => Promise.resolve({ theme: "dark", userId: args.userId }),
                    serviceFnArgs: { userId: user?.id || "" },
                    options: {
                        enabled: isAuthenticated && !!user?.id,
                        queryKey: ["userPreferences", user?.id],
                    },
                });

                if (!isAuthenticated) {
                    return <div data-testid="login-prompt">Please login</div>;
                }

                if (!isEnabled) {
                    return <div data-testid="not-enabled">Query disabled</div>;
                }

                return (
                    <div data-testid="dashboard">
                        {preferences ? <div data-testid="preferences">Theme: {preferences.theme}</div> : <div data-testid="loading">Loading...</div>}
                    </div>
                );
            };

            it("should not fetch when user is not authenticated", () => {
                render(
                    <AuthContext.Provider value={{ isAuthenticated: false, user: null }}>
                        <Dashboard />
                    </AuthContext.Provider>
                );

                expect(screen.getByTestId("login-prompt")).not.toBeNull();
            });

            it("should fetch preferences only after authentication", async () => {
                const { rerender } = renderWithQueryClient(
                    <AuthContext.Provider value={{ isAuthenticated: false, user: null }}>
                        <Dashboard />
                    </AuthContext.Provider>
                );

                expect(screen.getByTestId("login-prompt")).not.toBeNull();

                // User logs in
                rerender(
                    <AuthContext.Provider value={{ isAuthenticated: true, user: { id: "user123" } }}>
                        <Dashboard />
                    </AuthContext.Provider>
                );

                await waitFor(() => {
                    expect(screen.getByTestId("dashboard")).not.toBeNull();
                });

                await waitFor(() => {
                    expect(screen.getByTestId("preferences").textContent).toContain("Theme: dark");
                });
            });
        });

        describe("Dependent Queries", () => {
            const OrderDetails: FC = () => {
                // First, fetch the order
                const orderQuery = useQueryService({
                    serviceFn: (args: { orderId: number }) =>
                        Promise.resolve({
                            id: args.orderId,
                            customerId: 456,
                            total: 99.99,
                        }),
                    serviceFnArgs: { orderId: 123 },
                    options: {
                        queryKey: ["order", 123],
                    },
                });

                // Then, fetch the customer (only after order loads)
                const customerQuery = useQueryService({
                    serviceFn: (args: { customerId: number }) =>
                        Promise.resolve({
                            id: args.customerId,
                            name: "Jane Smith",
                        }),
                    serviceFnArgs: { customerId: orderQuery.data?.customerId || 0 },
                    options: {
                        enabled: orderQuery.isSuccess && !!orderQuery.data?.customerId,
                        queryKey: ["customer", orderQuery.data?.customerId],
                    },
                });

                if (orderQuery.isPending) return <div data-testid="loading">Loading order...</div>;
                if (orderQuery.isError) return <div data-testid="error">Error loading order</div>;

                return (
                    <div data-testid="order-details">
                        <div data-testid="order-info">Order #{orderQuery.data.id}</div>
                        {customerQuery.isSuccess && <div data-testid="customer-info">Customer: {customerQuery.data.name}</div>}
                        {customerQuery.isPending && <div data-testid="customer-loading">Loading customer...</div>}
                    </div>
                );
            };

            it("should fetch customer only after order loads", async () => {
                renderWithQueryClient(<OrderDetails />);

                // Initially loading order
                expect(screen.getByTestId("loading").textContent).toContain("Loading order...");

                // Order should load first
                await waitFor(() => {
                    expect(screen.getByTestId("order-info").textContent).toContain("Order #123");
                });

                // Then customer should load
                await waitFor(() => {
                    expect(screen.getByTestId("customer-info").textContent).toContain("Customer: Jane Smith");
                });
            });
        });

        describe("Manual Refetch", () => {
            it("should not auto-fetch and only search on button click", async () => {
                type User = { id: number; name: string };
                const mockServiceFn = jest.fn<Promise<User[]>, [{ query: string }]>().mockResolvedValue([{ id: 1, name: "User matching test" }]);

                const SearchUsers: FC = () => {
                    const [searchTerm, setSearchTerm] = useState("");

                    const { data, refetch, isLoading } = useQueryService({
                        serviceFn: mockServiceFn,
                        serviceFnArgs: { query: searchTerm },
                        options: {
                            enabled: false, // Don't auto-run
                            queryKey: ["searchUsers"],
                        },
                    });

                    const handleSearch = () => {
                        refetch();
                    };

                    return (
                        <div>
                            <input data-testid="search-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            <button data-testid="search-button" onClick={handleSearch} disabled={isLoading}>
                                Search
                            </button>
                            {data && (
                                <div data-testid="search-results">
                                    {data.map(user => (
                                        <div key={user.id}>{user.name}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                };

                renderWithQueryClient(<SearchUsers />);

                // Should not fetch initially
                expect(mockServiceFn).not.toHaveBeenCalled();

                // Enter search term
                const input = screen.getByTestId("search-input");
                fireEvent.change(input, { target: { value: "test" } });

                // Still should not have fetched
                expect(mockServiceFn).not.toHaveBeenCalled();

                // Click search button
                const searchButton = screen.getByTestId("search-button");
                fireEvent.click(searchButton);

                // Now should fetch
                await waitFor(() => {
                    expect(screen.getByTestId("search-results")).not.toBeNull();
                });

                // Verify service was called
                expect(mockServiceFn).toHaveBeenCalledWith({ query: "test" });
            });
        });
    });

    describe("Advanced Error Handling", () => {
        describe("Loading Error vs Refetch Error", () => {
            const ProductList: FC<{ shouldFailInitially: boolean; shouldFailOnRefetch: boolean }> = ({
                shouldFailInitially,
                shouldFailOnRefetch,
            }) => {
                let callCount = 0;
                type Product = { id: number; name: string };

                const { data, isLoadingError, isRefetchError, refetch } = useQueryService({
                    serviceFn: (): Promise<Product[]> => {
                        callCount++;
                        if (callCount === 1 && shouldFailInitially) {
                            return Promise.reject(new Error("Initial fetch failed"));
                        }
                        if (callCount > 1 && shouldFailOnRefetch) {
                            return Promise.reject(new Error("Refetch failed"));
                        }
                        return Promise.resolve([{ id: 1, name: "Product 1" }]);
                    },
                    options: {
                        queryKey: ["products"],
                    },
                });

                if (isLoadingError) {
                    return (
                        <div data-testid="error-page">
                            <h2>Failed to load products</h2>
                            <button onClick={() => refetch()}>Try Again</button>
                        </div>
                    );
                }

                return (
                    <div>
                        {isRefetchError && <div data-testid="warning-banner">Unable to get latest updates. Showing cached data.</div>}
                        {data && (
                            <div data-testid="product-grid">
                                {data.map(product => (
                                    <div key={product.id}>{product.name}</div>
                                ))}
                            </div>
                        )}
                        <button data-testid="refetch-button" onClick={() => refetch()}>
                            Refresh
                        </button>
                    </div>
                );
            };

            it("should show error page when initial fetch fails (no stale data)", async () => {
                renderWithQueryClient(<ProductList shouldFailInitially={true} shouldFailOnRefetch={false} />);

                await waitFor(() => {
                    expect(screen.getByTestId("error-page")).not.toBeNull();
                });

                expect(screen.getByTestId("error-page").textContent).toContain("Failed to load products");
            });

            it("should show stale data with warning when refetch fails", async () => {
                let callCount = 0;
                type Product = { id: number; name: string };
                const mockServiceFn = jest.fn<Promise<Product[]>, []>().mockImplementation(() => {
                    callCount++;
                    if (callCount === 1) {
                        // Initial fetch succeeds
                        return Promise.resolve([{ id: 1, name: "Product 1" }]);
                    }
                    // Subsequent refetches fail
                    return Promise.reject(new Error("Refetch failed"));
                });

                const TestComponent: FC = () => {
                    const { data, isRefetchError, refetch, isPending } = useQueryService({
                        serviceFn: mockServiceFn,
                        options: {
                            queryKey: ["products-refetch-test"],
                        },
                    });

                    return (
                        <div>
                            {isRefetchError && <div data-testid="warning-banner">Unable to get latest updates. Showing cached data.</div>}
                            {data && (
                                <div data-testid="product-grid">
                                    {data.map(product => (
                                        <div key={product.id}>{product.name}</div>
                                    ))}
                                </div>
                            )}
                            <button data-testid="refetch-button" onClick={() => refetch()} disabled={isPending}>
                                Refresh
                            </button>
                        </div>
                    );
                };

                renderWithQueryClient(<TestComponent />);

                // Wait for initial successful fetch
                await waitFor(() => {
                    expect(screen.getByTestId("product-grid")).not.toBeNull();
                });

                expect(screen.queryByTestId("warning-banner")).toBeNull();

                // Trigger refetch which will fail
                const refetchButton = screen.getByTestId("refetch-button");
                fireEvent.click(refetchButton);

                // Should show warning but still display stale data
                await waitFor(() => {
                    expect(screen.getByTestId("warning-banner")).not.toBeNull();
                });

                expect(screen.getByTestId("product-grid")).not.toBeNull();
                expect(screen.getByTestId("product-grid").textContent).toContain("Product 1");
            });
        });
    });

    describe("Query Invalidation After Mutations", () => {
        it("should invalidate and refetch product list after creating a product", async () => {
            const products = [
                { id: 1, name: "Product 1" },
                { id: 2, name: "Product 2" },
            ];

            const CreateProduct: FC = () => {
                const queryClient = useQueryClient();

                const { data: productList } = useQueryService({
                    serviceFn: () => Promise.resolve(products),
                    options: {
                        queryKey: ["products"],
                    },
                });

                const mutation = useMutationService({
                    serviceFn: (input: { name: string }) => {
                        const newProduct = { id: products.length + 1, name: input.name };
                        products.push(newProduct);
                        return Promise.resolve(newProduct);
                    },
                });

                const handleCreate = async () => {
                    await mutation.mutate({ name: "Product 3" });
                    queryClient.invalidateQueries({ queryKey: ["products"] });
                };

                return (
                    <div>
                        <div data-testid="product-list">
                            {productList?.map(p => (
                                <div key={p.id} data-testid={`product-${p.id}`}>
                                    {p.name}
                                </div>
                            ))}
                        </div>
                        <button data-testid="create-button" onClick={handleCreate} disabled={mutation.isPending}>
                            Create Product
                        </button>
                    </div>
                );
            };

            renderWithQueryClient(<CreateProduct />);

            // Wait for initial product list
            await waitFor(() => {
                expect(screen.getByTestId("product-list").children).toHaveLength(2);
            });

            // Create new product
            const createButton = screen.getByTestId("create-button");
            fireEvent.click(createButton);

            // Should show updated list after invalidation
            await waitFor(() => {
                expect(screen.getByTestId("product-list").children).toHaveLength(3);
            });

            expect(screen.getByTestId("product-3").textContent).toContain("Product 3");
        });
    });

    describe("Real-World Examples", () => {
        describe("User Profile Management with Optimistic Updates", () => {
            type UserProfileEditorProps = {
                userId: string;
            };

            const UserProfileEditor: FC<UserProfileEditorProps> = ({ userId }) => {
                const queryClient = useQueryClient();
                const [isEditing, setIsEditing] = useState(false);
                const [formData, setFormData] = useState({ name: "", email: "" });

                const {
                    data: profile,
                    isPending,
                    isError,
                } = useQueryService({
                    serviceFn: () =>
                        Promise.resolve({
                            userId,
                            name: "John Doe",
                            email: "john@example.com",
                        }),
                    options: {
                        queryKey: ["users", userId, "profile"],
                    },
                });

                const updateMutation = useMutationService({
                    serviceFn: (data: { userId: string; name: string; email: string }) =>
                        Promise.resolve({
                            ...data,
                            updatedAt: new Date().toISOString(),
                        }),
                });

                useEffect(() => {
                    if (profile) {
                        setFormData({ name: profile.name, email: profile.email });
                    }
                }, [profile]);

                const handleSave = async () => {
                    await updateMutation.mutate({ userId, ...formData });
                    queryClient.invalidateQueries({ queryKey: ["users", userId, "profile"] });
                    setIsEditing(false);
                };

                if (isPending) return <div data-testid="loading">Loading...</div>;
                if (isError) return <div data-testid="error">Error loading profile</div>;

                return (
                    <div data-testid="profile-editor">
                        {isEditing ? (
                            <div>
                                <input
                                    data-testid="name-input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                                <input
                                    data-testid="email-input"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                                <button data-testid="save-button" onClick={handleSave} disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? "Saving..." : "Save"}
                                </button>
                                <button data-testid="cancel-button" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div data-testid="profile-name">{profile.name}</div>
                                <div data-testid="profile-email">{profile.email}</div>
                                <button data-testid="edit-button" onClick={() => setIsEditing(true)}>
                                    Edit
                                </button>
                            </div>
                        )}
                        {updateMutation.isSuccess && <div data-testid="success-message">Profile updated!</div>}
                    </div>
                );
            };

            it("should handle full profile edit workflow", async () => {
                renderWithQueryClient(<UserProfileEditor userId="user123" />);

                // Wait for profile to load
                await waitFor(() => {
                    expect(screen.getByTestId("profile-name").textContent).toContain("John Doe");
                });

                // Click edit
                const editButton = screen.getByTestId("edit-button");
                fireEvent.click(editButton);

                // Should show form
                expect((screen.getByTestId("name-input") as HTMLInputElement).value).toBe("John Doe");

                // Edit name
                const nameInput = screen.getByTestId("name-input");
                fireEvent.change(nameInput, { target: { value: "Jane Doe" } });

                // Save
                const saveButton = screen.getByTestId("save-button");
                fireEvent.click(saveButton);

                // Should show success message
                await waitFor(() => {
                    expect(screen.getByTestId("success-message")).not.toBeNull();
                });

                // Should exit edit mode
                expect(screen.queryByTestId("name-input")).toBeNull();
            });
        });

        describe("Search with Debouncing and Conditional Execution", () => {
            // Simple debounce hook for testing
            const useDebounce = <T,>(value: T, delay: number): T => {
                const [debouncedValue, setDebouncedValue] = useState(value);

                useEffect(() => {
                    const handler = setTimeout(() => {
                        setDebouncedValue(value);
                    }, delay);

                    return () => {
                        clearTimeout(handler);
                    };
                }, [value, delay]);

                return debouncedValue;
            };

            const ProductSearch: FC = () => {
                const [searchTerm, setSearchTerm] = useState("");
                const debouncedSearchTerm = useDebounce(searchTerm, 300);

                const {
                    data: results,
                    isPending,
                    isError,
                    isEnabled,
                } = useQueryService({
                    serviceFn: (args: { query: string }) =>
                        Promise.resolve([
                            { id: 1, name: `Product matching ${args.query}` },
                            { id: 2, name: `Another ${args.query} product` },
                        ]),
                    serviceFnArgs: { query: debouncedSearchTerm },
                    options: {
                        enabled: debouncedSearchTerm.length >= 3,
                        queryKey: ["products", "search", debouncedSearchTerm],
                    },
                });

                return (
                    <div>
                        <input
                            data-testid="search-input"
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search products..."
                        />

                        {searchTerm.length > 0 && searchTerm.length < 3 && <div data-testid="hint">Type at least 3 characters to search</div>}

                        {isEnabled && isPending && <div data-testid="loading">Loading...</div>}

                        {isError && <div data-testid="error">Error occurred</div>}

                        {results && results.length === 0 && <div data-testid="empty-state">No products found for "{debouncedSearchTerm}"</div>}

                        {results && results.length > 0 && (
                            <div data-testid="search-results">
                                {results.map(result => (
                                    <div key={result.id} data-testid={`result-${result.id}`}>
                                        {result.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            };

            it("should only search when at least 3 characters are entered", async () => {
                const mockServiceFn = jest.fn().mockResolvedValue([{ id: 1, name: "Product matching test" }]);

                renderWithQueryClient(<ProductSearch />);

                const searchInput = screen.getByTestId("search-input");

                // Type 2 characters
                fireEvent.change(searchInput, { target: { value: "te" } });

                // Should show hint
                await waitFor(() => {
                    expect(screen.getByTestId("hint")).not.toBeNull();
                });

                // Should not have searched yet
                expect(mockServiceFn).not.toHaveBeenCalled();

                // Type 3rd character
                fireEvent.change(searchInput, { target: { value: "tes" } });

                // Wait for debounce + query
                await waitFor(
                    () => {
                        expect(screen.queryByTestId("hint")).toBeNull();
                    },
                    { timeout: 500 }
                );

                // Should eventually show results
                await waitFor(
                    () => {
                        expect(screen.getByTestId("search-results")).not.toBeNull();
                    },
                    { timeout: 1000 }
                );
            });

            it("should debounce search requests", async () => {
                jest.useFakeTimers();

                type Product = { id: number; name: string };
                const mockServiceFn = jest.fn<Promise<Product[]>, [{ query: string }]>().mockResolvedValue([{ id: 1, name: "Product" }]);

                const ProductSearchWithMock: FC = () => {
                    const [searchTerm, setSearchTerm] = useState("");
                    const debouncedSearchTerm = useDebounce(searchTerm, 300);

                    const { data } = useQueryService({
                        serviceFn: mockServiceFn,
                        serviceFnArgs: { query: debouncedSearchTerm },
                        options: {
                            enabled: debouncedSearchTerm.length >= 3,
                            queryKey: ["products", "search", debouncedSearchTerm],
                        },
                    });

                    return (
                        <div>
                            <input data-testid="search-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            {data && <div data-testid="results">Found {data.length} products</div>}
                        </div>
                    );
                };

                renderWithQueryClient(<ProductSearchWithMock />);

                const searchInput = screen.getByTestId("search-input");

                // Type quickly
                fireEvent.change(searchInput, { target: { value: "t" } });
                fireEvent.change(searchInput, { target: { value: "te" } });
                fireEvent.change(searchInput, { target: { value: "tes" } });
                fireEvent.change(searchInput, { target: { value: "test" } });

                // Should not have called service yet
                expect(mockServiceFn).not.toHaveBeenCalled();

                // Fast-forward past debounce delay
                jest.advanceTimersByTime(300);

                // Should only call once after debounce
                await waitFor(() => {
                    expect(mockServiceFn).toHaveBeenCalledTimes(1);
                });

                expect(mockServiceFn).toHaveBeenCalledWith({ query: "test" });

                jest.useRealTimers();
            });
        });

        describe("Multi-Step Form with Mutation Chaining", () => {
            type CheckoutWizardProps = {
                cartItems: { id: number; name: string }[];
            };

            const CheckoutWizard: FC<CheckoutWizardProps> = ({ cartItems }) => {
                const queryClient = useQueryClient();
                const [step, setStep] = useState(1);
                const [orderId, setOrderId] = useState<string | null>(null);

                const createOrderMutation = useMutationService({
                    serviceFn: (input: { items: any[]; shipping: any }) =>
                        Promise.resolve({
                            id: "order-123",
                            ...input,
                        }),
                });

                const processPaymentMutation = useMutationService({
                    serviceFn: (input: { orderId: string; payment: any }) =>
                        Promise.resolve({
                            success: true,
                            ...input,
                        }),
                });

                const handlePlaceOrder = async (shippingInfo: any) => {
                    const order = await createOrderMutation.mutate({
                        items: cartItems,
                        shipping: shippingInfo,
                    });
                    setOrderId(order.id);
                    setStep(2);
                };

                const handlePayment = async (paymentInfo: any) => {
                    await processPaymentMutation.mutate({
                        orderId: orderId!,
                        payment: paymentInfo,
                    });
                    setStep(3);
                    queryClient.invalidateQueries({ queryKey: ["cart"] });
                };

                return (
                    <div data-testid="checkout-wizard">
                        {step === 1 && (
                            <div data-testid="shipping-step">
                                <button
                                    data-testid="place-order-button"
                                    onClick={() => handlePlaceOrder({ address: "123 Main St" })}
                                    disabled={createOrderMutation.isPending}
                                >
                                    Place Order
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div data-testid="payment-step">
                                <div data-testid="order-id">Order: {orderId}</div>
                                <button
                                    data-testid="pay-button"
                                    onClick={() => handlePayment({ cardNumber: "1234" })}
                                    disabled={processPaymentMutation.isPending}
                                >
                                    Pay Now
                                </button>
                            </div>
                        )}

                        {step === 3 && (
                            <div data-testid="confirmation-step">
                                <div data-testid="confirmation-message">Order {orderId} confirmed!</div>
                            </div>
                        )}
                    </div>
                );
            };

            it("should complete multi-step checkout process", async () => {
                const cartItems = [{ id: 1, name: "Product 1" }];

                renderWithQueryClient(<CheckoutWizard cartItems={cartItems} />);

                // Step 1: Place order
                expect(screen.getByTestId("shipping-step")).not.toBeNull();
                const placeOrderButton = screen.getByTestId("place-order-button");
                fireEvent.click(placeOrderButton);

                // Step 2: Payment
                await waitFor(() => {
                    expect(screen.getByTestId("payment-step")).not.toBeNull();
                });

                expect(screen.getByTestId("order-id").textContent).toContain("Order: order-123");

                const payButton = screen.getByTestId("pay-button");
                fireEvent.click(payButton);

                // Step 3: Confirmation
                await waitFor(() => {
                    expect(screen.getByTestId("confirmation-step")).not.toBeNull();
                });

                expect(screen.getByTestId("confirmation-message").textContent).toContain("Order order-123 confirmed!");
            });
        });

        describe("Dashboard with Multiple Queries", () => {
            const Dashboard: FC = () => {
                const statsQuery = useQueryService({
                    serviceFn: () =>
                        Promise.resolve({
                            revenue: 10000,
                            orders: 150,
                            customers: 75,
                        }),
                    options: {
                        queryKey: ["dashboard", "stats"],
                    },
                });

                const ordersQuery = useQueryService({
                    serviceFn: () =>
                        Promise.resolve([
                            { id: 1, total: 99.99 },
                            { id: 2, total: 149.99 },
                        ]),
                    options: {
                        queryKey: ["dashboard", "recentOrders"],
                    },
                });

                const productsQuery = useQueryService({
                    serviceFn: () =>
                        Promise.resolve([
                            { id: 1, name: "Product A", sales: 50 },
                            { id: 2, name: "Product B", sales: 30 },
                        ]),
                    options: {
                        queryKey: ["dashboard", "topProducts"],
                    },
                });

                return (
                    <div data-testid="dashboard">
                        {statsQuery.isPending ? (
                            <div data-testid="stats-loading">Loading stats...</div>
                        ) : statsQuery.isError ? (
                            <div data-testid="stats-error">Error loading stats</div>
                        ) : (
                            <div data-testid="stats-panel">
                                <div data-testid="revenue">Revenue: {statsQuery.data.revenue}</div>
                                <div data-testid="orders">Orders: {statsQuery.data.orders}</div>
                            </div>
                        )}

                        {ordersQuery.isRefetchError && <div data-testid="orders-warning">Failed to refresh orders. Showing cached data.</div>}
                        {ordersQuery.data && <div data-testid="orders-panel">Orders: {ordersQuery.data.length}</div>}

                        {productsQuery.data && <div data-testid="products-panel">Products: {productsQuery.data.length}</div>}
                    </div>
                );
            };

            it("should load all dashboard panels independently", async () => {
                renderWithQueryClient(<Dashboard />);

                // Should show stats loading first
                expect(screen.getByTestId("stats-loading")).not.toBeNull();

                // All panels should eventually load
                await waitFor(() => {
                    expect(screen.getByTestId("stats-panel")).not.toBeNull();
                    expect(screen.getByTestId("orders-panel")).not.toBeNull();
                    expect(screen.getByTestId("products-panel")).not.toBeNull();
                });

                expect(screen.getByTestId("revenue").textContent).toContain("Revenue: 10000");
                expect(screen.getByTestId("orders-panel").textContent).toContain("Orders: 2");
                expect(screen.getByTestId("products-panel").textContent).toContain("Products: 2");
            });
        });
    });
});
