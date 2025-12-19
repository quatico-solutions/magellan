/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { unpackPayload } from "@quatico/magellan-shared";
import express, { type Express } from "express";
import multer from "multer";
import path from "path";
import request from "supertest";
import { Sdk } from "../sdk";
import { initDependencyContext } from "../services";
import { createFunctionRoute } from "./function-route";

beforeAll(() => {
    class FormData {
        append = jest.fn();
        set = jest.fn();
        entries = jest.fn();
        get = jest.fn();
        getAll = jest.fn();
        has = jest.fn();
        setAll = jest.fn();
        delete = jest.fn();
        forEach = jest.fn();
        keys = jest.fn();
        values = jest.fn();
        [Symbol.iterator] = jest.fn();
        [Symbol.toStringTag] = "FormData";
    }

    globalThis.FormData = FormData;
    initDependencyContext({ defaultTransportRequest: jest.fn(), defaultTransportHandler: jest.fn() });
});

describe("createStaticRoute", () => {
    let app: Express;
    beforeEach(() => {
        app = express();
        app.use(multer().any());
    });

    it("responds to /api with registered function", async () => {
        const targetFn = jest.fn().mockReturnValue("Hello World!");
        app.use("/api", createFunctionRoute(new Sdk().registerFunction("target", targetFn)));

        const res = await request(app)
            .post("/api")
            .set("Accept", "application/json")
            .field("name", "target")
            .field("data", JSON.stringify("whatever")); // Client passes parameters directly (unwrapped)

        expect(res.header["content-type"]).toBe("application/json; charset=utf-8");
        expect(unpackPayload(res.body).data).toBe("Hello World!");
        expect(res.statusCode).toBe(200);

        // Verify the function received unwrapped parameter value "whatever"
        // Client and server both use unwrapped parameters (natural signatures)
        expect(targetFn).toHaveBeenCalledWith("whatever", { server: { "x-request-id": "" } });
    });

    it("responds to /api with registered function that throws error and includes error field in non-production", async () => {
        process.env.NODE_ENV = "development";

        app.use(
            "/api",
            createFunctionRoute(
                new Sdk().registerFunction(
                    "expected",
                    jest.fn().mockImplementation(() => {
                        throw new Error("expected error message");
                    })
                )
            )
        );

        const res = await request(app)
            .post("/api")
            .set("Accept", "application/json")
            .field("name", "expected")
            .field("data", JSON.stringify({ input: "whatever" }));

        expect(res.header["content-type"]).toBe("application/json; charset=utf-8");
        const payload = unpackPayload(res.body);
        expect(payload.error).toEqual({
            message: "expected error message",
            error: expect.stringContaining("Error: expected error message\n" + `    at ${path.join(__dirname, "function-route.spec.ts")}`),
        });
        expect(res.statusCode).toBe(200);
    });

    it("responds to /api with registered function that throws error and omits error field in production", async () => {
        app.use(
            "/api",
            createFunctionRoute(
                new Sdk().registerFunction(
                    "expected",
                    jest.fn().mockImplementation(() => {
                        throw new Error("expected error message");
                    })
                )
            )
        );
        process.env.NODE_ENV = "production";

        const res = await request(app)
            .post("/api")
            .set("Accept", "application/json")
            .field("name", "expected")
            .field("data", JSON.stringify({ input: "whatever" }));

        expect(res.header["content-type"]).toBe("application/json; charset=utf-8");
        const payload = unpackPayload(res.body);
        expect(payload.error).toEqual({ message: "expected error message" });
        expect(res.statusCode).toBe(200);
    });

    it("passes context and unwrapped parameters to service functions", async () => {
        const targetFn = jest.fn().mockImplementation((input, context) => {
            // Verify we receive the unwrapped input and proper context
            return { receivedInput: input, receivedContext: context };
        });

        app.use("/api", createFunctionRoute(new Sdk().registerFunction("testContextPropagation", targetFn)));

        const testInput = { orderNumber: "12345", customerId: "user-123" };
        const res = await request(app)
            .post("/api")
            .set("Accept", "application/json")
            .set("x-request-id", "test-request-id")
            .field("name", "testContextPropagation")
            .field("data", JSON.stringify(testInput)); // Client passes parameters directly (unwrapped)

        expect(res.statusCode).toBe(200);

        // Verify function was called with unwrapped input and context
        // Client and server both use unwrapped parameters (natural signatures)
        expect(targetFn).toHaveBeenCalledWith(testInput, {
            server: {
                "x-request-id": "test-request-id",
            },
        });

        const payload = unpackPayload(res.body);
        expect(payload.data).toEqual({
            receivedInput: testInput,
            receivedContext: { server: { "x-request-id": "test-request-id" } },
        });
    });

    describe("extractParameterValue edge cases", () => {
        it("should handle empty object (underscore parameter)", async () => {
            const mockFn = jest.fn().mockImplementation(input => {
                return { received: input };
            });

            app.use("/api", createFunctionRoute(new Sdk().registerFunction("noInput", mockFn)));

            const res = await request(app).post("/api").set("Accept", "application/json").field("name", "noInput").field("data", JSON.stringify({})); // Empty object for _ parameter

            expect(res.statusCode).toBe(200);

            // Empty object should be passed as-is
            expect(mockFn).toHaveBeenCalledWith({}, expect.objectContaining({ server: expect.any(Object) }));
        });

        it("should handle multiple properties in data object (backwards compatibility)", async () => {
            const mockFn = jest.fn().mockImplementation(input => {
                return { received: input };
            });

            app.use("/api", createFunctionRoute(new Sdk().registerFunction("multiProps", mockFn)));

            const multiPropData = { a: 1, b: 2, c: 3 };
            const res = await request(app)
                .post("/api")
                .set("Accept", "application/json")
                .field("name", "multiProps")
                .field("data", JSON.stringify(multiPropData)); // Multiple properties (direct SDK usage or backward compat)

            expect(res.statusCode).toBe(200);

            // Multi-property object should be passed as-is (backwards compatibility)
            expect(mockFn).toHaveBeenCalledWith(multiPropData, expect.objectContaining({ server: expect.any(Object) }));
        });

        it("should handle null data", async () => {
            const mockFn = jest.fn().mockImplementation(input => {
                return { received: input };
            });

            app.use("/api", createFunctionRoute(new Sdk().registerFunction("nullData", mockFn)));

            const res = await request(app).post("/api").set("Accept", "application/json").field("name", "nullData").field("data", "null"); // JSON null

            expect(res.statusCode).toBe(200);

            // Null should be passed as-is
            expect(mockFn).toHaveBeenCalledWith(null, expect.objectContaining({ server: expect.any(Object) }));
        });

        it("should handle primitive data", async () => {
            const mockFn = jest.fn().mockImplementation(input => {
                return { received: input };
            });

            app.use("/api", createFunctionRoute(new Sdk().registerFunction("primitiveData", mockFn)));

            const res = await request(app)
                .post("/api")
                .set("Accept", "application/json")
                .field("name", "primitiveData")
                .field("data", JSON.stringify("test-string")); // Primitive string

            expect(res.statusCode).toBe(200);

            // Primitive should be passed as-is
            expect(mockFn).toHaveBeenCalledWith("test-string", expect.objectContaining({ server: expect.any(Object) }));
        });

        it("should handle array data", async () => {
            const mockFn = jest.fn().mockImplementation(input => {
                return { received: input };
            });

            app.use("/api", createFunctionRoute(new Sdk().registerFunction("arrayData", mockFn)));

            const arrayData = [1, 2, 3];
            const res = await request(app)
                .post("/api")
                .set("Accept", "application/json")
                .field("name", "arrayData")
                .field("data", JSON.stringify(arrayData)); // Array

            expect(res.statusCode).toBe(200);

            // Array should be passed as-is
            expect(mockFn).toHaveBeenCalledWith(arrayData, expect.objectContaining({ server: expect.any(Object) }));
        });
    });
});
