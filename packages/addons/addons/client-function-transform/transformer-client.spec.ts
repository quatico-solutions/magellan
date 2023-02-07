/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import * as ts from "typescript";
import { createClientTransformer } from "./transformer-client";

describe("createClientTransformer", () => {
    it("should set target in remoteInvoke w/ target set", () => {
        const printer = ts.createPrinter();
        const source = `// @service({"target":"expected"})
        export const getDate = async () => new Date();`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest), [
            createClientTransformer({ libPath: "@quatico/magellan-client", functionsDir: "function" }),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            // @service({"target":"expected"})
            export const getDate = async () => {
                return remoteInvoke({ name: "getDate", data: {}, namespace: "default" });
            };
            "
        `);
    });

    it("should set target to default in remoteInvoke w/o target set", () => {
        const printer = ts.createPrinter();
        const source = `// @service()
        export const getDate = async () => new Date();`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest), [
            createClientTransformer({ libPath: "@quatico/magellan-client", functionsDir: "function" }),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            // @service()
            export const getDate = async () => {
                return remoteInvoke({ name: "getDate", data: {}, namespace: "default" });
            };
            "
        `);
    });
});
