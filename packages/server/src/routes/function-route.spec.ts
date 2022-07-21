/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import {unpackPayload} from "@quatico/magellan-shared";
import express, {Express} from "express";
import multer from "multer";
import request from "supertest";
import {Sdk} from "../sdk";
import {createFunctionRoute} from "./function-route";

beforeAll(() => {
    function formDataMock() {
        return {append: jest.fn()};
    }

    // @ts-ignore access custom global object
    global.FormData = formDataMock;
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
            .field("data", JSON.stringify({input: "whatever"}));

        expect(res.header["content-type"]).toBe("application/json; charset=utf-8");
        expect(unpackPayload(res.body)).toEqual("Hello World!");
        expect(res.statusCode).toBe(200);
    });

    it("responds to /api with registered function that throws error", async () => {
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
            .field("data", JSON.stringify({input: "whatever"}));

        expect(res.header["content-type"]).toBe("application/json; charset=utf-8");
        const {error, message} = unpackPayload(res.body) as { error: string; message: string };
        expect(message).toEqual('Function request to "expected" failed.');
        expect(error.toString()).toEqual("expected error message");
        expect(res.error.toString()).toEqual("Error: cannot POST /api (500)");
        expect(res.statusCode).toBe(500);
    });

    // TODO: This assumption no longer holds until a full function registration with name and namespace becomes available across frontend, node and java
    //          both for manually and automatically registered functions!
    it.skip("responds to /api with unknown function", async () => {
        app.use("/api", createFunctionRoute(new Sdk()));

        const res = await request(app)
            .post("/api")
            .set("Accept", "application/json")
            .field("name", "unknown")
            .field("data", JSON.stringify({input: "whatever"}));

        expect(res.header["content-type"]).toBe("application/json; charset=utf-8");
        expect(res.statusCode).toBe(500);
        const {error, message} = unpackPayload(res.body) as { error: string; message: string };
        expect(message).toEqual('Function request to "unknown" failed.');
        expect(error.toString()).toEqual('Cannot invoke function "unknown". Function is not registered.');
        expect(res.error.toString()).toEqual("Error: cannot POST /api (500)");
    });
});