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
const create_object_parameter_1 = require("./create-object-parameter");
describe("createObjectParameter", () => {
    it("should create an object parameter with destructuring", () => {
        // Create a regular parameter to objectify
        const originalParam = typescript_1.default.factory.createParameterDeclaration(undefined, undefined, typescript_1.default.factory.createIdentifier("userId"), undefined, typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.StringKeyword), undefined);
        // Call createObjectParameter
        const objectParam = (0, create_object_parameter_1.createObjectParameter)(typescript_1.default.factory, originalParam);
        // Verify the result is a parameter declaration
        expect(objectParam.kind === typescript_1.default.SyntaxKind.Parameter).toBe(true);
        // Verify it has an object binding pattern
        expect(objectParam.name.kind === typescript_1.default.SyntaxKind.ObjectBindingPattern).toBe(true);
        // Verify it has a type literal node
        expect(objectParam.type !== undefined && objectParam.type.kind === typescript_1.default.SyntaxKind.TypeLiteral).toBe(true);
        // Verify the binding pattern contains the original parameter name
        const bindingPattern = objectParam.name;
        expect(bindingPattern.elements).toHaveLength(1);
        expect(bindingPattern.elements[0].kind === typescript_1.default.SyntaxKind.BindingElement).toBe(true);
        expect(bindingPattern.elements[0].name.text).toBe("userId");
    });
});
