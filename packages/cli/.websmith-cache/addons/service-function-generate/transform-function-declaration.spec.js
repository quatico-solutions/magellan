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
const transform_function_declaration_1 = require("./transform-function-declaration");
// Helper to create source files with standard params
const printer = typescript_1.default.createPrinter();
// Helper function to create a function declaration node
const createFunctionDeclarationNode = (source) => {
    const sf = typescript_1.default.createSourceFile("test.ts", source, typescript_1.default.ScriptTarget.Latest, true, typescript_1.default.ScriptKind.TS);
    const functionDeclaration = sf.statements.find(stmt => typescript_1.default.isFunctionDeclaration(stmt));
    if (!functionDeclaration) {
        throw new Error("No function declaration found in source");
    }
    return functionDeclaration;
};
// Helper function to apply the transformation
const applyTransformation = (source) => {
    const node = createFunctionDeclarationNode(source);
    const sourceFile = typescript_1.default.createSourceFile("test.ts", source, typescript_1.default.ScriptTarget.Latest);
    // Create a proper transformation context
    const transformationResult = typescript_1.default.transform(sourceFile, [
        context => {
            const transformed = (0, transform_function_declaration_1.transformFunctionDeclaration)(node, context);
            return sourceFile => {
                // Create a new source file with the transformed function
                return typescript_1.default.factory.updateSourceFile(sourceFile, [transformed]);
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
        const sourceFile = typescript_1.default.createSourceFile("test.ts", "", typescript_1.default.ScriptTarget.Latest);
        const transformationResult = typescript_1.default.transform(sourceFile, [
            context => {
                const result = (0, transform_function_declaration_1.transformFunctionDeclaration)(node, context);
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
    it("should handle function with context type parameter", () => {
        const source = `export function testFunction(input: T, context?: Context<{ foo: string }>, serialization?: Serialization) { return input; }`;
        const actual = applyTransformation(source);
        expect(actual).toMatchInlineSnapshot(`
"export function testFunction({ input }: {
    input: T;
}, context?: Context<{
    foo: string;
}>, serialization?: Serialization) { return input; }
"
`);
    });
});
