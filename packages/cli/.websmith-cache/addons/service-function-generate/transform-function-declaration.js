"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformFunctionDeclaration = void 0;
const create_object_parameter_1 = require("../magellan-shared/create-object-parameter");
/**
 * Transforms a function declaration to ensure it has the Context parameter
 */
const transformFunctionDeclaration = (node, ctx) => {
    if (!node.body) {
        return node;
    }
    const [inputParam, contextParam, serializationParam] = node.parameters;
    const updatedParams = [(0, create_object_parameter_1.createObjectParameter)(ctx.factory, inputParam), contextParam, serializationParam];
    return ctx.factory.updateFunctionDeclaration(node, node.modifiers, node.asteriskToken, node.name, node.typeParameters, updatedParams, node.type, node.body);
};
exports.transformFunctionDeclaration = transformFunctionDeclaration;
