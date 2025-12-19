import ts from "typescript";

/**
 * Transforms an arrow function to ensure it has the Context parameter
 * Note: We no longer add object destructuring to the input parameter to allow natural function signatures
 */
export const transformArrowFunction = (node: ts.VariableStatement, ctx: ts.TransformationContext): ts.Node => {
    const declaration = node.declarationList.declarations[0];
    if (!declaration.initializer || !ts.isArrowFunction(declaration.initializer)) {
        return node;
    }

    const arrowFunc = declaration.initializer;
    const [inputParam, contextParam, serializationParam] = arrowFunc.parameters;
    // Keep parameters as-is without object destructuring
    const updatedParams: ts.ParameterDeclaration[] = [inputParam, contextParam, serializationParam];

    const updatedArrow = ctx.factory.updateArrowFunction(
        arrowFunc,
        arrowFunc.modifiers,
        arrowFunc.typeParameters,
        updatedParams,
        arrowFunc.type,
        arrowFunc.equalsGreaterThanToken,
        arrowFunc.body
    );

    return ctx.factory.updateVariableStatement(
        node,
        node.modifiers,
        ctx.factory.updateVariableDeclarationList(node.declarationList, [
            ctx.factory.updateVariableDeclaration(declaration, declaration.name, declaration.exclamationToken, declaration.type, updatedArrow),
            ...node.declarationList.declarations.slice(1),
        ])
    );
};
