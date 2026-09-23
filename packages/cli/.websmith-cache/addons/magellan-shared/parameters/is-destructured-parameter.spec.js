"use strict";
/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = __importDefault(require("typescript"));
const is_destructured_parameter_1 = require("./is-destructured-parameter");
describe("isDestructuredParameter", () => {
    // Helper function to create a parameter declaration from source code
    const createParameterFromSource = (parameterCode) => {
        const sourceCode = `function test(${parameterCode}) {}`;
        const sourceFile = typescript_1.default.createSourceFile("test.ts", sourceCode, typescript_1.default.ScriptTarget.Latest, true);
        const functionDeclaration = sourceFile.statements[0];
        return functionDeclaration.parameters[0];
    };
    describe("object destructuring patterns", () => {
        it("should return true for simple object destructuring", () => {
            const param = createParameterFromSource("{ a, b }");
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(true);
        });
        it("should return true for object destructuring with renaming", () => {
            const param = createParameterFromSource("{ a: newA, b: newB }");
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(true);
        });
        it("should return true for object destructuring with default values", () => {
            const param = createParameterFromSource("{ a = 1, b = 2 }");
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(true);
        });
        it("should return true for nested object destructuring", () => {
            const param = createParameterFromSource("{ a, b: { c, d } }");
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(true);
        });
        it("should return true for object destructuring with rest spread", () => {
            const param = createParameterFromSource("{ a, b, ...rest }");
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(true);
        });
        it("should return true for typed object destructuring", () => {
            const param = createParameterFromSource("{ a, b }: { a: string; b: number }");
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(true);
        });
    });
    describe("array destructuring patterns", () => {
        it("should return true for simple array destructuring", () => {
            const param = createParameterFromSource("[x, y]");
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(true);
        });
        it("should return true for array destructuring with default values", () => {
            const param = createParameterFromSource("[x = 1, y = 2]");
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(true);
        });
        it("should return true for array destructuring with holes", () => {
            const param = createParameterFromSource("[x, , z]");
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(true);
        });
        it("should return true for array destructuring with rest spread", () => {
            const param = createParameterFromSource("[first, ...rest]");
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(true);
        });
        it("should return true for nested array destructuring", () => {
            const param = createParameterFromSource("[x, [y, z]]");
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(true);
        });
        it("should return true for typed array destructuring", () => {
            const param = createParameterFromSource("[x, y]: [string, number]");
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(true);
        });
    });
    describe("mixed destructuring patterns", () => {
        it("should return true for object destructuring containing array destructuring", () => {
            const param = createParameterFromSource("{ a, b: [x, y] }");
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(true);
        });
        it("should return true for array destructuring containing object destructuring", () => {
            const param = createParameterFromSource("[{ a, b }, c]");
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(true);
        });
    });
    describe("non-destructured parameters", () => {
        it("should return false for simple identifier parameter", () => {
            const param = createParameterFromSource("param");
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(false);
        });
        it("should return false for typed identifier parameter", () => {
            const param = createParameterFromSource("param: string");
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(false);
        });
        it("should return false for parameter with default value", () => {
            const param = createParameterFromSource("param = 'default'");
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(false);
        });
        it("should return false for rest parameter", () => {
            const param = createParameterFromSource("...args");
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(false);
        });
        it("should return false for optional parameter", () => {
            const param = createParameterFromSource("param?");
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(false);
        });
    });
    describe("direct TypeScript node creation", () => {
        it("should return true for manually created object binding pattern", () => {
            const objectBindingPattern = typescript_1.default.factory.createObjectBindingPattern([
                typescript_1.default.factory.createBindingElement(undefined, undefined, "a"),
                typescript_1.default.factory.createBindingElement(undefined, undefined, "b"),
            ]);
            const param = typescript_1.default.factory.createParameterDeclaration(undefined, undefined, objectBindingPattern);
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(true);
        });
        it("should return true for manually created array binding pattern", () => {
            const arrayBindingPattern = typescript_1.default.factory.createArrayBindingPattern([
                typescript_1.default.factory.createBindingElement(undefined, undefined, "x"),
                typescript_1.default.factory.createBindingElement(undefined, undefined, "y"),
            ]);
            const param = typescript_1.default.factory.createParameterDeclaration(undefined, undefined, arrayBindingPattern);
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(true);
        });
        it("should return false for manually created identifier", () => {
            const identifier = typescript_1.default.factory.createIdentifier("param");
            const param = typescript_1.default.factory.createParameterDeclaration(undefined, undefined, identifier);
            expect((0, is_destructured_parameter_1.isDestructuredParameter)(param)).toBe(false);
        });
    });
});
