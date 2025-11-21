/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type AddonContext, ErrorMessage } from "@quatico/websmith-api";
import path from "path";
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
 * Resolves a module specifier relative to the source file.
 */
const resolveModulePath = (sourceFileName: string, moduleSpecifier: string): string => {
    const sourceDir = path.dirname(sourceFileName);
    let resolvedPath = path.resolve(sourceDir, moduleSpecifier);

    // Add .ts extension if not present
    if (!resolvedPath.endsWith(".ts") && !resolvedPath.endsWith(".tsx")) {
        resolvedPath = resolvedPath + ".ts";
    }

    return resolvedPath;
};

/**
 * Checks if a file contains service function annotations or re-exports from service files.
 * Uses a visited set to prevent infinite recursion with circular dependencies.
 */
const checkFileHasServiceFunctions = (
    filePath: string,
    context: AddonContext<MagellanConfig>,
    visited: Set<string> = new Set()
): boolean => {
    const system = context.getSystem();

    // Resolve the file path
    let resolvedPath = filePath;
    if (!system.fileExists(resolvedPath)) {
        // Try with .tsx extension
        const tsxPath = resolvedPath.replace(/\.ts$/, ".tsx");
        if (!system.fileExists(tsxPath)) {
            // Try as directory with index.ts
            const indexPath = path.join(resolvedPath.replace(/\.ts$/, ""), "index.ts");
            if (system.fileExists(indexPath)) {
                resolvedPath = indexPath;
            } else {
                return false;
            }
        } else {
            resolvedPath = tsxPath;
        }
    }

    // Prevent infinite recursion
    if (visited.has(resolvedPath)) {
        return false;
    }
    visited.add(resolvedPath);

    const content = system.readFile(resolvedPath);
    if (!content) {
        return false;
    }

    const sf = ts.createSourceFile(resolvedPath, content, ts.ScriptTarget.Latest, true);

    let hasServiceFunctions = false;
    ts.forEachChild(sf, node => {
        // Check for direct service function declarations
        if (isNodeExported(node) && getDecoration(sf, node, DECORATOR_NAME, context)) {
            hasServiceFunctions = true;
        }
        // Check for re-exports from other files (nested barrel file support)
        if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
            const modulePath = resolveModulePath(resolvedPath, node.moduleSpecifier.text);
            if (checkFileHasServiceFunctions(modulePath, context, visited)) {
                hasServiceFunctions = true;
            }
        }
    });

    return hasServiceFunctions;
};

/**
 * Checks if a file has re-exports that point to service files.
 */
const hasServiceReExports = (sf: ts.SourceFile, context: AddonContext<MagellanConfig>): boolean => {
    let result = false;

    ts.forEachChild(sf, node => {
        if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
            const modulePath = resolveModulePath(sf.fileName, node.moduleSpecifier.text);
            if (checkFileHasServiceFunctions(modulePath, context)) {
                result = true;
            }
        }
    });

    return result;
};

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
                // Check if this file re-exports from service files (barrel file pattern)
                if (hasServiceReExports(sf, context)) {
                    // Mark this file as processed so it gets emitted in addonEmitOnly mode
                    context.markFileAsAddonProcessed(sf.fileName);
                    // Return an updated source file
                    // The content stays the same, but we create a new SourceFile object
                    return ctx.factory.updateSourceFile(sf, sf.statements);
                }
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
