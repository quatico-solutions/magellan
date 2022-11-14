/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import express from "express";
import fs from "fs";
import request from "supertest";
import { createStaticRoute } from "./static-route";

describe("createStaticRoute", () => {
    let app: express.Express;
    beforeEach(() => {
        app = express();
        app.use("/", createStaticRoute("./resources"));
    });

    it("responds to / with existing file", async () => {
        fs.writeFileSync("./resources/index.html", "Hello World!");

        const res = await request(app).get("/index.html");
        expect(res.header["content-type"]).toBe("text/html; charset=UTF-8");
        expect(res.statusCode).toBe(200);
        expect(res.text).toBe("Hello World!");
    });

    it("responds to / with non-existing file", async () => {
        const res = await request(app).get("/does-not-exists.html");

        expect(res.header["content-type"]).toBe("text/html; charset=utf-8");
        expect(res.statusCode).toBe(404);

        expect(res.text).toMatchInlineSnapshot(`
            "<!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="utf-8">
            <title>Error</title>
            </head>
            <body>
            <pre>Cannot GET /does-not-exists.html</pre>
            </body>
            </html>
            "
        `);
    });
});
