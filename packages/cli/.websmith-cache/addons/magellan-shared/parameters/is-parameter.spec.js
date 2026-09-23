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
const is_parameter_1 = require("./is-parameter");
describe("isParameter", () => {
    // Helper function to create a parameter declaration from source code
    const createParameterFromSource = (parameterCode) => {
        const sourceCode = `function test(${parameterCode}) {}`;
        const sourceFile = typescript_1.default.createSourceFile("test.ts", sourceCode, typescript_1.default.ScriptTarget.Latest, true);
        const functionDeclaration = sourceFile.statements[0];
        return functionDeclaration.parameters[0];
    };
    describe("matching parameters", () => {
        it("should return true for exact type match", () => {
            const param = createParameterFromSource("data: UserData");
            expect((0, is_parameter_1.isParameter)(param, "UserData")).toBe(true);
        });
        it("should return true for exact type match with different parameter name", () => {
            const param = createParameterFromSource("config: Configuration");
            expect((0, is_parameter_1.isParameter)(param, "Configuration")).toBe(true);
        });
        it("should return true for single character type", () => {
            const param = createParameterFromSource("value: T");
            expect((0, is_parameter_1.isParameter)(param, "T")).toBe(true);
        });
        it("should return true for type with numbers", () => {
            const param = createParameterFromSource("item: Item2D");
            expect((0, is_parameter_1.isParameter)(param, "Item2D")).toBe(true);
        });
        it("should return true for type with underscores", () => {
            const param = createParameterFromSource("data: User_Data");
            expect((0, is_parameter_1.isParameter)(param, "User_Data")).toBe(true);
        });
    });
    describe("non-matching parameters", () => {
        it("should return false for different type", () => {
            const param = createParameterFromSource("data: UserData");
            expect((0, is_parameter_1.isParameter)(param, "ConfigData")).toBe(false);
        });
        it("should return false for case-sensitive mismatch", () => {
            const param = createParameterFromSource("data: UserData");
            expect((0, is_parameter_1.isParameter)(param, "userdata")).toBe(false);
        });
        it("should return false for partial type match", () => {
            const param = createParameterFromSource("data: UserDataConfig");
            expect((0, is_parameter_1.isParameter)(param, "UserData")).toBe(false);
        });
        it("should return false for primitive types", () => {
            const param = createParameterFromSource("name: string");
            expect((0, is_parameter_1.isParameter)(param, "string")).toBe(false);
        });
        it("should return false for number type", () => {
            const param = createParameterFromSource("count: number");
            expect((0, is_parameter_1.isParameter)(param, "number")).toBe(false);
        });
        it("should return false for boolean type", () => {
            const param = createParameterFromSource("flag: boolean");
            expect((0, is_parameter_1.isParameter)(param, "boolean")).toBe(false);
        });
        it("should return false for array types", () => {
            const param = createParameterFromSource("items: string[]");
            expect((0, is_parameter_1.isParameter)(param, "string")).toBe(false);
        });
    });
    describe("edge cases", () => {
        it("should return false for parameter without type annotation", () => {
            const param = createParameterFromSource("param");
            expect((0, is_parameter_1.isParameter)(param, "any")).toBe(false);
        });
        it("should return false for destructured parameter", () => {
            const param = createParameterFromSource("{ name, age }: UserData");
            expect((0, is_parameter_1.isParameter)(param, "UserData")).toBe(false);
        });
        it("should return false for array destructured parameter", () => {
            const param = createParameterFromSource("[first, second]: string[]");
            expect((0, is_parameter_1.isParameter)(param, "string")).toBe(false);
        });
        it("should return false for union type", () => {
            const param = createParameterFromSource("value: string | number");
            expect((0, is_parameter_1.isParameter)(param, "string")).toBe(false);
        });
        it("should return false for intersection type", () => {
            const param = createParameterFromSource("obj: UserData & ConfigData");
            expect((0, is_parameter_1.isParameter)(param, "UserData")).toBe(false);
        });
        it("should return false for function type", () => {
            const param = createParameterFromSource("callback: (x: number) => string");
            expect((0, is_parameter_1.isParameter)(param, "Function")).toBe(false);
        });
        it("should return false for mapped type", () => {
            const sourceCode = `
                type MappedType = { [K in keyof UserData]: string };
                function test(param: MappedType) {}
            `;
            const sourceFile = typescript_1.default.createSourceFile("test.ts", sourceCode, typescript_1.default.ScriptTarget.Latest, true);
            const functionDeclaration = sourceFile.statements[1];
            const param = functionDeclaration.parameters[0];
            expect((0, is_parameter_1.isParameter)(param, "MappedType")).toBe(false);
        });
        it("should return false for qualified type name", () => {
            const sourceCode = `
                namespace MyNamespace {
                    export type MyType = string;
                }
                function test(param: MyNamespace.MyType) {}
            `;
            const sourceFile = typescript_1.default.createSourceFile("test.ts", sourceCode, typescript_1.default.ScriptTarget.Latest, true);
            const functionDeclaration = sourceFile.statements[1];
            const param = functionDeclaration.parameters[0];
            expect((0, is_parameter_1.isParameter)(param, "MyType")).toBe(false);
        });
    });
    describe("empty and null checks", () => {
        it("should return false when checking for empty string type", () => {
            const param = createParameterFromSource("data: UserData");
            expect((0, is_parameter_1.isParameter)(param, "")).toBe(false);
        });
        it("should return false when type parameter is whitespace", () => {
            const param = createParameterFromSource("data: UserData");
            expect((0, is_parameter_1.isParameter)(param, "   ")).toBe(false);
        });
    });
    describe("complex scenarios", () => {
        it("should handle optional parameters correctly", () => {
            const param = createParameterFromSource("data?: UserData");
            expect((0, is_parameter_1.isParameter)(param, "UserData")).toBe(true);
        });
        it("should handle parameters with default values", () => {
            const param = createParameterFromSource("data: UserData = defaultValue");
            expect((0, is_parameter_1.isParameter)(param, "UserData")).toBe(true);
        });
        it("should handle readonly parameters", () => {
            const param = createParameterFromSource("data: readonly UserData");
            expect((0, is_parameter_1.isParameter)(param, "UserData")).toBe(false);
        });
        it("should distinguish between similar type names", () => {
            const param1 = createParameterFromSource("data: UserData");
            const param2 = createParameterFromSource("data: UserDataExtended");
            expect((0, is_parameter_1.isParameter)(param1, "UserData")).toBe(true);
            expect((0, is_parameter_1.isParameter)(param2, "UserData")).toBe(false);
            expect((0, is_parameter_1.isParameter)(param2, "UserDataExtended")).toBe(true);
        });
    });
});
