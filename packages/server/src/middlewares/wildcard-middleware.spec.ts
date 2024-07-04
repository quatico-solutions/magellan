/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
/* eslint-disable jest/no-done-callback */
import { writeFileSync } from "fs";
import { resolve } from "path";
import { wildcardMiddleware } from "./wildcard-middleware";

describe("wildcardMiddleware", () => {
    const staticDir = resolve("data");
    it("should rewrite the request url w/ url not matching a static file", done => {
        const target = { url: "/expected", baseUrl: "/" };

        wildcardMiddleware(staticDir, "/redirected")(target as any, {} as any, () => {
            expect(target).toEqual({
                baseUrl: "/",
                url: "/redirected",
            });
            done();
        });
    });

    it("should not rewrite the request url w/ url matching a static file", done => {
        const target = { url: "/expected.txt", baseUrl: "/" };
        writeFileSync(resolve(staticDir, "expected.txt"), "expected");

        wildcardMiddleware(staticDir, "/unexpected")(target as any, {} as any, () => {
            expect(target).toEqual({
                baseUrl: "/",
                url: "/expected.txt",
            });
            done();
        });
    });
});
