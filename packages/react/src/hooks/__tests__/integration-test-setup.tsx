/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import React, { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, RenderResult } from "@testing-library/react";

/**
 * General setup for React integration tests with React Query
 * This setup provides a QueryClient wrapper for testing hooks that depend on React Query
 */

export const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false, // Disable retries in tests
                gcTime: 0, // Disable garbage collection in tests
            },
            mutations: {
                retry: false, // Disable retries in tests
            },
        },
    });

export const renderWithQueryClient = (ui: ReactNode, queryClient = createTestQueryClient()): RenderResult => {
    return render(ui, {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    });
};

// Common test data
export const TEST_DATA = {
    user: { id: 1, name: "John Doe", email: "john@example.com" },
    users: [
        { id: 1, name: "John Doe", email: "john@example.com" },
        { id: 2, name: "Jane Smith", email: "jane@example.com" },
    ],
    post: { id: 1, title: "Test Post", content: "This is a test post" },
    posts: [
        { id: 1, title: "Test Post 1", content: "This is test post 1" },
        { id: 2, title: "Test Post 2", content: "This is test post 2" },
    ],
} as const;

// Common query keys
export const QUERY_KEYS = {
    users: ["users"] as const,
    user: (id: number) => ["users", id] as const,
    posts: ["posts"] as const,
    post: (id: number) => ["posts", id] as const,
} as const;
