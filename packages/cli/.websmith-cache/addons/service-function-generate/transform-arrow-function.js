"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformArrowFunction = void 0;
const typescript_1 = __importDefault(require("typescript"));
const create_object_parameter_1 = require("../magellan-shared/create-object-parameter");
/**
 * Transforms an arrow function to ensure it has the Context parameter
 */
const transformArrowFunction = (node, ctx) => {
    const declaration = node.declarationList.declarations[0];
    if (!declaration.initializer || !typescript_1.default.isArrowFunction(declaration.initializer)) {
        return node;
    }
    const arrowFunc = declaration.initializer;
    const [inputParam, contextParam, serializationParam] = arrowFunc.parameters;
    const updatedParams = [(0, create_object_parameter_1.createObjectParameter)(ctx.factory, inputParam), contextParam, serializationParam];
    const updatedArrow = ctx.factory.updateArrowFunction(arrowFunc, arrowFunc.modifiers, arrowFunc.typeParameters, updatedParams, arrowFunc.type, arrowFunc.equalsGreaterThanToken, arrowFunc.body);
    return ctx.factory.updateVariableStatement(node, node.modifiers, ctx.factory.updateVariableDeclarationList(node.declarationList, [
        ctx.factory.updateVariableDeclaration(declaration, declaration.name, declaration.exclamationToken, declaration.type, updatedArrow),
        ...node.declarationList.declarations.slice(1),
    ]));
};
exports.transformArrowFunction = transformArrowFunction;
