/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import ts from "typescript";
import {
    DESTRUCTURED_OBJECT_ERROR,
    FUNCTION_PARAMETER_ERROR,
    MISSING_IMPORTS_ERROR,
    SIGNATURE_ERROR_CONTEXT,
    SIGNATURE_ERROR_LENGTH,
    SIGNATURE_ERROR_SERIALIZATION,
} from "../magellan-shared/constants";
import { createServerTransformer } from "./transformer-server";

// helper to create source files with standard params
const printer = ts.createPrinter();

// Updated createSource to allow easier signature changes
const createSource = (fn: string) => ts.createSourceFile("test.ts", fn, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const applyServerTransformer = (sourceFile: ts.SourceFile) => printer.printFile(ts.transform(sourceFile, [createServerTransformer()]).transformed[0]);

describe("createServerTransformer", () => {
    it("should transform arrow with correct signature (never input)", () => {
        const source = createSource(
            `
            import { type Context, type Serialization } from "@quatico/magellan-shared";

            // @service()
            export const getDate = async (_: never, context?: Context, serialization?: Serialization) => new Date()
            `
        );
        const actual = applyServerTransformer(source);
        expect(actual).toMatchInlineSnapshot(`
            "import { type Context, type Serialization } from "@quatico/magellan-shared";
            // @service()
            export const getDate = async ({ _ }: {
                _: never;
            }, context?: Context, serialization?: Serialization) => new Date();
            "
        `);
    });

    it("should transform arrow with correct signature (Record<string, never> input)", () => {
        const source = createSource(
            `            
            import { type Context, type Serialization } from "@quatico/magellan-shared";

            // @service()
            export const getDate = async (_: Record<string, never>, context?: Context, serialization?: Serialization) => new Date()
            `
        );
        const actual = applyServerTransformer(source);
        expect(actual).toMatchInlineSnapshot(`
            "import { type Context, type Serialization } from "@quatico/magellan-shared";
            // @service()
            export const getDate = async ({ _ }: {
                _: Record<string, never>;
            }, context?: Context, serialization?: Serialization) => new Date();
            "
        `);
    });

    it("should transform arrow without output type but correct signature", () => {
        const source = createSource(
            `
            import { type Context, type Serialization } from "@quatico/magellan-shared";

            // @service()
            export const testFunction = async (name: string, context?: Context, serialization?: Serialization) => { console.log("name", name); }
            `
        );
        const actual = applyServerTransformer(source);
        expect(actual).toMatchInlineSnapshot(`
            "import { type Context, type Serialization } from "@quatico/magellan-shared";
            // @service()
            export const testFunction = async ({ name }: {
                name: string;
            }, context?: Context, serialization?: Serialization) => { console.log("name", name); };
            "
        `);
    });

    it("should transform arrow with single primitive input and correct signature", () => {
        const source = createSource(
            `
            import { type Context, type Serialization } from "@quatico/magellan-shared";

            // @service()
            export const testFunction = (simple: string, context?: Context, serialization?: Serialization) => simple
            `
        );
        const actual = applyServerTransformer(source);
        expect(actual).toMatchInlineSnapshot(`
            "import { type Context, type Serialization } from "@quatico/magellan-shared";
            // @service()
            export const testFunction = ({ simple }: {
                simple: string;
            }, context?: Context, serialization?: Serialization) => simple;
            "
        `);
    });

    it("should transform arrow with object input and correct signature", () => {
        const source = createSource(
            `
            import { type Context, type Serialization } from "@quatico/magellan-shared";

            // @service()
            export const testFunction = (obj: { name: string; }, context?: Context, serialization?: Serialization) => obj
            `
        );
        const actual = applyServerTransformer(source);
        expect(actual).toMatchInlineSnapshot(`
            "import { type Context, type Serialization } from "@quatico/magellan-shared";
            // @service()
            export const testFunction = ({ obj }: {
                obj: {
                    name: string;
                };
            }, context?: Context, serialization?: Serialization) => obj;
            "
        `);
    });

    it("should transform arrow with complex object input and correct signature", () => {
        const source = createSource(
            `
            import { type Context, type Serialization } from "@quatico/magellan-shared";

            export interface MyInput { name: string; age: number; others: { [key: string]: unknown; }; }
            export interface MyOutput { name: string; }

            // @service()
            export const getInputAsOutput = (obj: MyInput, context?: Context, serialization?: Serialization): MyOutput => { return { name: obj.name } };
            `
        );
        const actual = applyServerTransformer(source);
        expect(actual).toMatchInlineSnapshot(`
            "import { type Context, type Serialization } from "@quatico/magellan-shared";
            export interface MyInput {
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
            }, context?: Context, serialization?: Serialization): MyOutput => { return { name: obj.name }; };
            "
        `);
    });

    // --- Function Declaration Tests ---
    it("should transform function declaration with correct signature", () => {
        const source = createSource(
            `
            import { type Context, type Serialization } from "@quatico/magellan-shared";

            // @service()
            export function getInputAsOutput(obj: { name: string; }, context?: Context, serialization?: Serialization) { return obj; }
            `
        );
        const actual = applyServerTransformer(source);

        expect(actual).toMatchInlineSnapshot(`
            "import { type Context, type Serialization } from "@quatico/magellan-shared";
            // @service()
            export function getInputAsOutput({ obj }: {
                obj: {
                    name: string;
                };
            }, context?: Context, serialization?: Serialization) { return obj; }
            "
        `);
    });

    // --- Error Handling Tests ---
    it("should throw error for function with no parameters (function declaration)", () => {
        const source = createSource(
            `
            // @service()
            export function testFunction() { return {}; }
            `
        );
        expect(() => applyServerTransformer(source)).toThrow(SIGNATURE_ERROR_LENGTH);
    });

    it("should throw error for function with one parameter (function declaration)", () => {
        const source = createSource(
            `
            // @service()
            export function testFunction(a: string) { return {}; }
            `
        );
        expect(() => applyServerTransformer(source)).toThrow(SIGNATURE_ERROR_LENGTH);
    });

    it("should throw error for function with two parameters (function declaration)", () => {
        const source = createSource(
            `
            // @service()
            export function testFunction(a: string, b: number) { return {}; }
            `
        );
        expect(() => applyServerTransformer(source)).toThrow(SIGNATURE_ERROR_LENGTH);
    });

    it("should throw error for function with four parameters (function declaration)", () => {
        const source = createSource(
            `
            import { type Context, type Serialization } from "@quatico/magellan-shared";

            // @service()
            export function testFunction(a: string, b: Context, c: Serialization, d: boolean) { return {}; }
            `
        );
        expect(() => applyServerTransformer(source)).toThrow(SIGNATURE_ERROR_LENGTH);
    });

    it("should throw error if second parameter is not Context (function declaration)", () => {
        const source = createSource(
            `
            import { type Serialization } from "@quatico/magellan-shared";

            // @service()
            export function testFunction(input: string, wrongParam: number, ser?: Serialization) { return {}; }
            `
        );
        expect(() => applyServerTransformer(source)).toThrow(SIGNATURE_ERROR_CONTEXT);
    });

    it("should throw error if third parameter is not Serialization (function declaration)", () => {
        const source = createSource(
            `
            import { type Context } from "@quatico/magellan-shared";

            // @service()
            export function testFunction(input: string, ctx?: Context, wrongParam: number) { return {}; }
            `
        );
        expect(() => applyServerTransformer(source)).toThrow(SIGNATURE_ERROR_SERIALIZATION);
    });

    it("should throw error for function with no parameters (arrow)", () => {
        const source = createSource(
            `
            // @service()
            export const testFunction = () => {};
            `
        );
        expect(() => applyServerTransformer(source)).toThrow(SIGNATURE_ERROR_LENGTH);
    });

    it("should throw error for function with one parameter (arrow)", () => {
        const source = createSource(
            `
            // @service()
            export const testFunction = (a: string) => {};
            `
        );
        expect(() => applyServerTransformer(source)).toThrow(SIGNATURE_ERROR_LENGTH);
    });

    it("should throw error for function with two parameters (arrow)", () => {
        const source = createSource(
            `
            // @service()
            export const testFunction = (a: string, b: number) => {};
            `
        );
        expect(() => applyServerTransformer(source)).toThrow(SIGNATURE_ERROR_LENGTH);
    });

    it("should throw error for function with four parameters (arrow)", () => {
        const source = createSource(
            `
            import { type Serialization } from "@quatico/magellan-shared";

            // @service()
            export const testFunction = (a: string, b: Context, c: Serialization, d: boolean) => {};
            `
        );
        expect(() => applyServerTransformer(source)).toThrow(SIGNATURE_ERROR_LENGTH);
    });

    it("should throw error if second parameter is not Context (arrow)", () => {
        const source = createSource(
            `
            import { type Serialization } from "@quatico/magellan-shared";

            // @service()
            export const testFunction = (input: string, wrongParam: number, ser?: Serialization) => {};
            `
        );
        expect(() => applyServerTransformer(source)).toThrow(SIGNATURE_ERROR_CONTEXT);
    });

    it("should throw error if third parameter is not Serialization (arrow)", () => {
        const source = createSource(
            `
            import { type Context } from "@quatico/magellan-shared";

            // @service()
            export const testFunction = (input: string, ctx?: Context, wrongParam: number) => {};
            `
        );
        expect(() => applyServerTransformer(source)).toThrow(SIGNATURE_ERROR_SERIALIZATION);
    });

    it("should throw error when Context interface is defined", () => {
        const source = createSource(
            `
            import { type Serialization } from "@quatico/magellan-shared";
            interface Context { /* ... */ }
            // @service()
            export const getUserRoles = async (_: never, ctx: Context, ser?: Serialization): Promise<string[]> => { return []; }
            `
        );
        expect(() => applyServerTransformer(source)).toThrow(/Custom declaration of type 'Context' is not allowed/);
    });

    it("should throw error when Context type is defined", () => {
        const source = createSource(
            `
            import { type Serialization } from "@quatico/magellan-shared";
            type Context = { /* Custom definition */ };
            // @service()
            export const getUserData = async (_: never, ctx: Context, ser?: Serialization) => { return null; }
        `
        );
        expect(() => applyServerTransformer(source)).toThrow(/Custom declaration of type 'Context' is not allowed/);
    });

    it("should throw error when Serialization interface is defined", () => {
        const source = createSource(
            `
            import { type Context } from "@quatico/magellan-shared";
            interface Serialization { /* Custom definition */ }
            // @service()
            export const getUserRoles = async (_: never, ctx: Context, ser?: Serialization): Promise<string[]> => { return []; }
        `
        );
        expect(() => applyServerTransformer(source)).toThrow(/Custom declaration of type 'Serialization' is not allowed/);
    });

    it("should throw error when Serialization type is defined", () => {
        const source = createSource(
            `
            import { type Context } from "@quatico/magellan-shared";
            type Serialization = { /* Custom definition */ };
            // @service()
            export const getUserData = async (_: never, ctx: Context, ser?: Serialization) => { return null; }
        `
        );
        expect(() => applyServerTransformer(source)).toThrow(/Custom declaration of type 'Serialization' is not allowed/);
    });

    it("should throw error on destructured input (arrow)", () => {
        const source = createSource(
            `
            import { type Context, type Serialization } from "@quatico/magellan-shared";

            // @service()
            export const testFunction = ({ name }: { name: string }, ctx?: Context, ser?: Serialization) => {};
            `
        );
        expect(() => applyServerTransformer(source)).toThrow(DESTRUCTURED_OBJECT_ERROR);
    });

    it("should throw error on function input (arrow)", () => {
        const source = createSource(
            `
            import { type Context, type Serialization } from "@quatico/magellan-shared";

            // @service()
            export const testFunction = (fn: () => void, ctx?: Context, ser?: Serialization) => {};
            `
        );
        expect(() => applyServerTransformer(source)).toThrow(FUNCTION_PARAMETER_ERROR);
    });

    it("should throw error on destructured input (function declaration)", () => {
        const source = createSource(
            `
            import { type Context, type Serialization } from "@quatico/magellan-shared";

            // @service()
            export function testFunction({ name }: { name: string }, ctx?: Context, ser?: Serialization) { return {}; }
            `
        );
        expect(() => applyServerTransformer(source)).toThrow(DESTRUCTURED_OBJECT_ERROR);
    });

    it("should throw error on function input (function declaration)", () => {
        const source = createSource(
            `
            import { type Context, type Serialization } from "@quatico/magellan-shared";

            // @service()
            export function testFunction(fn: () => void, ctx?: Context, ser?: Serialization) { return {}; }
            `
        );
        expect(() => applyServerTransformer(source)).toThrow(FUNCTION_PARAMETER_ERROR);
    });

    it("should throw error when imports are missing (arrow)", () => {
        const source = createSource(
            `
            // @service()
            export const testFunction = (input: any, ctx?: Context, ser?: Serialization) => {};
            `
        );
        expect(() => applyServerTransformer(source)).toThrow(MISSING_IMPORTS_ERROR);
    });

    it("should throw error when imports are missing (function declaration)", () => {
        const source = createSource(
            `
            // @service()
            export function testFunction(input: any, ctx?: Context, ser?: Serialization) { return {}; }
            `
        );
        expect(() => applyServerTransformer(source)).toThrow(MISSING_IMPORTS_ERROR);
    });
});
