"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClientTransformer = exports.REMOTE_INVOKE_PARAM_NAME = void 0;
/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
const websmith_api_1 = require("@quatico/websmith-api");
const path_1 = __importDefault(require("path"));
const typescript_1 = __importDefault(require("typescript"));
const magellan_shared_1 = require("../magellan-shared");
const client_code_remover_1 = require("./client-code-remover");
const client_function_transformer_1 = require("./client-function-transformer");
const create_client_imports_1 = require("./create-client-imports");
exports.REMOTE_INVOKE_PARAM_NAME = "remoteInvoke";
/**
 * Resolves a module specifier relative to the source file.
 */
const resolveModulePath = (sourceFileName, moduleSpecifier) => {
    const sourceDir = path_1.default.dirname(sourceFileName);
    let resolvedPath = path_1.default.resolve(sourceDir, moduleSpecifier);
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
const checkFileHasServiceFunctions = (filePath, context, visited = new Set()) => {
    const system = context.getSystem();
    // Resolve the file path
    let resolvedPath = filePath;
    if (!system.fileExists(resolvedPath)) {
        // Try with .tsx extension
        const tsxPath = resolvedPath.replace(/\.ts$/, ".tsx");
        if (!system.fileExists(tsxPath)) {
            // Try as directory with index.ts
            const indexPath = path_1.default.join(resolvedPath.replace(/\.ts$/, ""), "index.ts");
            if (system.fileExists(indexPath)) {
                resolvedPath = indexPath;
            }
            else {
                return false;
            }
        }
        else {
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
    const sf = typescript_1.default.createSourceFile(resolvedPath, content, typescript_1.default.ScriptTarget.Latest, true);
    let hasServiceFunctions = false;
    typescript_1.default.forEachChild(sf, node => {
        // Check for direct service function declarations
        if ((0, magellan_shared_1.isNodeExported)(node) && (0, magellan_shared_1.getDecoration)(sf, node, magellan_shared_1.DECORATOR_NAME, context)) {
            hasServiceFunctions = true;
        }
        // Check for re-exports from other files (nested barrel file support)
        if (typescript_1.default.isExportDeclaration(node) && node.moduleSpecifier && typescript_1.default.isStringLiteral(node.moduleSpecifier)) {
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
const hasServiceReExports = (sf, context) => {
    let result = false;
    typescript_1.default.forEachChild(sf, node => {
        if (typescript_1.default.isExportDeclaration(node) && node.moduleSpecifier && typescript_1.default.isStringLiteral(node.moduleSpecifier)) {
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
const createClientTransformer = (context) => {
    return (ctx) => {
        return (sf) => {
            // Check for any Context or Serialization type declarations and throw error
            (0, magellan_shared_1.checkForCustomTypeDeclaration)(sf, magellan_shared_1.CONTEXT_TYPE_NAME);
            (0, magellan_shared_1.checkForCustomTypeDeclaration)(sf, magellan_shared_1.SERIALIZATION_TYPE_NAME);
            // Check if this file has any service functions
            let currentFileHasServiceFunctions = false;
            typescript_1.default.forEachChild(sf, node => {
                if ((0, magellan_shared_1.isNodeExported)(node) && (0, magellan_shared_1.getDecoration)(sf, node, magellan_shared_1.DECORATOR_NAME, context)) {
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
            const withoutServerCode = typescript_1.default.visitNode(sf, (0, client_code_remover_1.clientSideCodeRemover)(ctx, sf, context), typescript_1.default.isSourceFile);
            if (!withoutServerCode) {
                context.getReporter().reportDiagnostic(new websmith_api_1.ErrorMessage("Failed to remove code not needed on the client side"));
                return sf;
            }
            // Transform service functions to client invocations
            const transformed = typescript_1.default.visitNode(withoutServerCode, (0, client_function_transformer_1.clientFunctionTransformer)(ctx, sf, context), typescript_1.default.isSourceFile);
            if (!transformed) {
                context.getReporter().reportDiagnostic(new websmith_api_1.ErrorMessage("Failed to transform service functions to client invocations"));
                return sf;
            }
            // Create the necessary import declarations
            const importNodes = (0, create_client_imports_1.createClientImports)(ctx.factory);
            // Prepend the imports to the transformed file
            return ctx.factory.updateSourceFile(transformed, [...importNodes, ...transformed.statements]);
        };
    };
};
exports.createClientTransformer = createClientTransformer;
