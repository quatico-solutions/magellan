/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import ts from "typescript";
import { CONTEXT_TYPE_NAME, SERIALIZATION_TYPE_NAME } from "./constants";

/**
 * Creates an object parameter with destructuring from a primitive parameter
 * @param factory TypeScript node factory
 * @param param The parameter to objectify
 * @returns A new parameter with object destructuring
 */
export const createObjectParameter = (factory: ts.NodeFactory, param: ts.ParameterDeclaration): ts.ParameterDeclaration => {
    // Get the parameter name as text
    const paramName = ts.isIdentifier(param.name) ? param.name.text : param.name.getText?.();

    // Create object parameter: { paramName: type }
    const objectLiteralType = factory.createTypeLiteralNode([
        factory.createPropertySignature(undefined, factory.createIdentifier(paramName), undefined, param.type),
    ]);

    // Create parameter with destructuring: ({ paramName }: { paramName: type })
    const objectBindingPattern = factory.createObjectBindingPattern([
        factory.createBindingElement(undefined, undefined, factory.createIdentifier(paramName), undefined),
    ]);

    return factory.createParameterDeclaration(
        param.modifiers,
        undefined,
        objectBindingPattern,
        param.questionToken,
        objectLiteralType,
        param.initializer
    );
};

/**
 * Checks if the import is already present in the source file
 * @param sf The source file to check
 * @param modulePath The module path
 * @param importName The name of the import to check
 * @returns True if the import is already present
 */
export const hasImport = (sf: ts.SourceFile, modulePath: string, importName: string): boolean => {
    return sf.statements.some(
        stmt =>
            ts.isImportDeclaration(stmt) &&
            ts.isStringLiteral(stmt.moduleSpecifier) &&
            stmt.moduleSpecifier.text === modulePath &&
            stmt.importClause?.namedBindings &&
            ts.isNamedImports(stmt.importClause.namedBindings) &&
            stmt.importClause.namedBindings.elements.some(el => el.name.text === importName)
    );
};

/**
 * Checks if a parameter is a Context parameter
 * @param param The parameter to check
 * @returns True if the parameter is a ctx or context parameter with Context type
 */
export const isContextParameter = (param: ts.ParameterDeclaration): boolean => {
    return isParameter(param, CONTEXT_TYPE_NAME);
};

/**
 * Checks if a parameter declaration is the Serialization parameter.
 */
export function isSerializationParameter(param: ts.ParameterDeclaration): boolean {
    return isParameter(param, SERIALIZATION_TYPE_NAME);
}

/**
 * Checks if a parameter declaration is a specific parameter with a given type.
 * @param param The parameter to check
 * @param type The expected type of the parameter
 * @returns True if the parameter matches the type
 */
function isParameter(param: ts.ParameterDeclaration, type: string): boolean {
    return (
        ts.isIdentifier(param.name) &&
        !!param.type &&
        ts.isTypeReferenceNode(param.type) &&
        ts.isIdentifier(param.type.typeName) &&
        param.type.typeName.text === type
    );
}

/**
 * Checks if a parameter is a destructured object parameter
 */
export function isDestructuredParameter(param: ts.ParameterDeclaration): boolean {
    return ts.isObjectBindingPattern(param.name) || ts.isArrayBindingPattern(param.name);
}

/**
 * Checks if a parameter is a function type
 */
export function isFunctionParameter(param: ts.ParameterDeclaration): boolean {
    if (!param.type) {
        return false;
    }

    // Check for arrow function type
    if (ts.isFunctionTypeNode(param.type)) {
        return true;
    }

    // Check for reference to a function type
    if (ts.isTypeReferenceNode(param.type) && ts.isIdentifier(param.type.typeName)) {
        const typeText = param.type.typeName.text;
        return typeText.includes("Function") || typeText.includes("Callback");
    }

    return false;
}
