/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import ts from "typescript";
import { isSerializationParameter } from "./is-serialization-parameter";
import { SERIALIZATION_TYPE_NAME } from "./constants";

// Mock the is-parameter module
jest.mock("./is-parameter", () => ({
    isParameter: jest.fn(),
}));

import { isParameter } from "./is-parameter";

describe("isSerializationParameter", () => {
    const mockIsParameter = isParameter as jest.MockedFunction<typeof isParameter>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("should return true when isParameter returns true for Serialization type", () => {
        // Create a mock parameter declaration
        const mockParam = {} as ts.ParameterDeclaration;
        mockIsParameter.mockReturnValue(true);

        const result = isSerializationParameter(mockParam);

        expect(result).toBe(true);
        expect(mockIsParameter).toHaveBeenCalledWith(mockParam, SERIALIZATION_TYPE_NAME);
        expect(mockIsParameter).toHaveBeenCalledTimes(1);
    });

    it("should return false when isParameter returns false", () => {
        // Create a mock parameter declaration
        const mockParam = {} as ts.ParameterDeclaration;
        mockIsParameter.mockReturnValue(false);

        const result = isSerializationParameter(mockParam);

        expect(result).toBe(false);
        expect(mockIsParameter).toHaveBeenCalledWith(mockParam, SERIALIZATION_TYPE_NAME);
        expect(mockIsParameter).toHaveBeenCalledTimes(1);
    });

    it("should pass the correct SERIALIZATION_TYPE_NAME constant", () => {
        const mockParam = {} as ts.ParameterDeclaration;
        mockIsParameter.mockReturnValue(false);

        isSerializationParameter(mockParam);

        expect(mockIsParameter).toHaveBeenCalledWith(mockParam, "Serialization");
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

            const result = isSerializationParameter(param);

            expect(result).toBe(index % 2 === 0);
            expect(mockIsParameter).toHaveBeenCalledWith(param, SERIALIZATION_TYPE_NAME);
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
        it("should work with real TypeScript AST nodes - Serialization parameter", () => {
            const source = "function test(serialization: Serialization) {}";
            const param = createParameterFromSource(source);

            // Mock isParameter to return true for Serialization type
            mockIsParameter.mockImplementation((param: ts.ParameterDeclaration, typeName: string) => {
                return typeName === "Serialization" && param.type?.kind === ts.SyntaxKind.TypeReference;
            });

            const result = isSerializationParameter(param);

            expect(result).toBe(true);
            expect(mockIsParameter).toHaveBeenCalledWith(param, SERIALIZATION_TYPE_NAME);
        });

        it("should work with real TypeScript AST nodes - non-Serialization parameter", () => {
            const source = "function test(context: Context) {}";
            const param = createParameterFromSource(source);

            // Mock isParameter to return false for non-Serialization types
            // Since we're asking for "Serialization" but the parameter is "Context", it should return false
            mockIsParameter.mockReturnValue(false);

            const result = isSerializationParameter(param);

            expect(result).toBe(false);
            expect(mockIsParameter).toHaveBeenCalledWith(param, SERIALIZATION_TYPE_NAME);
        });

        it("should work with real TypeScript AST nodes - parameter without type", () => {
            const source = "function test(param) {}";
            const param = createParameterFromSource(source);

            // Mock isParameter to return false for parameters without types
            mockIsParameter.mockReturnValue(false);

            const result = isSerializationParameter(param);

            expect(result).toBe(false);
            expect(mockIsParameter).toHaveBeenCalledWith(param, SERIALIZATION_TYPE_NAME);
        });
    });
});
