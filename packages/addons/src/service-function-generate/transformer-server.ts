/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import ts from "typescript";
import { CONTEXT_TYPE_NAME, DECORATOR_NAME, SERIALIZATION_TYPE_NAME } from "../magellan-shared/constants";
import { getDecoration, isNodeExported, isTransformable } from "../magellan-shared/node-helpers";
import { createObjectParameter } from "../magellan-shared/transform-utils";
import { checkForCustomTypeDeclaration, validateServiceFunctionImports, validateServiceFunctionSignature } from "../magellan-shared/validation";

/**
 * Creates a TypeScript transformer that processes functions decorated with @service()
 * The transformer adds Context parameter to service functions if needed
 * and adds necessary imports
 */
export const createServerTransformer = () => {
    return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return (sf: ts.SourceFile) => {
            // Check for any Context or Serialization type declarations and throw error
            checkForCustomTypeDeclaration(sf, CONTEXT_TYPE_NAME);
            checkForCustomTypeDeclaration(sf, SERIALIZATION_TYPE_NAME);

            // Transform nodes to add Context parameter
            const visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
                if (ts.isSourceFile(node)) {
                    return ts.visitEachChild(node, visitor, ctx);
                }

                if (!isNodeExported(node) || !isTransformable(node)) {
                    return node;
                }

                const serviceDecoration = getDecoration(sf, node, DECORATOR_NAME);
                if (!serviceDecoration) {
                    return node;
                }

                if (ts.isVariableStatement(node)) {
                    const declaration = node.declarationList.declarations[0];
                    if (declaration.initializer && ts.isArrowFunction(declaration.initializer)) {
                        validateServiceFunctionSignature(declaration.initializer.parameters);
                        validateServiceFunctionImports(sf);
                        return transformArrowFunction(node, ctx);
                    }
                    return node;
                }

                if (ts.isFunctionDeclaration(node)) {
                    validateServiceFunctionSignature(node.parameters);
                    validateServiceFunctionImports(sf);
                    return transformFunctionDeclaration(node, ctx);
                }
                return node;
            };

            return ts.visitNode(sf, visitor, ts.isSourceFile);
        };
    };
};

/**
 * Transforms an arrow function to ensure it has the Context parameter
 */
function transformArrowFunction(node: ts.VariableStatement, ctx: ts.TransformationContext): ts.Node {
    const declaration = node.declarationList.declarations[0];
    if (!declaration.initializer || !ts.isArrowFunction(declaration.initializer)) {
        return node;
    }

    const arrowFunc = declaration.initializer;
    const [inputParam, contextParam, serializationParam] = arrowFunc.parameters;
    const updatedParams: ts.ParameterDeclaration[] = [createObjectParameter(ctx.factory, inputParam), contextParam, serializationParam];

    const updatedArrow = ctx.factory.updateArrowFunction(
        arrowFunc,
        arrowFunc.modifiers,
        arrowFunc.typeParameters,
        updatedParams,
        arrowFunc.type,
        arrowFunc.equalsGreaterThanToken,
        arrowFunc.body
    );

    return ctx.factory.updateVariableStatement(
        node,
        node.modifiers,
        ctx.factory.updateVariableDeclarationList(node.declarationList, [
            ctx.factory.updateVariableDeclaration(declaration, declaration.name, declaration.exclamationToken, declaration.type, updatedArrow),
            ...node.declarationList.declarations.slice(1),
        ])
    );
}

/**
 * Transforms a function declaration to ensure it has the Context parameter
 */
function transformFunctionDeclaration(node: ts.FunctionDeclaration, ctx: ts.TransformationContext): ts.Node {
    if (!node.body) {
        return node;
    }

    const [inputParam, contextParam, serializationParam] = node.parameters;
    const updatedParams: ts.ParameterDeclaration[] = [createObjectParameter(ctx.factory, inputParam), contextParam, serializationParam];

    return ctx.factory.updateFunctionDeclaration(
        node,
        node.modifiers,
        node.asteriskToken,
        node.name,
        node.typeParameters,
        updatedParams,
        node.type,
        node.body
    );
}
