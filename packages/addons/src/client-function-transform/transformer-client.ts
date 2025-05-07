/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import ts from "typescript";
import { CONTEXT_TYPE_NAME, DECORATOR_NAME, DEFAULT_NAMESPACE, SERIALIZATION_TYPE_NAME } from "../magellan-shared/constants";
import { getDecoration, getFunctionName, isNodeExported } from "../magellan-shared/node-helpers";
import { checkForCustomTypeDeclaration, validateServiceFunctionSignature } from "../magellan-shared/validation";

const REMOTE_INVOKE_PARAM_NAME = "remoteInvoke";

/**
 * Creates a transformer that converts service functions into client invocations.
 */
export function createClientTransformer() {
    return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return (sf: ts.SourceFile) => {
            // Check for any Context or Serialization type declarations and throw error
            checkForCustomTypeDeclaration(sf, CONTEXT_TYPE_NAME);
            checkForCustomTypeDeclaration(sf, SERIALIZATION_TYPE_NAME);

            // Check if this file has any service functions
            let currentFileHasServiceFunctions = false;
            ts.forEachChild(sf, node => {
                if (isNodeExported(node) && getDecoration(sf, node, DECORATOR_NAME)) {
                    currentFileHasServiceFunctions = true;
                }
            });

            if (!currentFileHasServiceFunctions) {
                return sf;
            }

            // Transform the source file
            // Keep only service functions and type declarations
            const withoutServerCode = ts.visitNode(sf, clientSideCodeRemover(ctx, sf), ts.isSourceFile);
            if (!withoutServerCode) {
                throw new Error("Failed to remove code not needed on the client side");
            }

            // Transform service functions to client invocations
            const transformed = ts.visitNode(withoutServerCode, clientFunctionTransformer(ctx, sf), ts.isSourceFile);
            if (!transformed) {
                throw new Error("Failed to transform service functions to client invocations");
            }

            // Create the necessary import declarations
            const importNodes = createClientImports(ctx.factory);

            // Prepend the imports to the transformed file
            return ctx.factory.updateSourceFile(transformed, [...importNodes, ...transformed.statements]);
        };
    };
}

/**
 * Creates the necessary import declarations for client functions.
 */
function createClientImports(factory: ts.NodeFactory): ts.ImportDeclaration[] {
    return [
        // import { remoteInvoke } from "@quatico/magellan-client";
        createImport(factory, REMOTE_INVOKE_PARAM_NAME, "@quatico/magellan-client"),
        // import { type Context } from "@quatico/magellan-shared";
        createImport(factory, CONTEXT_TYPE_NAME, "@quatico/magellan-shared", true),
        // import { type Serialization } from "@quatico/magellan-shared";
        createImport(factory, SERIALIZATION_TYPE_NAME, "@quatico/magellan-shared", true),
    ];
}

/**
 * Creates an import declaration
 */
function createImport(factory: ts.NodeFactory, importName: string, modulePath: string, typeOnly = false): ts.ImportDeclaration {
    const importSpecifier = factory.createImportSpecifier(typeOnly, undefined, factory.createIdentifier(importName));
    return factory.createImportDeclaration(
        undefined,
        factory.createImportClause(false, undefined, factory.createNamedImports([importSpecifier])),
        factory.createStringLiteral(modulePath)
    );
}

/**
 * Creates a visitor function that transforms service functions into client invocations.
 */
function clientFunctionTransformer(ctx: ts.TransformationContext, sf: ts.SourceFile): ts.Visitor {
    return (node: ts.Node): ts.VisitResult<ts.Node> => {
        const serviceDecoration = getDecoration(sf, node, DECORATOR_NAME);
        if (!serviceDecoration) {
            return ts.visitEachChild(node, clientFunctionTransformer(ctx, sf), ctx);
        }

        // Transform arrow function to client invocation
        if (ts.isVariableStatement(node)) {
            const declaration = node.declarationList.declarations[0];
            if (declaration.initializer && ts.isArrowFunction(declaration.initializer)) {
                validateServiceFunctionSignature(declaration.initializer.parameters);
                return transformClientFunction(
                    ctx.factory,
                    node,
                    declaration,
                    declaration.initializer,
                    serviceDecoration?.namespace || DEFAULT_NAMESPACE
                );
            }
            return node;
        }

        // Transform function declaration to client invocation
        if (ts.isFunctionDeclaration(node) && node.name) {
            validateServiceFunctionSignature(node.parameters);
            return transformClientFunction(ctx.factory, node, node, node, serviceDecoration?.namespace || DEFAULT_NAMESPACE);
        }
        return node;
    };
}

/**
 * Transforms a service function into a client invocation.
 */
