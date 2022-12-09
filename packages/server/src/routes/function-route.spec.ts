/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { unpackPayload } from "@quatico/magellan-shared";
import express, { Express } from "express";
import multer from "multer";
import request from "supertest";
import { Sdk } from "../sdk";
import { initDependencyContext } from "../services";
import { createFunctionRoute } from "./function-route";

beforeAll(() => {
    function formDataMock() {
        return { append: jest.fn() };
    }

    // @ts-ignore access custom global object
    global.FormData = formDataMock;
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
            message: 'Function request to "expected" failed.',
            error: "expected error message",
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
        expect(payload.error).toEqual({ message: 'Function request to "expected" failed.' });
        expect(res.statusCode).toBe(200);
    });

    // TODO: This assumption no longer holds until a full function registration with name and namespace becomes available across frontend, node and java
    //          both for manually and automatically registered functions!
    it.skip("responds to /api with unknown function", async () => {
        app.use("/api", createFunctionRoute(new Sdk()));

        const res = await request(app)
            .post("/api")
            .set("Accept", "application/json")
            .field("name", "unknown")
            .field("data", JSON.stringify({ input: "whatever" }));

        expect(res.header["content-type"]).toBe("application/json; charset=utf-8");
        expect(res.statusCode).toBe(500);
        const { error, message } = unpackPayload(res.body) as { error: string; message: string };
        expect(message).toBe('Function request to "unknown" failed.');
        expect(error.toString()).toBe('Cannot invoke function "unknown". Function is not registered.');
        expect(res.error.toString()).toBe("Error: cannot POST /api (500)");
    });
});
