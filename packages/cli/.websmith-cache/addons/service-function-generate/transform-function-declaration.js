"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformFunctionDeclaration = void 0;
/**
 * Transforms a function declaration to ensure it has the Context parameter
 * Note: We no longer add object destructuring to the input parameter to allow natural function signatures
 */
const transformFunctionDeclaration = (node, ctx) => {
    if (!node.body) {
        return node;
    }
    const [inputParam, contextParam, serializationParam] = node.parameters;
    // Keep parameters as-is without object destructuring
    const updatedParams = [inputParam, contextParam, serializationParam];
    return ctx.factory.updateFunctionDeclaration(node, node.modifiers, node.asteriskToken, node.name, node.typeParameters, updatedParams, node.type, node.body);
};
exports.transformFunctionDeclaration = transformFunctionDeclaration;
