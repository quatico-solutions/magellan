import { type AddonContext, WarnMessage } from "@quatico/websmith-api";
import ts from "typescript";
import { type MagellanConfig, getFunctionName } from "../magellan-shared";
import { REMOTE_INVOKE_PARAM_NAME } from "./transformer-client";

/**
 * Transforms a service function into a client invocation.
 */
export const transformClientFunction = (
    factory: ts.NodeFactory,
    node: ts.VariableStatement | ts.FunctionDeclaration,
    declaration: ts.VariableDeclaration | ts.FunctionDeclaration,
    func: ts.ArrowFunction | ts.FunctionDeclaration,
    namespace: string,
    context: AddonContext<MagellanConfig>
): ts.Node => {
    // Parameters are already validated by validateServiceFunctionSignature
    const inputParam = func.parameters[0];
    const dataProperties: ts.PropertyAssignment[] = [];

    // Create data property only if the input parameter is not named '_'
    if (ts.isIdentifier(inputParam.name) && inputParam.name.text !== "_") {
        dataProperties.push(
            factory.createPropertyAssignment(factory.createIdentifier(inputParam.name.text), factory.createIdentifier(inputParam.name.text))
        );
    } else if (!ts.isIdentifier(inputParam.name) || inputParam.name.text !== "_") {
        // Handle cases where the first parameter might be complex but not '_' - this shouldn't happen if validation is correct, but good to be safe
        // Or if it's not an identifier (e.g. binding pattern which should be caught by validation)
        context
            .getReporter()
            .reportDiagnostic(
                new WarnMessage(`Unexpected input parameter structure in function ${getFunctionName(declaration)}. Assuming no data payload.`)
            );
    }

    // Create remoteInvoke call
    const invokeParams = factory.createObjectLiteralExpression(
        [
            factory.createPropertyAssignment(factory.createIdentifier("name"), factory.createStringLiteral(getFunctionName(declaration))),
            factory.createPropertyAssignment(factory.createIdentifier("data"), factory.createObjectLiteralExpression(dataProperties, false)),
            factory.createPropertyAssignment(factory.createIdentifier("namespace"), factory.createStringLiteral(namespace)),
        ],
        false
    );

    // Get context and serialization parameter names
    const contextParam = func.parameters[1];
    const contextParamName = ts.isIdentifier(contextParam.name) ? contextParam.name.text : "context";
    const serializationParam = func.parameters[2];
    const serializationParamName = ts.isIdentifier(serializationParam.name) ? serializationParam.name.text : "serialization";

    const remoteInvokeCall = factory.createCallExpression(factory.createIdentifier(REMOTE_INVOKE_PARAM_NAME), undefined, [
        invokeParams,
        factory.createIdentifier(contextParamName),
        factory.createIdentifier(serializationParamName),
    ]);
    const remoteInvokeBody = factory.createBlock([factory.createReturnStatement(remoteInvokeCall)], true);

    // Create the new arrow function
    if (ts.isVariableStatement(node)) {
        const declaration = node.declarationList.declarations[0];
        if (declaration.initializer && ts.isArrowFunction(declaration.initializer)) {
            const newArrowFunc = factory.createArrowFunction(
                declaration.initializer.modifiers,
                declaration.initializer.typeParameters,
                func.parameters,
                declaration.initializer.type,
                declaration.initializer.equalsGreaterThanToken,
                remoteInvokeBody
            );

            const newDeclaration = factory.createVariableDeclaration(declaration.name, declaration.exclamationToken, declaration.type, newArrowFunc);

            return factory.createVariableStatement(
                node.modifiers,
                factory.createVariableDeclarationList([newDeclaration], node.declarationList.flags)
            );
        }
        return node;
    }

    // Create new function declaration
    if (ts.isFunctionDeclaration(node) && node.name) {
        return factory.createFunctionDeclaration(
            node.modifiers,
            node.asteriskToken,
            node.name,
            node.typeParameters,
            func.parameters,
            node.type,
            remoteInvokeBody
        );
    }
    return node;
};
