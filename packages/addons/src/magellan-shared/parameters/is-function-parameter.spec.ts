/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import ts from "typescript";
import { isFunctionParameter } from "./is-function-parameter";

describe("isFunctionParameter", () => {
    // Helper function to create a parameter declaration from source code
    const createParameterFromSource = (parameterCode: string): ts.ParameterDeclaration => {
        const sourceCode = `function test(${parameterCode}) {}`;
        const sourceFile = ts.createSourceFile("test.ts", sourceCode, ts.ScriptTarget.Latest, true);
        
        const functionDeclaration = sourceFile.statements[0] as ts.FunctionDeclaration;
        return functionDeclaration.parameters[0];
    };

    describe("arrow function types", () => {
        it("should return true for simple arrow function type", () => {
            const param = createParameterFromSource("callback: (x: number) => string");
            
            expect(isFunctionParameter(param)).toBe(true);
        });

        it("should return true for arrow function with multiple parameters", () => {
            const param = createParameterFromSource("handler: (a: string, b: number) => void");
            
            expect(isFunctionParameter(param)).toBe(true);
        });

        it("should return true for arrow function with no parameters", () => {
            const param = createParameterFromSource("callback: () => void");
            
            expect(isFunctionParameter(param)).toBe(true);
        });

        it("should return true for arrow function returning complex type", () => {
            const param = createParameterFromSource("mapper: (item: T) => Promise<U>");
            
            expect(isFunctionParameter(param)).toBe(true);
        });
    });

    describe("function type references", () => {
        it("should return true for type containing 'Function'", () => {
            const param = createParameterFromSource("callback: MyFunction");
            
            expect(isFunctionParameter(param)).toBe(true);
        });

        it("should return true for type containing 'Callback'", () => {
            const param = createParameterFromSource("handler: EventCallback");
            
            expect(isFunctionParameter(param)).toBe(true);
        });

        it("should return true for type with 'Function' in middle", () => {
            const param = createParameterFromSource("processor: DataFunctionHandler");
            
            expect(isFunctionParameter(param)).toBe(true);
        });

        it("should return true for type with 'Callback' in middle", () => {
            const param = createParameterFromSource("listener: MouseCallbackEvent");
            
            expect(isFunctionParameter(param)).toBe(true);
        });
    });

    describe("non-function parameters", () => {
        it("should return false for string parameter", () => {
            const param = createParameterFromSource("name: string");
            
            expect(isFunctionParameter(param)).toBe(false);
        });

        it("should return false for number parameter", () => {
            const param = createParameterFromSource("count: number");
            
            expect(isFunctionParameter(param)).toBe(false);
        });

        it("should return false for object type parameter", () => {
            const param = createParameterFromSource("config: { name: string; value: number }");
            
            expect(isFunctionParameter(param)).toBe(false);
        });

        it("should return false for array type parameter", () => {
            const param = createParameterFromSource("items: string[]");
            
            expect(isFunctionParameter(param)).toBe(false);
        });

        it("should return false for custom type without Function/Callback", () => {
            const param = createParameterFromSource("data: UserData");
            
            expect(isFunctionParameter(param)).toBe(false);
        });

        it("should return false for generic type without Function/Callback", () => {
            const param = createParameterFromSource("result: Promise<string>");
            
            expect(isFunctionParameter(param)).toBe(false);
        });
    });

    describe("edge cases", () => {
        it("should return false for parameter without type annotation", () => {
            const param = createParameterFromSource("param");
            
            expect(isFunctionParameter(param)).toBe(false);
        });

        it("should return false for parameter with union type not containing function", () => {
            const param = createParameterFromSource("value: string | number");
            
            expect(isFunctionParameter(param)).toBe(false);
        });

        it("should return false for parameter with intersection type not containing function", () => {
            const param = createParameterFromSource("obj: UserData & ConfigData");
            
            expect(isFunctionParameter(param)).toBe(false);
        });

        it("should return false for type reference with non-identifier type name", () => {
            // Create a more complex scenario where typeName might not be an identifier
            const sourceCode = `
                type ComplexType = string;
                function test(param: ComplexType["length"]) {}
            `;
            const sourceFile = ts.createSourceFile("test.ts", sourceCode, ts.ScriptTarget.Latest, true);
            const functionDeclaration = sourceFile.statements[1] as ts.FunctionDeclaration;
            const param = functionDeclaration.parameters[0];
            
            expect(isFunctionParameter(param)).toBe(false);
        });
    });

    describe("complex function types", () => {
        it("should return true for function type with optional parameters", () => {
            const param = createParameterFromSource("callback: (x?: number) => string");
            
            expect(isFunctionParameter(param)).toBe(true);
        });

        it("should return true for function type with rest parameters", () => {
            const param = createParameterFromSource("handler: (...args: any[]) => void");
            
            expect(isFunctionParameter(param)).toBe(true);
        });

        it("should return true for async function type", () => {
            const param = createParameterFromSource("asyncFn: (x: number) => Promise<string>");
            
            expect(isFunctionParameter(param)).toBe(true);
        });
    });
});
