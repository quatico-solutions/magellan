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
const typescript_1 = __importDefault(require("typescript"));
const magellan_shared_1 = require("../magellan-shared");
const client_code_remover_1 = require("./client-code-remover");
const client_function_transformer_1 = require("./client-function-transformer");
const create_client_imports_1 = require("./create-client-imports");
exports.REMOTE_INVOKE_PARAM_NAME = "remoteInvoke";
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
