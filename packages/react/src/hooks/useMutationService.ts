import { useContext, useMemo } from "react";
import { type MutationKey, QueryClient, QueryClientContext, useMutation } from "@tanstack/react-query";
import { createMutationKey } from "../utils/keyFactory";
import { type ServiceFunction } from "../utils/ServiceFunction";

/**
 * Result type aligned with TanStack Query's mutation discriminated union pattern.
 * Enables proper type narrowing when destructuring: `const { data, isPending, isError, isSuccess, error } = useMutationService(...)`
 *
 * States:
 * - Idle: Mutation hasn't been triggered yet
 * - Pending: Mutation is in progress
 * - Error: Mutation failed
 * - Success: Mutation succeeded
 *
 * Type narrowing examples:
 * - `if (isSuccess)` → data is TData
 * - `if (isPending)` → data is undefined
 * - `if (isError)` → error is TError (not null)
 * - `if (isIdle)` → mutation hasn't been called yet
 */
export type MagellanMutationResult<TInput, TData, TError = Error> =
    | MagellanMutationIdleResult<TInput, TData, TError>
    | MagellanMutationPendingResult<TInput, TData, TError>
    | MagellanMutationErrorResult<TInput, TData, TError>
    | MagellanMutationSuccessResult<TInput, TData, TError>;

/**
 * Mutation is idle (hasn't been triggered yet)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type MagellanMutationIdleResult<TInput, TData, TError> = {
    data: undefined;
    error: null;
    isError: false;
    isPending: false;
    isIdle: true;
    isSuccess: false;
    status: "idle";
    mutate: (input: TInput) => Promise<TData>;
};

/**
 * Mutation is in progress (pending)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type MagellanMutationPendingResult<TInput, TData, TError> = {
    data: undefined;
    error: null;
    isError: false;
    isPending: true;
    isIdle: false;
    isSuccess: false;
    status: "pending";
    mutate: (input: TInput) => Promise<TData>;
};

/**
 * Mutation failed with an error
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type MagellanMutationErrorResult<TInput, TData, TError> = {
    data: undefined;
    error: TError;
    isError: true;
    isPending: false;
    isIdle: false;
    isSuccess: false;
    status: "error";
    mutate: (input: TInput) => Promise<TData>;
};

/**
 * Mutation succeeded
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type MagellanMutationSuccessResult<TInput, TData, TError> = {
    data: TData;
    error: null;
    isError: false;
    isPending: false;
    isIdle: false;
    isSuccess: true;
    status: "success";
    mutate: (input: TInput) => Promise<TData>;
};

// type helper to extract the resolved value from a Promise, removing undefined
type UnwrapPromise<T> = T extends Promise<infer U> ? NonNullable<U> : never;

export type UseMutationServiceProps<TFn extends ServiceFunction> = {
    serviceFn: TFn;
    options?: {
        mutationKey?: MutationKey;
        queryClient?: QueryClient;
    };
};

/**
 * `useMutationService` is a hook for managing calls to magellan functions using react-query mutations.
 *
 * @template TFn - The service function type
 * @template TError - The error type (defaults to Error)
 * @param serviceFn - The magellan function to call.
 * @param options - Further options to configure the underlying useMutation functionality.
 * @param options.mutationKey - The mutation key to use for the mutation (optional, defaults to function name if possible).
 * @param options.queryClient - A custom QueryClient instance to use (optional). Priority: parameter > provider > default.
 * @returns Mutation result with proper type narrowing. Use `isSuccess`, `isPending`, `isError`, or `isIdle` to narrow types.
 *
 * @example
 * // Basic usage
 * const { mutate, data, isPending, isError } = useMutationService({
 *   serviceFn: createUser
 * });
 *
 * @example
 * // Type narrowing with isSuccess
 * if (isSuccess) {
 *   console.log(data); // data is User (not undefined)
 * }
 *
 * @example
 * // With custom QueryClient
 * const queryClient = new QueryClient({ defaultOptions: { ... } });
 * const { mutate } = useMutationService({
 *   serviceFn: createUser,
 *   options: { queryClient }
 * });
 *
 * @example
 * // With custom error type
 * const { error } = useMutationService<typeof createUser, ApiError>({
 *   serviceFn: createUser
 * });
 */
export const useMutationService = <TFn extends ServiceFunction, TError = Error>({
    serviceFn,
    options,
}: UseMutationServiceProps<TFn>): MagellanMutationResult<Parameters<TFn>[0], UnwrapPromise<ReturnType<TFn>>, TError> => {
    type TInput = Parameters<TFn>[0];
    type TData = UnwrapPromise<ReturnType<TFn>>;

    const mutationKey = options?.mutationKey;

    const providerQueryClient = useContext(QueryClientContext);

    const defaultQueryClient = useMemo(
        () =>
            new QueryClient({
                defaultOptions: {
                    mutations: {
                        gcTime: 1000 * 60 * 10, // 10 minutes
                        retry: 0, // mutations should not retry by default (side effects)
                    },
                },
            }),
        []
    );

    // Priority: options.queryClient > providerQueryClient > defaultQueryClient
    const queryClient = options?.queryClient ?? providerQueryClient ?? defaultQueryClient;

    const mutation = useMutation<TData, TError, TInput, MutationKey>(
        {
            mutationKey: mutationKey ?? createMutationKey(serviceFn),
            mutationFn:
                /* We omit complex mock implementation for useMutation so mutationFn is never called in unit tests */
                /* istanbul ignore next */
                async (input: TInput) => {
                    const result = await serviceFn(input);
                    // NOTE: return explicit `null` for empty results, because react-query does not support `undefined`
                    return (result ?? null) as TData;
                },
        },
        queryClient
    );

    // Map TanStack Mutation states to Magellan states
    // Status can be: 'idle', 'pending', 'error', 'success'

    // PENDING STATE: Mutation is in progress
    if (mutation.isPending) {
        return {
            data: undefined,
            error: null,
            isError: false,
            isPending: true,
            isIdle: false,
            isSuccess: false,
            status: "pending",
            mutate: mutation.mutateAsync,
        };
    }

    // ERROR STATE: Mutation failed
    if (mutation.isError) {
        return {
            data: undefined,
            error: ensureErrorType<TError>(mutation.error),
            isError: true,
            isPending: false,
            isIdle: false,
            isSuccess: false,
            status: "error",
            mutate: mutation.mutateAsync,
        };
    }

    // SUCCESS STATE: Mutation succeeded
    if (mutation.isSuccess) {
        return {
            data: mutation.data,
            error: null,
            isError: false,
            isPending: false,
            isIdle: false,
            isSuccess: true,
            status: "success",
            mutate: mutation.mutateAsync,
        };
    }

    // IDLE STATE: Mutation hasn't been triggered yet
    return {
        data: undefined,
        error: null,
        isError: false,
        isPending: false,
        isIdle: true,
        isSuccess: false,
        status: "idle",
        mutate: mutation.mutateAsync,
    };
};

const ensureErrorType = <TError>(error: unknown): TError => {
    // If the error is already of the expected type, return it
    // For the default Error type, check instanceof Error
    if (error instanceof Error) {
        return error as TError;
    }

    // If TError is Error and error is not an Error instance, wrap it
    const errorMessage = typeof error === "object" && error !== null && "message" in error ? String(error.message) : String(error);

    return new Error(errorMessage) as TError;
};
