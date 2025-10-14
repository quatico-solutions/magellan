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
        app.use("/api", createFunctionRoute(new Sdk().registerFunction("expected", jest.fn().mockReturnValue("Hello World!"))));

        const res = await request(app)
            .post("/api")
            .set("Accept", "application/json")
            .field("name", "expected")
            .field("data", JSON.stringify({ input: "whatever" }));

        expect(res.header["content-type"]).toBe("application/json; charset=utf-8");
        expect(unpackPayload(res.body).data).toBe("Hello World!");
        expect(res.statusCode).toBe(200);
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
});
