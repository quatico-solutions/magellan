import type ts from "typescript";

/**
 * Transforms a function declaration to ensure it has the Context parameter
 * Note: We no longer add object destructuring to the input parameter to allow natural function signatures
 */
export const transformFunctionDeclaration = (node: ts.FunctionDeclaration, ctx: ts.TransformationContext): ts.Node => {
    if (!node.body) {
        return node;
    }

    const [inputParam, contextParam, serializationParam] = node.parameters;
    // Keep parameters as-is without object destructuring
    const updatedParams: ts.ParameterDeclaration[] = [inputParam, contextParam, serializationParam];

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
