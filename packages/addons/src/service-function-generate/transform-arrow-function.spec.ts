/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import ts from "typescript";
import { transformArrowFunction } from "./transform-arrow-function";

// Helper to create source files with standard params
const printer = ts.createPrinter();

// Helper function to create a source file and extract the arrow function node
const createArrowFunctionNode = (source: string): ts.VariableStatement => {
    const sf = ts.createSourceFile("test.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const variableStatement = sf.statements.find(stmt => ts.isVariableStatement(stmt)) as ts.VariableStatement;
    if (!variableStatement) {
        throw new Error("No variable statement found in source");
    }
    return variableStatement;
};

// Helper function to apply the transformation
const applyTransformation = (source: string): string => {
    const node = createArrowFunctionNode(source);
    const sourceFile = ts.createSourceFile("test.ts", source, ts.ScriptTarget.Latest);

    // Create a proper transformation context
    const transformationResult = ts.transform(sourceFile, [
        context => {
            const transformed = transformArrowFunction(node, context);
            return () => transformed as ts.SourceFile;
        },
    ]);

    const transformed = transformationResult.transformed[0];
    transformationResult.dispose();

    return printer.printNode(ts.EmitHint.Unspecified, transformed, sourceFile);
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
        const sourceFile = ts.createSourceFile("test.ts", "", ts.ScriptTarget.Latest);

        const transformationResult = ts.transform(sourceFile, [
            context => {
                const result = transformArrowFunction(node, context);
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
        const sourceFile = ts.createSourceFile("test.ts", "", ts.ScriptTarget.Latest);

        const transformationResult = ts.transform(sourceFile, [
            context => {
                const result = transformArrowFunction(node, context);
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
