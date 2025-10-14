import { type MutationKey, useMutation } from "@tanstack/react-query";
import { type Context, type Serialization } from "@quatico/magellan-shared";

/**
 * A discriminated union to ensure that the consumer can destructure the result and type narrowing still works
 * e.g. when doing `const { data, isLoading, isError, isSuccess, error } = useMutationService(...)`
 * then data is not "possibly undefined" when we've already checked that
 * isSuccess is true and/or isLoading and isError are false.
 */
export type MagellanMutationResult<TInput, TData> =
    | {
          isLoading: true;
          isError: false;
          isSuccess: false;
          data: undefined;
          error: null;
          mutate: (input: TInput) => Promise<TData>;
      }
    | {
          isLoading: false;
          isError: true;
          isSuccess: false;
          data: undefined;
          error: Error;
          mutate: (input: TInput) => Promise<TData>;
      }
    | {
          isLoading: false;
          isError: false;
          isSuccess: true;
          data: TData;
          error: null;
          mutate: (input: TInput) => Promise<TData>;
      }
    | {
          isLoading: false;
          isError: false;
          isSuccess: false;
          data: undefined;
          error: null;
          mutate: (input: TInput) => Promise<TData>;
      };

// type helper to extract the resolved value from a Promise, removing undefined
type UnwrapPromise<T> = T extends Promise<infer U> ? NonNullable<U> : never;

/**
 * `useMutationService` is a hook for managing calls to magellan functions using react-query mutations.
 *
 * @param mutationKey - The mutation key to use for the mutation.
 * @param serviceFn - The magellan function to call.
 * @returns Mutation result where `data` is guaranteed to be defined when `isError` and `isLoading` are false.
 */
export function useMutationService<TFn extends (input: never, _context?: Context, _serialization?: Serialization) => Promise<unknown>>({
    mutationKey,
    serviceFn,
}: {
    mutationKey: MutationKey;
    serviceFn: TFn;
}): MagellanMutationResult<Parameters<TFn>[0], UnwrapPromise<ReturnType<TFn>>> {
    type TInput = Parameters<TFn>[0];
    type TData = UnwrapPromise<ReturnType<TFn>>;

    const mutation = useMutation<TData, Error, TInput, MutationKey>({
        mutationKey,
        mutationFn:
            /* We omit complex mock implementation for useMutation so mutationFn is never called in unit tests */
            /* istanbul ignore next */
            async (input: TInput) => {
                const result = await serviceFn(input);
                // NOTE: return explicit `null` for empty results, because react-query does not support `undefined`
                return (result ?? null) as TData;
            },
    });

    if (mutation.isPending) {
        return {
            isLoading: true,
            isError: false,
            isSuccess: false,
            data: undefined,
            error: null,
            mutate: mutation.mutateAsync,
        };
    }

    if (mutation.isError) {
        return {
            isLoading: false,
            isError: true,
            isSuccess: false,
            data: undefined,
            error: ensureErrorType(mutation.error),
            mutate: mutation.mutateAsync,
        };
    }

    if (mutation.isSuccess) {
        return {
            isLoading: false,
            isError: false,
            isSuccess: true,
            data: mutation.data,
            error: null,
            mutate: mutation.mutateAsync,
        };
    }

    return {
        isLoading: false,
        isError: false,
        isSuccess: false,
        data: undefined,
        error: null,
        mutate: mutation.mutateAsync,
    };
}

const ensureErrorType = (error: unknown): Error => {
    if (error instanceof Error) {
        return error;
    }

    const errorMessage = typeof error === "object" && error !== null && "message" in error ? String(error.message) : String(error);

    return new Error(errorMessage);
};
