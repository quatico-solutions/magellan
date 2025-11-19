"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServerTransformer = void 0;
/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
const typescript_1 = __importDefault(require("typescript"));
const constants_1 = require("../magellan-shared/constants");
const constants_2 = require("../magellan-shared/parameters/constants");
const node_helpers_1 = require("../magellan-shared/node-helpers");
const validation_1 = require("../magellan-shared/validation");
const transform_function_declaration_1 = require("./transform-function-declaration");
const transform_arrow_function_1 = require("./transform-arrow-function");
/**
 * Creates a TypeScript transformer that processes functions decorated with @service()
 * The transformer adds Context parameter to service functions if needed
 * and adds necessary imports
 */
const createServerTransformer = (context) => {
    return (ctx) => {
        return (sf) => {
            // Check for any Context or Serialization type declarations and throw error
            (0, validation_1.checkForCustomTypeDeclaration)(sf, constants_2.CONTEXT_TYPE_NAME);
            (0, validation_1.checkForCustomTypeDeclaration)(sf, constants_2.SERIALIZATION_TYPE_NAME);
            // Transform nodes to add Context parameter
            const visitor = (node) => {
                if (typescript_1.default.isSourceFile(node)) {
                    return typescript_1.default.visitEachChild(node, visitor, ctx);
                }
                if (!(0, node_helpers_1.isNodeExported)(node) || !(0, node_helpers_1.isTransformable)(node)) {
                    return node;
                }
                const serviceDecoration = (0, node_helpers_1.getDecoration)(sf, node, constants_1.DECORATOR_NAME, context);
                if (!serviceDecoration) {
                    return node;
                }
                if (typescript_1.default.isVariableStatement(node)) {
                    const declaration = node.declarationList.declarations[0];
                    if (declaration.initializer && typescript_1.default.isArrowFunction(declaration.initializer)) {
                        (0, validation_1.validateServiceFunctionSignature)(declaration.initializer.parameters);
                        (0, validation_1.validateServiceFunctionImports)(sf);
                        return (0, transform_arrow_function_1.transformArrowFunction)(node, ctx);
                    }
                    return node;
                }
                if (typescript_1.default.isFunctionDeclaration(node)) {
                    (0, validation_1.validateServiceFunctionSignature)(node.parameters);
                    (0, validation_1.validateServiceFunctionImports)(sf);
                    return (0, transform_function_declaration_1.transformFunctionDeclaration)(node, ctx);
                }
                return node;
            };
            return typescript_1.default.visitNode(sf, visitor, typescript_1.default.isSourceFile);
        };
    };
};
exports.createServerTransformer = createServerTransformer;
