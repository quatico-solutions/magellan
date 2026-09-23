"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformClientFunction = void 0;
const websmith_api_1 = require("@quatico/websmith-api");
const typescript_1 = __importDefault(require("typescript"));
const magellan_shared_1 = require("../magellan-shared");
const transformer_client_1 = require("./transformer-client");
/**
 * Transforms a service function into a client invocation.
 */
const transformClientFunction = (factory, node, declaration, func, namespace, context) => {
    // Parameters are already validated by validateServiceFunctionSignature
    const inputParam = func.parameters[0];
    // Determine the data value: pass parameter directly (unwrapped) to match server-side natural signatures
    // If parameter is '_', use empty object; otherwise pass the parameter value directly
    let dataValue;
    if (typescript_1.default.isIdentifier(inputParam.name) && inputParam.name.text === "_") {
        // No input parameter - use empty object
        dataValue = factory.createObjectLiteralExpression([], false);
    }
    else if (typescript_1.default.isIdentifier(inputParam.name)) {
        // Pass parameter directly (unwrapped) - matches server-side approach
        dataValue = factory.createIdentifier(inputParam.name.text);
    }
    else {
        // Handle unexpected cases (shouldn't happen if validation is correct)
        context
            .getReporter()
            .reportDiagnostic(new websmith_api_1.WarnMessage(`Unexpected input parameter structure in function ${(0, magellan_shared_1.getFunctionName)(declaration)}. Assuming no data payload.`));
        dataValue = factory.createObjectLiteralExpression([], false);
    }
    // Create remoteInvoke call
    const invokeParams = factory.createObjectLiteralExpression([
        factory.createPropertyAssignment(factory.createIdentifier("name"), factory.createStringLiteral((0, magellan_shared_1.getFunctionName)(declaration))),
        factory.createPropertyAssignment(factory.createIdentifier("data"), dataValue),
        factory.createPropertyAssignment(factory.createIdentifier("namespace"), factory.createStringLiteral(namespace)),
    ], false);
    // Get context and serialization parameter names
    const contextParam = func.parameters[1];
    const contextParamName = typescript_1.default.isIdentifier(contextParam.name) ? contextParam.name.text : "context";
    const serializationParam = func.parameters[2];
    const serializationParamName = typescript_1.default.isIdentifier(serializationParam.name) ? serializationParam.name.text : "serialization";
    const remoteInvokeCall = factory.createCallExpression(factory.createIdentifier(transformer_client_1.REMOTE_INVOKE_PARAM_NAME), undefined, [
        invokeParams,
        factory.createIdentifier(contextParamName),
        factory.createIdentifier(serializationParamName),
    ]);
    const remoteInvokeBody = factory.createBlock([factory.createReturnStatement(remoteInvokeCall)], true);
    // Create the new arrow function
    if (typescript_1.default.isVariableStatement(node)) {
        const declaration = node.declarationList.declarations[0];
        if (declaration.initializer && typescript_1.default.isArrowFunction(declaration.initializer)) {
            const newArrowFunc = factory.createArrowFunction(declaration.initializer.modifiers, declaration.initializer.typeParameters, func.parameters, declaration.initializer.type, declaration.initializer.equalsGreaterThanToken, remoteInvokeBody);
            const newDeclaration = factory.createVariableDeclaration(declaration.name, declaration.exclamationToken, declaration.type, newArrowFunc);
            return factory.createVariableStatement(node.modifiers, factory.createVariableDeclarationList([newDeclaration], node.declarationList.flags));
        }
        return node;
    }
    // Create new function declaration
    if (typescript_1.default.isFunctionDeclaration(node) && node.name) {
        return factory.createFunctionDeclaration(node.modifiers, node.asteriskToken, node.name, node.typeParameters, func.parameters, node.type, remoteInvokeBody);
    }
    return node;
};
exports.transformClientFunction = transformClientFunction;
