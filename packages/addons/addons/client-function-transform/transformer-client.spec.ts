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

    it("should set parameter correctly as data property (single primitive parameter)", () => {
        const printer = ts.createPrinter();
        const source = `// @service()
        export const getInputAsOutput = (input: string) => input;`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest), [
            createClientTransformer({ libPath: "@quatico/magellan-client", functionsDir: "function" }),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            // @service()
            export const getInputAsOutput = (input: string) => {
                return remoteInvoke({ name: "getInputAsOutput", data: { input }, namespace: "default" });
            };
            "
        `);
    });

    it("should set parameters correctly as data properties (multiple primitive parameters)", () => {
        const printer = ts.createPrinter();
        const source = `// @service()
        export const getInputAsOutput = (name: string, type: number) => ({ nameOut: name, typeOut: type });`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest), [
            createClientTransformer({ libPath: "@quatico/magellan-client", functionsDir: "function" }),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            // @service()
            export const getInputAsOutput = (name: string, type: number) => {
                return remoteInvoke({ name: "getInputAsOutput", data: { name, type }, namespace: "default" });
            };
            "
        `);
    });

    it("should set parameter correctly as data property (complex object)", () => {
        const printer = ts.createPrinter();
        const source = `export interface MyInput { name: string; age: number; others: { [key: string]: unknown; }; }
        // @service()
        export const getInputAsOutput = (obj: MyInput) => obj;`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest), [
            createClientTransformer({ libPath: "@quatico/magellan-client", functionsDir: "function" }),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            export interface MyInput {
                name: string;
                age: number;
                others: {
                    [key: string]: unknown;
                };
            }
            // @service()
            export const getInputAsOutput = (obj: MyInput) => {
                return remoteInvoke({ name: "getInputAsOutput", data: { obj }, namespace: "default" });
            };
            "
        `);
    });

    it("should set parameter correctly as data property (complex object with inline type)", () => {
        const printer = ts.createPrinter();
        const source = `// @service()
        export const getInputAsOutput = (obj: { name: string; age: number; others: { [key: string]: unknown; }; }) => obj;`;

        const transformed = ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest), [
            createClientTransformer({ libPath: "@quatico/magellan-client", functionsDir: "function" }),
        ]);
        const actual = printer.printFile(transformed.transformed[0]);

        expect(actual).toMatchInlineSnapshot(`
            "import { remoteInvoke } from "@quatico/magellan-client";
            // @service()
            export const getInputAsOutput = (obj: {
                name: string;
                age: number;
                others: {
                    [key: string]: unknown;
                };
            }) => {
                return remoteInvoke({ name: "getInputAsOutput", data: { obj }, namespace: "default" });
            };
            "
        `);
    });

    it("should throw on unsupported destructured object as input", () => {
        const source = `// @service()
        export const getInputAsOutput = ({ name, type }: { name: string; type: number }) => ({ nameOut: name, typeOut: type });`;

        expect(() =>
            ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest), [
                createClientTransformer({ libPath: "@quatico/magellan-client", functionsDir: "function" }),
            ])
        ).toThrowErrorMatchingInlineSnapshot(`
            "
                            Only primitive or object parameters are supported as function inputs. No destructed objects. 
                            We currently support single and multiple parameters (e.g., 
                                1. export const fn = (a: string) => a
                                2. export const fn = (name: string, age: number) => "Hi " + name + ". Your age is: " + age
                                 
                            But not something like: export const fn = ({ name, type }: { name: string; type: number }) => ({ nameOut: name, typeOut: type })
                            Please use the following instead: 
                                1. export interface Wrapper { name: string; type: number; };
                                2. export const fn = (wrapper: Wrapper) => ({ nameOut: wrapper.name, typeOut: wrapper.type })
                        "
        `);
    });

    it("should throw on unsupported function as input", () => {
        const source = `// @service()
        export const provideFnAsInput = (fn: (input: string) => string) => ({});`;

        expect(() =>
            ts.transform(ts.createSourceFile("function/test.ts", source, ts.ScriptTarget.Latest), [
                createClientTransformer({ libPath: "@quatico/magellan-client", functionsDir: "function" }),
            ])
        ).toThrowErrorMatchingInlineSnapshot(`
            "
                            Only primitive or object parameters are supported as function inputs. No function/arrow function's are acceptable inputs. 
                            We currently support single and multiple parameters (e.g., 
                                1. export const fn = (a: string) => a
                                2. export const fn = (name: string, age: number) => "Hi " + name + ". Your age is: " + age
                                3. export interface Wrapper { name: string; type: number; }; 
                                   export const fn = (wrapper: Wrapper) => ({ nameOut: wrapper.name, typeOut: wrapper.type })
                        "
        `);
    });
});
