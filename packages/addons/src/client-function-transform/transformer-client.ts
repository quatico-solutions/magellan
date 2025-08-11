/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type AddonContext, ErrorMessage } from "@quatico/websmith-api";
import ts from "typescript";
import {
    checkForCustomTypeDeclaration,
    CONTEXT_TYPE_NAME,
    DECORATOR_NAME,
    getDecoration,
    isNodeExported,
    type MagellanConfig,
    SERIALIZATION_TYPE_NAME,
} from "../magellan-shared";
import { clientSideCodeRemover } from "./client-code-remover";
import { clientFunctionTransformer } from "./client-function-transformer";
import { createClientImports } from "./create-client-imports";

export const REMOTE_INVOKE_PARAM_NAME = "remoteInvoke";

/**
 * Creates a transformer that converts service functions into client invocations.
 */
export const createClientTransformer = (context: AddonContext<MagellanConfig>) => {
    return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return (sf: ts.SourceFile) => {
            // Check for any Context or Serialization type declarations and throw error
            checkForCustomTypeDeclaration(sf, CONTEXT_TYPE_NAME);
            checkForCustomTypeDeclaration(sf, SERIALIZATION_TYPE_NAME);

            // Check if this file has any service functions
            let currentFileHasServiceFunctions = false;
            ts.forEachChild(sf, node => {
                if (isNodeExported(node) && getDecoration(sf, node, DECORATOR_NAME, context)) {
                    currentFileHasServiceFunctions = true;
                }
            });

            if (!currentFileHasServiceFunctions) {
                return sf;
            }

            // Transform the source file
            // Keep only service functions and type declarations
            const withoutServerCode = ts.visitNode(sf, clientSideCodeRemover(ctx, sf, context), ts.isSourceFile);
            if (!withoutServerCode) {
                context.getReporter().reportDiagnostic(new ErrorMessage("Failed to remove code not needed on the client side"));
                return sf;
            }

            // Transform service functions to client invocations
            const transformed = ts.visitNode(withoutServerCode, clientFunctionTransformer(ctx, sf, context), ts.isSourceFile);
            if (!transformed) {
                context.getReporter().reportDiagnostic(new ErrorMessage("Failed to transform service functions to client invocations"));
                return sf;
            }

            // Create the necessary import declarations
            const importNodes = createClientImports(ctx.factory);

            // Prepend the imports to the transformed file
            return ctx.factory.updateSourceFile(transformed, [...importNodes, ...transformed.statements]);
        };
    };
};
