/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { unpackPayload } from "@quatico/magellan-shared";
import { writeFileSync } from "fs";
import { join } from "path";
import request from "supertest";
import { Sdk } from "./sdk";
import { handleError, normalizePort, serve, setupApp } from "./server";

beforeAll(() => {
    function formDataMock() {
        // @ts-ignore
        this.append = jest.fn();
    }
    // @ts-ignore
    global.FormData = formDataMock;
});

describe("serve", () => {
    it("sets port in Express app", () => {
        const target = {
            app: { get: jest.fn(), set: jest.fn(), use: jest.fn() },
            server: { listen: jest.fn() } as any,
            requireFn: jest.fn().mockReturnValue({}) as any,
        } as any;

        serve(target);

        expect(target.app.set).toHaveBeenCalledWith("port", expect.any(Number));
    });

    it("sets static resources dir in Express app", () => {
        const target = {
            app: { get: jest.fn(), set: jest.fn(), use: jest.fn() },
            server: { listen: jest.fn() } as any,
            requireFn: jest.fn().mockReturnValue({}) as any,
        } as any;

        serve(target);

        expect(target.app.use).toHaveBeenCalledWith("/", expect.any(Function));
    });

    it("calls listen passing port on server", () => {
        const target = { listen: jest.fn() } as any;

        serve({ app: { get: jest.fn(), set: jest.fn(), use: jest.fn() }, server: target, requireFn: jest.fn().mockReturnValue({}) as any } as any);

        expect(target.listen).toHaveBeenCalledWith(3000, expect.any(Function));
    });
});

describe("setupApp", () => {
    it("calls use passing static and function route", () => {
        const target = { get: jest.fn(), set: jest.fn(), use: jest.fn() } as any;

        setupApp({ app: target, port: 3000, staticDir: "./resources", serverModuleDir: "./functions" });

        expect(target.use).toHaveBeenCalledWith("/", expect.any(Function));
        expect(target.use).toHaveBeenCalledWith("/api", expect.any(Function));
    });

    it("responds to /api with registered function", async () => {
        const app = setupApp({
            requireFn: jest.fn().mockReturnValue({}) as any,
            sdk: new Sdk().registerFunction("expected", jest.fn().mockReturnValue("Expected result")),
        });

        const res = await request(app)
            .post("/api")
            .field("name", "expected")
            .field("data", JSON.stringify({ input: "expected" }))
            .set("Accept-Header", "application/json");

        expect(res.header["content-type"]).toBe("application/json; charset=utf-8");
        expect(res.statusCode).toBe(200);
        expect(unpackPayload(res.body)).toEqual("Expected result");
    });

    it("responds with index page w/ get to /", async () => {
        const staticDir = "./data";
        const expected = "<html><body>expected html</body></html>";
        writeFileSync(join(staticDir, "index.html"), expected);
        const app = setupApp({
            staticDir,
            requireFn: jest.fn().mockReturnValue({}) as any,
            sdk: new Sdk().registerFunction("expected", jest.fn().mockReturnValue("Expected result")),
        });

        const res = await request(app).get("/");

        expect(res.header["content-type"]).toBe("text/html; charset=UTF-8");
        expect(res.statusCode).toBe(200);
        expect(res.text).toEqual(expected);
    });

    it("redirects to index page w/ get to non-existing wildcard route", async () => {
        const staticDir = "./data";
        const expected = "<html><body>expected html</body></html>";
        writeFileSync(join(staticDir, "index.html"), expected);
        const app = setupApp({
            staticDir,
            requireFn: jest.fn().mockReturnValue({}) as any,
            sdk: new Sdk().registerFunction("expected", jest.fn().mockReturnValue("Expected result")),
        });

        const res = await request(app).get("/unexpected/non-existant");

        expect(res.header["content-type"]).toBe("text/html; charset=UTF-8");
        expect(res.statusCode).toBe(301);
        expect(res.text).toBe(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Redirecting</title>
</head>
<body>
<pre>Redirecting to <a href="/unexpected/non-existant/">/unexpected/non-existant/</a></pre>
</body>
</html>
`);
    });

    it("responds with status 404 w/ post to /", async () => {
        const app = setupApp({
            requireFn: jest.fn().mockReturnValue({}) as any,
            sdk: new Sdk().registerFunction("expected", jest.fn().mockReturnValue("Expected result")),
        });

        const res = await request(app).post("/");

        expect(res.header["content-type"]).toBe("text/html; charset=utf-8");
        expect(res.statusCode).toBe(404);
    });
});

describe("handleError", () => {
    it("yields error message with error", () => {
        const target = { locals: {}, status: jest.fn(), render: jest.fn() } as any;

        handleError(new Error("expected message"), { app: { get: jest.fn() } } as any, target, () => undefined);

        expect(target.locals.message).toBe("expected message");
    });

    it("yields error details with error in development mode", () => {
        const target = { locals: {}, status: jest.fn(), render: jest.fn() } as any;

        handleError(new Error("expected message"), { app: { get: jest.fn().mockReturnValue("development") } } as any, target, () => undefined);

        expect(target.locals.error.toString()).toBe("Error: expected message");
    });

    it("calls status passing error status with error status", () => {
        const target = { locals: {}, status: jest.fn(), render: jest.fn() } as any;

        handleError({ message: "expected message", status: 404 }, { app: { get: jest.fn() } } as any, target, () => undefined);

        expect(target.status).toHaveBeenCalledWith(404);
    });

    it("calls status passing default status w/o error status", () => {
        const target = { locals: {}, status: jest.fn(), render: jest.fn() } as any;

        handleError({ message: "expected message" }, { app: { get: jest.fn() } } as any, target, () => undefined);

        expect(target.status).toHaveBeenCalledWith(500);
    });

    it("calls render passing reasonable text", () => {
        const target = { locals: {}, status: jest.fn(), render: jest.fn() } as any;

        handleError({ message: "expected message" }, { app: { get: jest.fn() } } as any, target, () => undefined);

        expect(target.render).toHaveBeenCalledWith('Could not handle request. Reason: "expected message".');
    });
});

describe("normalizePort", () => {
    it("returns a number w/ number string", () => {
        expect(normalizePort("6000")).toBe(6000);
    });

    it("returns default number w/o value", () => {
        expect(normalizePort()).toBe(3000);
    });

    it("returns default number w/ invalid string", () => {
        expect(normalizePort("invalid-number")).toBe(3000);
    });

    it("returns default number with boolean string", () => {
        expect(normalizePort("false")).toBe(3000);
    });
});
