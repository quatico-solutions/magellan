import type ts from "typescript";
import { createObjectParameter } from "../magellan-shared/create-object-parameter";

/**
 * Transforms a function declaration to ensure it has the Context parameter
 */
export const transformFunctionDeclaration = (node: ts.FunctionDeclaration, ctx: ts.TransformationContext): ts.Node => {
    if (!node.body) {
        return node;
    }

    const [inputParam, contextParam, serializationParam] = node.parameters;
    const updatedParams: ts.ParameterDeclaration[] = [createObjectParameter(ctx.factory, inputParam), contextParam, serializationParam];

    return ctx.factory.updateFunctionDeclaration(
        node,
        node.modifiers,
        node.asteriskToken,
        node.name,
        node.typeParameters,
        updatedParams,
        node.type,
        node.body
    );
};
