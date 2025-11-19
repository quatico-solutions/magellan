"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
const typescript_1 = __importDefault(require("typescript"));
const transform_arrow_function_1 = require("./transform-arrow-function");
// Helper to create source files with standard params
const printer = typescript_1.default.createPrinter();
// Helper function to create a source file and extract the arrow function node
const createArrowFunctionNode = (source) => {
    const sf = typescript_1.default.createSourceFile("test.ts", source, typescript_1.default.ScriptTarget.Latest, true, typescript_1.default.ScriptKind.TS);
    const variableStatement = sf.statements.find(stmt => typescript_1.default.isVariableStatement(stmt));
    if (!variableStatement) {
        throw new Error("No variable statement found in source");
    }
    return variableStatement;
};
// Helper function to apply the transformation
const applyTransformation = (source) => {
    const node = createArrowFunctionNode(source);
    const sourceFile = typescript_1.default.createSourceFile("test.ts", source, typescript_1.default.ScriptTarget.Latest);
    // Create a proper transformation context
    const transformationResult = typescript_1.default.transform(sourceFile, [
        context => {
            const transformed = (0, transform_arrow_function_1.transformArrowFunction)(node, context);
            return () => transformed;
        },
    ]);
    const transformed = transformationResult.transformed[0];
    transformationResult.dispose();
    return printer.printNode(typescript_1.default.EmitHint.Unspecified, transformed, sourceFile);
};
describe("transformArrowFunction", () => {
    it("should transform arrow function with primitive input parameter", () => {
        const source = `export const testFunction = (input: string, context?: Context, serialization?: Serialization) => input;`;
        const actual = applyTransformation(source);
        expect(actual).toMatchInlineSnapshot(`
            "export const testFunction = ({ input }: {
                input: string;
            }, context?: Context, serialization?: Serialization) => input;"
        `);
    });
    it("should transform arrow function with never input parameter", () => {
        const source = `export const testFunction = (_: never, context?: Context, serialization?: Serialization) => "result";`;
        const actual = applyTransformation(source);
        expect(actual).toMatchInlineSnapshot(`
            "export const testFunction = ({ _ }: {
                _: never;
            }, context?: Context, serialization?: Serialization) => "result";"
        `);
    });
    it("should transform arrow function with Record<string, never> input parameter", () => {
        const source = `export const testFunction = (_: Record<string, never>, context?: Context, serialization?: Serialization) => "result";`;
        const actual = applyTransformation(source);
        expect(actual).toMatchInlineSnapshot(`
            "export const testFunction = ({ _ }: {
                _: Record<string, never>;
            }, context?: Context, serialization?: Serialization) => "result";"
        `);
    });
    it("should transform arrow function with object type input parameter", () => {
        const source = `export const testFunction = (obj: { name: string; age: number; }, context?: Context, serialization?: Serialization) => obj;`;
        const actual = applyTransformation(source);
        expect(actual).toMatchInlineSnapshot(`
            "export const testFunction = ({ obj }: {
                obj: {
                    name: string;
                    age: number;
                };
            }, context?: Context, serialization?: Serialization) => obj;"
        `);
    });
    it("should transform arrow function with interface type input parameter", () => {
        const source = `export const testFunction = (input: UserData, context?: Context, serialization?: Serialization) => input;`;
        const actual = applyTransformation(source);
        expect(actual).toMatchInlineSnapshot(`
            "export const testFunction = ({ input }: {
                input: UserData;
            }, context?: Context, serialization?: Serialization) => input;"
        `);
    });
    it("should transform async arrow function", () => {
        const source = `export const testFunction = async (input: string, context?: Context, serialization?: Serialization) => Promise.resolve(input);`;
        const actual = applyTransformation(source);
        expect(actual).toMatchInlineSnapshot(`
            "export const testFunction = async ({ input }: {
                input: string;
            }, context?: Context, serialization?: Serialization) => Promise.resolve(input);"
        `);
    });
    it("should transform arrow function with return type annotation", () => {
        const source = `export const testFunction = (input: string, context?: Context, serialization?: Serialization): string => input;`;
        const actual = applyTransformation(source);
        expect(actual).toMatchInlineSnapshot(`
            "export const testFunction = ({ input }: {
                input: string;
            }, context?: Context, serialization?: Serialization): string => input;"
        `);
    });
    it("should transform arrow function with block body", () => {
        const source = `export const testFunction = (input: string, context?: Context, serialization?: Serialization) => { return input.toUpperCase(); };`;
        const actual = applyTransformation(source);
        expect(actual).toMatchInlineSnapshot(`
            "export const testFunction = ({ input }: {
                input: string;
            }, context?: Context, serialization?: Serialization) => { return input.toUpperCase(); };"
        `);
    });
    it("should preserve modifiers on the variable statement", () => {
        const source = `export const testFunction = (input: string, context?: Context, serialization?: Serialization) => input;`;
        const actual = applyTransformation(source);
        // Check that the export modifier is preserved
        expect(actual).toContain("export const");
    });
    it("should return original node if initializer is not an arrow function", () => {
        const source = `export const testValue = "not a function";`;
        const node = createArrowFunctionNode(source);
        const sourceFile = typescript_1.default.createSourceFile("test.ts", "", typescript_1.default.ScriptTarget.Latest);
        const transformationResult = typescript_1.default.transform(sourceFile, [
            context => {
                const result = (0, transform_arrow_function_1.transformArrowFunction)(node, context);
                // Should return the same node reference
                expect(result).toBe(node);
                return () => sourceFile;
            },
        ]);
        transformationResult.dispose();
    });
    it("should return original node if no initializer exists", () => {
        const source = `export const testValue;`;
        const node = createArrowFunctionNode(source);
        const sourceFile = typescript_1.default.createSourceFile("test.ts", "", typescript_1.default.ScriptTarget.Latest);
        const transformationResult = typescript_1.default.transform(sourceFile, [
            context => {
                const result = (0, transform_arrow_function_1.transformArrowFunction)(node, context);
                // Should return the same node reference
                expect(result).toBe(node);
                return () => sourceFile;
            },
        ]);
        transformationResult.dispose();
    });
    it("should handle complex nested object types", () => {
        const source = `export const testFunction = (input: { user: { name: string; profile: { age: number; } }; }, context?: Context, serialization?: Serialization) => input;`;
        const actual = applyTransformation(source);
        expect(actual).toMatchInlineSnapshot(`
            "export const testFunction = ({ input }: {
                input: {
                    user: {
                        name: string;
                        profile: {
                            age: number;
                        };
                    };
                };
            }, context?: Context, serialization?: Serialization) => input;"
        `);
    });
    it("should handle union types", () => {
        const source = `export const testFunction = (input: string | number, context?: Context, serialization?: Serialization) => input;`;
        const actual = applyTransformation(source);
        expect(actual).toMatchInlineSnapshot(`
            "export const testFunction = ({ input }: {
                input: string | number;
            }, context?: Context, serialization?: Serialization) => input;"
        `);
    });
    it("should handle generic types", () => {
        const source = `export const testFunction = (input: Array<string>, context?: Context, serialization?: Serialization) => input;`;
        const actual = applyTransformation(source);
        expect(actual).toMatchInlineSnapshot(`
            "export const testFunction = ({ input }: {
                input: Array<string>;
            }, context?: Context, serialization?: Serialization) => input;"
        `);
    });
    it("should handle multiple variable declarations (edge case)", () => {
        const source = `export const testFunction = (input: string, context?: Context, serialization?: Serialization) => input, otherVar = "test";`;
        const actual = applyTransformation(source);
        // Should preserve the additional variable declarations and transform the arrow function
        expect(actual).toContain("{ input }");
        expect(actual).toContain("otherVar =");
        expect(actual).toContain("export const");
    });
});