function transformClientFunction(
    factory: ts.NodeFactory,
    node: ts.VariableStatement | ts.FunctionDeclaration,
    declaration: ts.VariableDeclaration | ts.FunctionDeclaration,
    func: ts.ArrowFunction | ts.FunctionDeclaration,
    namespace: string
): ts.Node {
    // Parameters are already validated by validateServiceFunctionSignature
    const inputParam = func.parameters[0];
    const dataProperties: ts.PropertyAssignment[] = [];

    // Create data property only if the input parameter is not named '_'
    if (ts.isIdentifier(inputParam.name) && inputParam.name.text !== "_") {
        dataProperties.push(
            factory.createPropertyAssignment(factory.createIdentifier(inputParam.name.text), factory.createIdentifier(inputParam.name.text))
        );
    } else if (!ts.isIdentifier(inputParam.name) || inputParam.name.text !== "_") {
        // Handle cases where the first parameter might be complex but not '_' - this shouldn't happen if validation is correct, but good to be safe
        // Or if it's not an identifier (e.g. binding pattern which should be caught by validation)
        // eslint-disable-next-line no-console
        console.warn(`Unexpected input parameter structure in function ${getFunctionName(declaration)}. Assuming no data payload.`);
    }

    // Create remoteInvoke call
    const invokeParams = factory.createObjectLiteralExpression(
        [
            factory.createPropertyAssignment(factory.createIdentifier("name"), factory.createStringLiteral(getFunctionName(declaration))),
            factory.createPropertyAssignment(factory.createIdentifier("data"), factory.createObjectLiteralExpression(dataProperties, false)),
            factory.createPropertyAssignment(factory.createIdentifier("namespace"), factory.createStringLiteral(namespace)),
        ],
        false
    );

    // Get context and serialization parameter names
    const contextParam = func.parameters[1];
    const contextParamName = ts.isIdentifier(contextParam.name) ? contextParam.name.text : "context";
    const serializationParam = func.parameters[2];
    const serializationParamName = ts.isIdentifier(serializationParam.name) ? serializationParam.name.text : "serialization";

    const remoteInvokeCall = factory.createCallExpression(factory.createIdentifier(REMOTE_INVOKE_PARAM_NAME), undefined, [
        invokeParams,
        factory.createIdentifier(contextParamName),
        factory.createIdentifier(serializationParamName),
    ]);
    const remoteInvokeBody = factory.createBlock([factory.createReturnStatement(remoteInvokeCall)], true);

    // Create the new arrow function
    if (ts.isVariableStatement(node)) {
        const declaration = node.declarationList.declarations[0];
        if (declaration.initializer && ts.isArrowFunction(declaration.initializer)) {
            const newArrowFunc = factory.createArrowFunction(
                declaration.initializer.modifiers,
                declaration.initializer.typeParameters,
                func.parameters,
                declaration.initializer.type,
                declaration.initializer.equalsGreaterThanToken,
                remoteInvokeBody
            );

            const newDeclaration = factory.createVariableDeclaration(declaration.name, declaration.exclamationToken, declaration.type, newArrowFunc);

            return factory.createVariableStatement(
                node.modifiers,
                factory.createVariableDeclarationList([newDeclaration], node.declarationList.flags)
            );
        }
        return node;
    }

    // Create new function declaration
    if (ts.isFunctionDeclaration(node) && node.name) {
        return factory.createFunctionDeclaration(
            node.modifiers,
            node.asteriskToken,
            node.name,
            node.typeParameters,
            func.parameters,
            node.type,
            remoteInvokeBody
        );
    }
    return node;
}

/**
 * Creates a visitor function that removes code not needed on the client side
 */
function clientSideCodeRemover(ctx: ts.TransformationContext, sf: ts.SourceFile) {
    const ALLOWED_PACKAGES = new Set(["@quatico/magellan-client", "@quatico/magellan-shared"]);
    // These imports will be added by createClientImports, so we don't need to keep them
    const IMPORTS_ADDED_BY_CLIENT_TRANSFORMER = new Set([REMOTE_INVOKE_PARAM_NAME, CONTEXT_TYPE_NAME, SERIALIZATION_TYPE_NAME]);

    function shouldImportBeKept(node: ts.Node): boolean {
        if (!ts.isImportDeclaration(node)) {
            return false;
        }

        // What does it mean if the module specifier is a string literal
        // For example: import { something } from "package-name" <- "package-name" is the string literal
        if (!ts.isStringLiteral(node.moduleSpecifier)) {
            return false;
        }

        // Keep the import if 1. it's from an allowed package
        if (!ALLOWED_PACKAGES.has(node.moduleSpecifier.text)) {
            return false;
        }

        // and 2. it imports anything not handled by createClientImports
        if (node?.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
            return node.importClause.namedBindings.elements.some(element => !IMPORTS_ADDED_BY_CLIENT_TRANSFORMER.has(element.name.text));
        }

        return false;
    }

    return (node: ts.Node): ts.VisitResult<ts.Node> => {
        if (ts.isSourceFile(node)) {
            return ts.visitEachChild(node, clientSideCodeRemover(ctx, sf), ctx);
        }

        // Keep imports from allowed packages that aren't handled by createClientImports
        if (shouldImportBeKept(node)) {
            return node;
        }

        // Keep type declarations
        if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isEnumDeclaration(node)) {
            return node;
        }

        // Keep exported service functions
        if (isNodeExported(node)) {
            const serviceDecoration = getDecoration(sf, node, DECORATOR_NAME);
            if (serviceDecoration) {
                return node;
            }
        }

        // Remove everything else
        return ctx.factory.createNotEmittedStatement(node);
    };
}
