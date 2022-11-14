import { writeFileSync } from "fs";
import { join } from "path";
import { wildcardMiddleware } from "./wildcard-middleware";

describe("wildcardMiddleware", () => {
    it("should rewrite the request url w/ url not matching a static file", async () => {
        const target = { url: "/expected", baseUrl: "/" };

        wildcardMiddleware(__dirname, "/redirected")(target as any, {} as any, () => {
            expect(target).toEqual({ baseUrl: "/", url: "/redirected" });
        });
    });

    it("should not rewrite the request url w/ url matching a static file", async () => {
        const target = { url: "/expected.txt", baseUrl: "/" };
        writeFileSync(join(__dirname, "expected.txt"), "expected");

        wildcardMiddleware(__dirname, "/unexpected")(target as any, {} as any, () => {
            expect(target).toEqual({ baseUrl: "/", url: "/expected.txt" });
        });
    });
});
