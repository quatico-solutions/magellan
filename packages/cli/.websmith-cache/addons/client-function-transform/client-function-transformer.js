"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientFunctionTransformer = void 0;
const typescript_1 = __importDefault(require("typescript"));
const magellan_shared_1 = require("../magellan-shared");
const transform_client_function_1 = require("./transform-client-function");
/**
 * Creates a visitor function that transforms service functions into client invocations.
 */
const clientFunctionTransformer = (ctx, sf, context) => {
    return (node) => {
        const serviceDecoration = (0, magellan_shared_1.getDecoration)(sf, node, magellan_shared_1.DECORATOR_NAME, context);
        if (!serviceDecoration) {
            return typescript_1.default.visitEachChild(node, (0, exports.clientFunctionTransformer)(ctx, sf, context), ctx);
        }
        // Transform arrow function to client invocation
        if (typescript_1.default.isVariableStatement(node)) {
            const declaration = node.declarationList.declarations[0];
            if (declaration.initializer && typescript_1.default.isArrowFunction(declaration.initializer)) {
                (0, magellan_shared_1.validateServiceFunctionSignature)(declaration.initializer.parameters);
                return (0, transform_client_function_1.transformClientFunction)(ctx.factory, node, declaration, declaration.initializer, serviceDecoration?.namespace || magellan_shared_1.DEFAULT_NAMESPACE, context);
            }
            return node;
        }
        // Transform function declaration to client invocation
        if (typescript_1.default.isFunctionDeclaration(node) && node.name) {
            (0, magellan_shared_1.validateServiceFunctionSignature)(node.parameters);
            return (0, transform_client_function_1.transformClientFunction)(ctx.factory, node, node, node, serviceDecoration?.namespace || magellan_shared_1.DEFAULT_NAMESPACE, context);
        }
        return node;
    };
};
exports.clientFunctionTransformer = clientFunctionTransformer;
