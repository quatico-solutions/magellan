/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import * as ts from "typescript";
import { createServerTransformer } from "./transformer-server";

describe("createServerTransformer", () => {
    it("should transform arrow without input", () => {
        const printer = ts.createPrinter();
        const source = `// @service()
        export const getDate = async () => new Date();`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS), [
            createServerTransformer(),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "// @service()
            export const getDate = async ({}: {}) => new Date();
            "
        `);
    });

    it("should transform arrow without output", () => {
        const printer = ts.createPrinter();
        const source = `// @service()
        export const logNameOnServer = async (name: string) => { console.log("name", name); }`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS), [
            createServerTransformer(),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "// @service()
            export const logNameOnServer = async ({ name }: {
                name: string;
            }) => { console.log("name", name); };
            "
        `);
    });

    it("should transform arrow with single primitiv input", () => {
        const printer = ts.createPrinter();
        const source = `
        // @service()
        export const getInputAsOutput = (simple: string) => simple;`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS), [
            createServerTransformer(),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "// @service()
            export const getInputAsOutput = ({ simple }: {
                simple: string;
            }) => simple;
            "
        `);
    });

    it("should transform arrow with object input", () => {
        const printer = ts.createPrinter();
        const source = `
        // @service()
        export const getInputAsOutput = (obj: { name: string; }) => obj;`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS), [
            createServerTransformer(),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "// @service()
            export const getInputAsOutput = ({ obj }: {
                obj: {
                    name: string;
                };
            }) => obj;
            "
        `);
    });

    it("should transform arrow with complex object input", () => {
        const printer = ts.createPrinter();
        const source = `export interface MyInput { name: string; age: number; others: { [key: string]: unknown; }; }
        export interface MyOutput { name: string; }
        // @service()
        export const getInputAsOutput = (obj: MyInput): MyOutput => { return { name: obj.name } };`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS), [
            createServerTransformer(),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "export interface MyInput {
                name: string;
                age: number;
                others: {
                    [key: string]: unknown;
                };
            }
            export interface MyOutput {
                name: string;
            }
            // @service()
            export const getInputAsOutput = ({ obj }: {
                obj: MyInput;
            }): MyOutput => { return { name: obj.name }; };
            "
        `);
    });

    it("should transform function with object input", () => {
        const printer = ts.createPrinter();
        const source = `
        // @service()
        export function getInputAsOutput(obj: { name: string; }) { return obj; }`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS), [
            createServerTransformer(),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "// @service()
            export function getInputAsOutput({ obj }: {
                obj: {
                    name: string;
                };
            }) { return obj; }
            "
        `);
    });
});
