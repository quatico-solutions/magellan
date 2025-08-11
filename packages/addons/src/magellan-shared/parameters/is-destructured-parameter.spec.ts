/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import ts from "typescript";
import { isDestructuredParameter } from "./is-destructured-parameter";

describe("isDestructuredParameter", () => {
    // Helper function to create a parameter declaration from source code
    const createParameterFromSource = (parameterCode: string): ts.ParameterDeclaration => {
        const sourceCode = `function test(${parameterCode}) {}`;
        const sourceFile = ts.createSourceFile("test.ts", sourceCode, ts.ScriptTarget.Latest, true);

        const functionDeclaration = sourceFile.statements[0] as ts.FunctionDeclaration;
        return functionDeclaration.parameters[0];
    };

    describe("object destructuring patterns", () => {
        it("should return true for simple object destructuring", () => {
            const param = createParameterFromSource("{ a, b }");

            expect(isDestructuredParameter(param)).toBe(true);
        });

        it("should return true for object destructuring with renaming", () => {
            const param = createParameterFromSource("{ a: newA, b: newB }");

            expect(isDestructuredParameter(param)).toBe(true);
        });

        it("should return true for object destructuring with default values", () => {
            const param = createParameterFromSource("{ a = 1, b = 2 }");

            expect(isDestructuredParameter(param)).toBe(true);
        });

        it("should return true for nested object destructuring", () => {
            const param = createParameterFromSource("{ a, b: { c, d } }");

            expect(isDestructuredParameter(param)).toBe(true);
        });

        it("should return true for object destructuring with rest spread", () => {
            const param = createParameterFromSource("{ a, b, ...rest }");

            expect(isDestructuredParameter(param)).toBe(true);
        });

        it("should return true for typed object destructuring", () => {
            const param = createParameterFromSource("{ a, b }: { a: string; b: number }");

            expect(isDestructuredParameter(param)).toBe(true);
        });
    });

    describe("array destructuring patterns", () => {
        it("should return true for simple array destructuring", () => {
            const param = createParameterFromSource("[x, y]");

            expect(isDestructuredParameter(param)).toBe(true);
        });

        it("should return true for array destructuring with default values", () => {
            const param = createParameterFromSource("[x = 1, y = 2]");

            expect(isDestructuredParameter(param)).toBe(true);
        });

        it("should return true for array destructuring with holes", () => {
            const param = createParameterFromSource("[x, , z]");

            expect(isDestructuredParameter(param)).toBe(true);
        });

        it("should return true for array destructuring with rest spread", () => {
            const param = createParameterFromSource("[first, ...rest]");

            expect(isDestructuredParameter(param)).toBe(true);
        });

        it("should return true for nested array destructuring", () => {
            const param = createParameterFromSource("[x, [y, z]]");

            expect(isDestructuredParameter(param)).toBe(true);
        });

        it("should return true for typed array destructuring", () => {
            const param = createParameterFromSource("[x, y]: [string, number]");

            expect(isDestructuredParameter(param)).toBe(true);
        });
    });

    describe("mixed destructuring patterns", () => {
        it("should return true for object destructuring containing array destructuring", () => {
            const param = createParameterFromSource("{ a, b: [x, y] }");

            expect(isDestructuredParameter(param)).toBe(true);
        });

        it("should return true for array destructuring containing object destructuring", () => {
            const param = createParameterFromSource("[{ a, b }, c]");

            expect(isDestructuredParameter(param)).toBe(true);
        });
    });

    describe("non-destructured parameters", () => {
        it("should return false for simple identifier parameter", () => {
            const param = createParameterFromSource("param");

            expect(isDestructuredParameter(param)).toBe(false);
        });

        it("should return false for typed identifier parameter", () => {
            const param = createParameterFromSource("param: string");

            expect(isDestructuredParameter(param)).toBe(false);
        });

        it("should return false for parameter with default value", () => {
            const param = createParameterFromSource("param = 'default'");

            expect(isDestructuredParameter(param)).toBe(false);
        });

        it("should return false for rest parameter", () => {
            const param = createParameterFromSource("...args");

            expect(isDestructuredParameter(param)).toBe(false);
        });

        it("should return false for optional parameter", () => {
            const param = createParameterFromSource("param?");

            expect(isDestructuredParameter(param)).toBe(false);
        });
    });

    describe("direct TypeScript node creation", () => {
        it("should return true for manually created object binding pattern", () => {
            const objectBindingPattern = ts.factory.createObjectBindingPattern([
                ts.factory.createBindingElement(undefined, undefined, "a"),
                ts.factory.createBindingElement(undefined, undefined, "b"),
            ]);

            const param = ts.factory.createParameterDeclaration(undefined, undefined, objectBindingPattern);

            expect(isDestructuredParameter(param)).toBe(true);
        });

        it("should return true for manually created array binding pattern", () => {
            const arrayBindingPattern = ts.factory.createArrayBindingPattern([
                ts.factory.createBindingElement(undefined, undefined, "x"),
                ts.factory.createBindingElement(undefined, undefined, "y"),
            ]);

            const param = ts.factory.createParameterDeclaration(undefined, undefined, arrayBindingPattern);

            expect(isDestructuredParameter(param)).toBe(true);
        });

        it("should return false for manually created identifier", () => {
            const identifier = ts.factory.createIdentifier("param");

            const param = ts.factory.createParameterDeclaration(undefined, undefined, identifier);

            expect(isDestructuredParameter(param)).toBe(false);
        });
    });
});

