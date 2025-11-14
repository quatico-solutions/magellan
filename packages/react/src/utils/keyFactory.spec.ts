/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { createQueryKey, createMutationKey } from "./keyFactory";

describe("keyFactory", () => {
    describe("createQueryKey", () => {
        it("should create a query key from a named function", () => {
            const getUserById = async (id: string) =>
                await Promise.resolve({
                    id,
                    name: "John",
                });
            const key = createQueryKey(getUserById);
            expect(key).toEqual(["getUserById"]);
        });

        it("should create a query key with additional parameters", () => {
            const getUserById = async (id: string) =>
                await Promise.resolve({
                    id,
                    name: "John",
                });
            const key = createQueryKey(getUserById, "123", { includeProfile: true });
            expect(key).toEqual(["getUserById", "123", { includeProfile: true }]);
        });

        it("should handle anonymous functions", () => {
            const anonymousFn = async (id: string) =>
                await Promise.resolve({
                    id,
                    name: "John",
                });
            const key = createQueryKey(anonymousFn);
            expect(key).toEqual(["anonymousFn"]);
        });

        it("should return undefined for anonymous functions", () => {
            const key = createQueryKey(
                async (id: string) =>
                    await Promise.resolve({
                        id,
                        name: "John",
                    })
            );
            expect(key).toBeUndefined();
        });

        it("should handle arrow functions with names", () => {
            const getUserProfile = async (id: string) =>
                await Promise.resolve({
                    id,
                    profile: {},
                });
            const key = createQueryKey(getUserProfile);
            expect(key).toEqual(["getUserProfile"]);
        });
    });

    describe("createMutationKey", () => {
        it("should create a mutation key from a named function", () => {
            const createUser = async (userData: any) =>
                await Promise.resolve({
                    id: "123",
                    ...userData,
                });
            const key = createMutationKey(createUser);
            expect(key).toEqual(["createUser"]);
        });

        it("should create a mutation key with additional parameters", () => {
            const createUser = async (userData: any) =>
                await Promise.resolve({
                    id: "123",
                    ...userData,
                });
            const key = createMutationKey(createUser, { type: "admin" });
            expect(key).toEqual(["createUser", { type: "admin" }]);
        });

        it("should handle anonymous functions", () => {
            const anonymousFn = async (data: any) =>
                await Promise.resolve({
                    id: "123",
                    ...data,
                });
            const key = createMutationKey(anonymousFn);
            expect(key).toEqual(["anonymousFn"]);
        });

        it("should return undefined for anonymous functions", () => {
            const key = createMutationKey(
                async (data: any) =>
                    await Promise.resolve({
                        id: "123",
                        ...data,
                    })
            );
            expect(key).toBeUndefined();
        });
    });
});
