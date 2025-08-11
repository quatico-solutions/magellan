/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import ts from "typescript";
import { type AddonContext } from "@quatico/websmith-api";
import { DECORATOR_NAME } from "../magellan-shared/constants";
import { CONTEXT_TYPE_NAME, SERIALIZATION_TYPE_NAME } from "../magellan-shared/parameters/constants";
import { getDecoration, isNodeExported, isTransformable } from "../magellan-shared/node-helpers";
import { type MagellanConfig } from "../magellan-shared/magellan-config";
import { checkForCustomTypeDeclaration, validateServiceFunctionImports, validateServiceFunctionSignature } from "../magellan-shared/validation";
import { transformFunctionDeclaration } from "./transform-function-declaration";
import { transformArrowFunction } from "./transform-arrow-function";

/**
 * Creates a TypeScript transformer that processes functions decorated with @service()
 * The transformer adds Context parameter to service functions if needed
 * and adds necessary imports
 */
export const createServerTransformer = (context: AddonContext<MagellanConfig>) => {
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

                const serviceDecoration = getDecoration(sf, node, DECORATOR_NAME, context);
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
