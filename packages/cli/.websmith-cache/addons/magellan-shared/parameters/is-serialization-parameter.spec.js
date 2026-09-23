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
const is_serialization_parameter_1 = require("./is-serialization-parameter");
const constants_1 = require("./constants");
// Mock the is-parameter module
jest.mock("./is-parameter", () => ({
    isParameter: jest.fn(),
}));
const is_parameter_1 = require("./is-parameter");
describe("isSerializationParameter", () => {
    const mockIsParameter = is_parameter_1.isParameter;
    beforeEach(() => {
        jest.clearAllMocks();
    });
    afterEach(() => {
        jest.resetAllMocks();
    });
    it("should return true when isParameter returns true for Serialization type", () => {
        // Create a mock parameter declaration
        const mockParam = {};
        mockIsParameter.mockReturnValue(true);
        const result = (0, is_serialization_parameter_1.isSerializationParameter)(mockParam);
        expect(result).toBe(true);
        expect(mockIsParameter).toHaveBeenCalledWith(mockParam, constants_1.SERIALIZATION_TYPE_NAME);
        expect(mockIsParameter).toHaveBeenCalledTimes(1);
    });
    it("should return false when isParameter returns false", () => {
        // Create a mock parameter declaration
        const mockParam = {};
        mockIsParameter.mockReturnValue(false);
        const result = (0, is_serialization_parameter_1.isSerializationParameter)(mockParam);
        expect(result).toBe(false);
        expect(mockIsParameter).toHaveBeenCalledWith(mockParam, constants_1.SERIALIZATION_TYPE_NAME);
        expect(mockIsParameter).toHaveBeenCalledTimes(1);
    });
    it("should pass the correct SERIALIZATION_TYPE_NAME constant", () => {
        const mockParam = {};
        mockIsParameter.mockReturnValue(false);
        (0, is_serialization_parameter_1.isSerializationParameter)(mockParam);
        expect(mockIsParameter).toHaveBeenCalledWith(mockParam, "Serialization");
    });
    it("should handle different parameter declaration structures", () => {
        // Test with different mock parameter structures
        const testCases = [
            { name: "simple param", param: { kind: typescript_1.default.SyntaxKind.Parameter } },
            { name: "param with type", param: { kind: typescript_1.default.SyntaxKind.Parameter, type: {} } },
            { name: "param with name", param: { kind: typescript_1.default.SyntaxKind.Parameter, name: {} } },
        ];
        testCases.forEach(({ name: _name, param }, index) => {
            mockIsParameter.mockReturnValue(index % 2 === 0); // Alternate true/false
            const result = (0, is_serialization_parameter_1.isSerializationParameter)(param);
            expect(result).toBe(index % 2 === 0);
            expect(mockIsParameter).toHaveBeenCalledWith(param, constants_1.SERIALIZATION_TYPE_NAME);
        });
        expect(mockIsParameter).toHaveBeenCalledTimes(testCases.length);
    });
    describe("integration with actual TypeScript nodes", () => {
        const createParameterFromSource = (source) => {
            const sourceFile = typescript_1.default.createSourceFile("test.ts", source, typescript_1.default.ScriptTarget.Latest, true);
            const functionDeclaration = sourceFile.statements[0];
            return functionDeclaration.parameters[0];
        };
        // For integration tests, we'll test with the mocked isParameter but control its behavior
        it("should work with real TypeScript AST nodes - Serialization parameter", () => {
            const source = "function test(serialization: Serialization) {}";
            const param = createParameterFromSource(source);
            // Mock isParameter to return true for Serialization type
            mockIsParameter.mockImplementation((param, typeName) => {
                return typeName === "Serialization" && param.type?.kind === typescript_1.default.SyntaxKind.TypeReference;
            });
            const result = (0, is_serialization_parameter_1.isSerializationParameter)(param);
            expect(result).toBe(true);
            expect(mockIsParameter).toHaveBeenCalledWith(param, constants_1.SERIALIZATION_TYPE_NAME);
        });
        it("should work with real TypeScript AST nodes - non-Serialization parameter", () => {
            const source = "function test(context: Context) {}";
            const param = createParameterFromSource(source);
            // Mock isParameter to return false for non-Serialization types
            // Since we're asking for "Serialization" but the parameter is "Context", it should return false
            mockIsParameter.mockReturnValue(false);
            const result = (0, is_serialization_parameter_1.isSerializationParameter)(param);
            expect(result).toBe(false);
            expect(mockIsParameter).toHaveBeenCalledWith(param, constants_1.SERIALIZATION_TYPE_NAME);
        });
        it("should work with real TypeScript AST nodes - parameter without type", () => {
            const source = "function test(param) {}";
            const param = createParameterFromSource(source);
            // Mock isParameter to return false for parameters without types
            mockIsParameter.mockReturnValue(false);
            const result = (0, is_serialization_parameter_1.isSerializationParameter)(param);
            expect(result).toBe(false);
            expect(mockIsParameter).toHaveBeenCalledWith(param, constants_1.SERIALIZATION_TYPE_NAME);
        });
    });
});
