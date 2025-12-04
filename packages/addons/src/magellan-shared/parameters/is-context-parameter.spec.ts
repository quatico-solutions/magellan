/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import ts from "typescript";
import { isContextParameter } from "./is-context-parameter";
import { CONTEXT_TYPE_NAME } from "./constants";

// Mock the is-parameter module
jest.mock("./is-parameter", () => ({
    isParameter: jest.fn(),
}));

import { isParameter } from "./is-parameter";

describe("isContextParameter", () => {
    const mockIsParameter = isParameter as jest.MockedFunction<typeof isParameter>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should return true when isParameter returns true for Context type", () => {
        // Create a mock parameter declaration
        const mockParam = {} as ts.ParameterDeclaration;
        mockIsParameter.mockReturnValue(true);

        const result = isContextParameter(mockParam);

        expect(result).toBe(true);
        expect(mockIsParameter).toHaveBeenCalledWith(mockParam, CONTEXT_TYPE_NAME);
        expect(mockIsParameter).toHaveBeenCalledTimes(1);
    });

    it("should return false when isParameter returns false", () => {
        // Create a mock parameter declaration
        const mockParam = {} as ts.ParameterDeclaration;
        mockIsParameter.mockReturnValue(false);

        const result = isContextParameter(mockParam);

        expect(result).toBe(false);
        expect(mockIsParameter).toHaveBeenCalledWith(mockParam, CONTEXT_TYPE_NAME);
        expect(mockIsParameter).toHaveBeenCalledTimes(1);
    });

    it("should pass the correct CONTEXT_TYPE_NAME constant", () => {
        const mockParam = {} as ts.ParameterDeclaration;
        mockIsParameter.mockReturnValue(false);

        isContextParameter(mockParam);

        expect(mockIsParameter).toHaveBeenCalledWith(mockParam, "Context");
    });

    it("should handle different parameter declaration structures", () => {
        // Test with different mock parameter structures
        const testCases = [
            { name: "simple param", param: { kind: ts.SyntaxKind.Parameter } as ts.ParameterDeclaration },
            { name: "param with type", param: { kind: ts.SyntaxKind.Parameter, type: {} } as ts.ParameterDeclaration },
            { name: "param with name", param: { kind: ts.SyntaxKind.Parameter, name: {} } as ts.ParameterDeclaration },
        ];

        testCases.forEach(({ name: _name, param }, index) => {
            mockIsParameter.mockReturnValue(index % 2 === 0); // Alternate true/false

            const result = isContextParameter(param);

            expect(result).toBe(index % 2 === 0);
            expect(mockIsParameter).toHaveBeenCalledWith(param, CONTEXT_TYPE_NAME);
        });

        expect(mockIsParameter).toHaveBeenCalledTimes(testCases.length);
    });

    describe("integration with actual TypeScript nodes", () => {
        const createParameterFromSource = (source: string): ts.ParameterDeclaration => {
            const sourceFile = ts.createSourceFile("test.ts", source, ts.ScriptTarget.Latest, true);
            const functionDeclaration = sourceFile.statements[0] as ts.FunctionDeclaration;
            return functionDeclaration.parameters[0];
        };

        // For integration tests, we'll test with the mocked isParameter but control its behavior
        it("should work with real TypeScript AST nodes - Context parameter", () => {
            const source = "function test(context: Context) {}";
            const param = createParameterFromSource(source);

            // Mock isParameter to return true for Context type
            mockIsParameter.mockImplementation((param: ts.ParameterDeclaration, typeName: string) => {
                return typeName === "Context" && param.type?.kind === ts.SyntaxKind.TypeReference;
            });

            const result = isContextParameter(param);

            expect(result).toBe(true);
            expect(mockIsParameter).toHaveBeenCalledWith(param, CONTEXT_TYPE_NAME);
        });

        it("should work with real TypeScript AST nodes - ctx parameter", () => {
            const source = "function test(ctx: Context) {}";
            const param = createParameterFromSource(source);

            // Mock isParameter to return true for Context type
            mockIsParameter.mockImplementation((param: ts.ParameterDeclaration, typeName: string) => {
                return typeName === "Context" && param.type?.kind === ts.SyntaxKind.TypeReference;
            });

            const result = isContextParameter(param);

            expect(result).toBe(true);
            expect(mockIsParameter).toHaveBeenCalledWith(param, CONTEXT_TYPE_NAME);
        });

        it("should work with real TypeScript AST nodes - Context with generic type argument", () => {
            const source = "function test(ctx: Context<{ foo: string }>) {}";
            const param = createParameterFromSource(source);

            // Mock isParameter to return true for Context with generics
            mockIsParameter.mockImplementation((param: ts.ParameterDeclaration, typeName: string) => {
                return typeName === "Context" && param.type?.kind === ts.SyntaxKind.TypeReference;
            });

            const result = isContextParameter(param);

            expect(result).toBe(true);
            expect(mockIsParameter).toHaveBeenCalledWith(param, CONTEXT_TYPE_NAME);
        });

        it("should work with real TypeScript AST nodes - non-Context parameter", () => {
            const source = "function test(serialization: Serialization) {}";
            const param = createParameterFromSource(source);

            // Mock isParameter to return false for non-Context types
            // Since we're asking for "Context" but the parameter is "Serialization", it should return false
            mockIsParameter.mockReturnValue(false);

            const result = isContextParameter(param);

            expect(result).toBe(false);
            expect(mockIsParameter).toHaveBeenCalledWith(param, CONTEXT_TYPE_NAME);
        });

        it("should work with real TypeScript AST nodes - parameter without type", () => {
            const source = "function test(param) {}";
            const param = createParameterFromSource(source);

            // Mock isParameter to return false for parameters without types
            mockIsParameter.mockReturnValue(false);

            const result = isContextParameter(param);

            expect(result).toBe(false);
            expect(mockIsParameter).toHaveBeenCalledWith(param, CONTEXT_TYPE_NAME);
        });

        it("should work with real TypeScript AST nodes - string type parameter", () => {
            const source = "function test(name: string) {}";
            const param = createParameterFromSource(source);

            // Mock isParameter to return false for primitive types
            mockIsParameter.mockReturnValue(false);

            const result = isContextParameter(param);

            expect(result).toBe(false);
            expect(mockIsParameter).toHaveBeenCalledWith(param, CONTEXT_TYPE_NAME);
        });

        it("should work with real TypeScript AST nodes - complex type parameter", () => {
            const source = "function test(data: Array<Context>) {}";
            const param = createParameterFromSource(source);

            // Mock isParameter to return false for complex types that aren't direct Context
            mockIsParameter.mockReturnValue(false);

            const result = isContextParameter(param);

            expect(result).toBe(false);
            expect(mockIsParameter).toHaveBeenCalledWith(param, CONTEXT_TYPE_NAME);
        });
    });
});
