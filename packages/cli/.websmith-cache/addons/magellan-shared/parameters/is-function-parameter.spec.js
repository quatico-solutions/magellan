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
const is_function_parameter_1 = require("./is-function-parameter");
describe("isFunctionParameter", () => {
    // Helper function to create a parameter declaration from source code
    const createParameterFromSource = (parameterCode) => {
        const sourceCode = `function test(${parameterCode}) {}`;
        const sourceFile = typescript_1.default.createSourceFile("test.ts", sourceCode, typescript_1.default.ScriptTarget.Latest, true);
        const functionDeclaration = sourceFile.statements[0];
        return functionDeclaration.parameters[0];
    };
    describe("arrow function types", () => {
        it("should return true for simple arrow function type", () => {
            const param = createParameterFromSource("callback: (x: number) => string");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(true);
        });
        it("should return true for arrow function with multiple parameters", () => {
            const param = createParameterFromSource("handler: (a: string, b: number) => void");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(true);
        });
        it("should return true for arrow function with no parameters", () => {
            const param = createParameterFromSource("callback: () => void");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(true);
        });
        it("should return true for arrow function returning complex type", () => {
            const param = createParameterFromSource("mapper: (item: T) => Promise<U>");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(true);
        });
    });
    describe("function type references", () => {
        it("should return true for type containing 'Function'", () => {
            const param = createParameterFromSource("callback: MyFunction");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(true);
        });
        it("should return true for type containing 'Callback'", () => {
            const param = createParameterFromSource("handler: EventCallback");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(true);
        });
        it("should return true for type with 'Function' in middle", () => {
            const param = createParameterFromSource("processor: DataFunctionHandler");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(true);
        });
        it("should return true for type with 'Callback' in middle", () => {
            const param = createParameterFromSource("listener: MouseCallbackEvent");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(true);
        });
    });
    describe("non-function parameters", () => {
        it("should return false for string parameter", () => {
            const param = createParameterFromSource("name: string");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(false);
        });
        it("should return false for number parameter", () => {
            const param = createParameterFromSource("count: number");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(false);
        });
        it("should return false for object type parameter", () => {
            const param = createParameterFromSource("config: { name: string; value: number }");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(false);
        });
        it("should return false for array type parameter", () => {
            const param = createParameterFromSource("items: string[]");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(false);
        });
        it("should return false for custom type without Function/Callback", () => {
            const param = createParameterFromSource("data: UserData");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(false);
        });
        it("should return false for generic type without Function/Callback", () => {
            const param = createParameterFromSource("result: Promise<string>");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(false);
        });
    });
    describe("edge cases", () => {
        it("should return false for parameter without type annotation", () => {
            const param = createParameterFromSource("param");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(false);
        });
        it("should return false for parameter with union type not containing function", () => {
            const param = createParameterFromSource("value: string | number");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(false);
        });
        it("should return false for parameter with intersection type not containing function", () => {
            const param = createParameterFromSource("obj: UserData & ConfigData");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(false);
        });
        it("should return false for type reference with non-identifier type name", () => {
            // Create a more complex scenario where typeName might not be an identifier
            const sourceCode = `
                type ComplexType = string;
                function test(param: ComplexType["length"]) {}
            `;
            const sourceFile = typescript_1.default.createSourceFile("test.ts", sourceCode, typescript_1.default.ScriptTarget.Latest, true);
            const functionDeclaration = sourceFile.statements[1];
            const param = functionDeclaration.parameters[0];
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(false);
        });
    });
    describe("complex function types", () => {
        it("should return true for function type with optional parameters", () => {
            const param = createParameterFromSource("callback: (x?: number) => string");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(true);
        });
        it("should return true for function type with rest parameters", () => {
            const param = createParameterFromSource("handler: (...args: any[]) => void");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(true);
        });
        it("should return true for async function type", () => {
            const param = createParameterFromSource("asyncFn: (x: number) => Promise<string>");
            expect((0, is_function_parameter_1.isFunctionParameter)(param)).toBe(true);
        });
    });
});
