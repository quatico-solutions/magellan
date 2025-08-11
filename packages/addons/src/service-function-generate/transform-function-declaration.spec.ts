/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import ts from "typescript";
import { transformFunctionDeclaration } from "./transform-function-declaration";

// Helper to create source files with standard params
const printer = ts.createPrinter();

// Helper function to create a function declaration node
const createFunctionDeclarationNode = (source: string): ts.FunctionDeclaration => {
    const sf = ts.createSourceFile("test.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const functionDeclaration = sf.statements.find(stmt => ts.isFunctionDeclaration(stmt)) as ts.FunctionDeclaration;

    if (!functionDeclaration) {
        throw new Error("No function declaration found in source");
    }

    return functionDeclaration;
};

// Helper function to apply the transformation
const applyTransformation = (source: string): string => {
    const node = createFunctionDeclarationNode(source);
    const sourceFile = ts.createSourceFile("test.ts", source, ts.ScriptTarget.Latest);

    // Create a proper transformation context
    const transformationResult = ts.transform(sourceFile, [
        context => {
            const transformed = transformFunctionDeclaration(node, context);
            return sourceFile => {
                // Create a new source file with the transformed function
                return ts.factory.updateSourceFile(sourceFile, [transformed as ts.Statement]);
            };
        },
    ]);

    const transformed = transformationResult.transformed[0];
    transformationResult.dispose();

    return printer.printFile(transformed);
};

describe("transformFunctionDeclaration", () => {
    it("should transform function declaration with primitive input parameter", () => {
        const source = `export function testFunction(input: string, context?: Context, serialization?: Serialization) { return input; }`;

        const actual = applyTransformation(source);

        expect(actual).toMatchInlineSnapshot(`
            "export function testFunction({ input }: {
                input: string;
            }, context?: Context, serialization?: Serialization) { return input; }
            "
        `);
    });

    it("should transform function declaration with number input parameter", () => {
        const source = `export function testFunction(count: number, context?: Context, serialization?: Serialization) { return count * 2; }`;

        const actual = applyTransformation(source);

        expect(actual).toMatchInlineSnapshot(`
            "export function testFunction({ count }: {
                count: number;
            }, context?: Context, serialization?: Serialization) { return count * 2; }
            "
        `);
    });

    it("should transform function declaration with object type input parameter", () => {
        const source = `export function testFunction(obj: { name: string; age: number; }, context?: Context, serialization?: Serialization) { return obj; }`;

        const actual = applyTransformation(source);

        expect(actual).toMatchInlineSnapshot(`
            "export function testFunction({ obj }: {
                obj: {
                    name: string;
                    age: number;
                };
            }, context?: Context, serialization?: Serialization) { return obj; }
            "
        `);
    });

    it("should transform function declaration with interface type input parameter", () => {
        const source = `export function testFunction(input: UserData, context?: Context, serialization?: Serialization) { return input; }`;

        const actual = applyTransformation(source);

        expect(actual).toMatchInlineSnapshot(`
            "export function testFunction({ input }: {
                input: UserData;
            }, context?: Context, serialization?: Serialization) { return input; }
            "
        `);
    });

    it("should transform async function declaration", () => {
        const source = `export async function testFunction(input: string, context?: Context, serialization?: Serialization) { return Promise.resolve(input); }`;

        const actual = applyTransformation(source);

        expect(actual).toMatchInlineSnapshot(`
            "export async function testFunction({ input }: {
                input: string;
            }, context?: Context, serialization?: Serialization) { return Promise.resolve(input); }
            "
        `);
    });

    it("should transform function declaration with return type annotation", () => {
        const source = `export function testFunction(input: string, context?: Context, serialization?: Serialization): string { return input; }`;

        const actual = applyTransformation(source);

        expect(actual).toMatchInlineSnapshot(`
            "export function testFunction({ input }: {
                input: string;
            }, context?: Context, serialization?: Serialization): string { return input; }
            "
        `);
    });

    it("should transform generator function declaration", () => {
        const source = `export function* testFunction(input: string, context?: Context, serialization?: Serialization) { yield input; }`;

        const actual = applyTransformation(source);

        expect(actual).toMatchInlineSnapshot(`
            "export function* testFunction({ input }: {
                input: string;
            }, context?: Context, serialization?: Serialization) { yield input; }
            "
        `);
    });

    it("should preserve modifiers on the function declaration", () => {
        const source = `export function testFunction(input: string, context?: Context, serialization?: Serialization) { return input; }`;

        const actual = applyTransformation(source);

        // Check that the export modifier is preserved
        expect(actual).toContain("export function");
        expect(actual).toContain("{ input }");
    });

    it("should handle functions with undefined context parameter", () => {
        const source = `export function testFunction(input: string, context?: Context, serialization?: Serialization) { return input; }`;

        const actual = applyTransformation(source);

        // Should still transform correctly even when context is optional
        expect(actual).toContain("{ input }");
        expect(actual).toContain("context?: Context");
        expect(actual).toContain("serialization?: Serialization");
    });

    it("should handle functions with undefined serialization parameter", () => {
        const source = `export function testFunction(input: string, context?: Context, serialization?: Serialization) { return input; }`;

        const actual = applyTransformation(source);

        // Should still transform correctly even when serialization is optional
        expect(actual).toContain("{ input }");
        expect(actual).toContain("context?: Context");
        expect(actual).toContain("serialization?: Serialization");
    });

    it("should return original node if function has no body", () => {
        const source = `export declare function testFunction(input: string, context?: Context, serialization?: Serialization): string;`;
        const node = createFunctionDeclarationNode(source);
        const sourceFile = ts.createSourceFile("test.ts", "", ts.ScriptTarget.Latest);

        const transformationResult = ts.transform(sourceFile, [
            context => {
                const result = transformFunctionDeclaration(node, context);
                // Should return the same node reference for declarations without body
                expect(result).toBe(node);
                return () => sourceFile;
            },
        ]);

        transformationResult.dispose();
    });

    it("should handle complex nested object types", () => {
        const source = `export function testFunction(input: { user: { name: string; profile: { age: number; } }; }, context?: Context, serialization?: Serialization) { return input; }`;

        const actual = applyTransformation(source);

        expect(actual).toMatchInlineSnapshot(`
            "export function testFunction({ input }: {
                input: {
                    user: {
                        name: string;
                        profile: {
                            age: number;
                        };
                    };
                };
            }, context?: Context, serialization?: Serialization) { return input; }
            "
        `);
    });

    it("should handle union types", () => {
        const source = `export function testFunction(input: string | number, context?: Context, serialization?: Serialization) { return input; }`;

        const actual = applyTransformation(source);

        expect(actual).toMatchInlineSnapshot(`
            "export function testFunction({ input }: {
                input: string | number;
            }, context?: Context, serialization?: Serialization) { return input; }
            "
        `);
    });

    it("should handle generic types", () => {
        const source = `export function testFunction(input: Array<string>, context?: Context, serialization?: Serialization) { return input; }`;

        const actual = applyTransformation(source);

        expect(actual).toMatchInlineSnapshot(`
            "export function testFunction({ input }: {
                input: Array<string>;
            }, context?: Context, serialization?: Serialization) { return input; }
            "
        `);
    });

    it("should handle function with type parameters", () => {
        const source = `export function testFunction<T>(input: T, context?: Context, serialization?: Serialization): T { return input; }`;

        const actual = applyTransformation(source);

        expect(actual).toMatchInlineSnapshot(`
            "export function testFunction<T>({ input }: {
                input: T;
            }, context?: Context, serialization?: Serialization): T { return input; }
            "
        `);
    });

    it("should handle function with never type parameter", () => {
        const source = `export function testFunction(_: never, context?: Context, serialization?: Serialization) { return "result"; }`;

        const actual = applyTransformation(source);

        expect(actual).toMatchInlineSnapshot(`
            "export function testFunction({ _ }: {
                _: never;
            }, context?: Context, serialization?: Serialization) { return "result"; }
            "
        `);
    });

    it("should handle function with Record<string, never> input parameter", () => {
        const source = `export function testFunction(_: Record<string, never>, context?: Context, serialization?: Serialization) { return "result"; }`;

        const actual = applyTransformation(source);

        expect(actual).toMatchInlineSnapshot(`
            "export function testFunction({ _ }: {
                _: Record<string, never>;
            }, context?: Context, serialization?: Serialization) { return "result"; }
            "
        `);
    });

    it("should handle function with optional input parameter", () => {
        const source = `export function testFunction(input?: string, context?: Context, serialization?: Serialization) { return input || "default"; }`;

        const actual = applyTransformation(source);

        expect(actual).toMatchInlineSnapshot(`
            "export function testFunction({ input }?: {
                input: string;
            }, context?: Context, serialization?: Serialization) { return input || "default"; }
            "
        `);
    });

    it("should handle function with default parameter value", () => {
        const source = `export function testFunction(input: string = "default", context?: Context, serialization?: Serialization) { return input; }`;

        const actual = applyTransformation(source);

        expect(actual).toMatchInlineSnapshot(`
            "export function testFunction({ input }: {
                input: string;
            } = "default", context?: Context, serialization?: Serialization) { return input; }
            "
        `);
    });

    it("should handle function with readonly modifier on parameter", () => {
        const source = `export function testFunction(input: readonly string[], context?: Context, serialization?: Serialization) { return input; }`;

        const actual = applyTransformation(source);

        expect(actual).toMatchInlineSnapshot(`
            "export function testFunction({ input }: {
                input: readonly string[];
            }, context?: Context, serialization?: Serialization) { return input; }
            "
        `);
    });

    it("should handle function with complex function body", () => {
        const source = `export function testFunction(input: string, context?: Context, serialization?: Serialization) {
            const processed = input.toUpperCase();
            if (processed.length > 10) {
                return processed.substring(0, 10);
            }
            return processed;
        }`;

        const actual = applyTransformation(source);

        expect(actual).toMatchInlineSnapshot(`
            "export function testFunction({ input }: {
                input: string;
            }, context?: Context, serialization?: Serialization) {
                const processed = input.toUpperCase();
                if (processed.length > 10) {
                    return processed.substring(0, 10);
                }
                return processed;
            }
            "
        `);
    });
});
