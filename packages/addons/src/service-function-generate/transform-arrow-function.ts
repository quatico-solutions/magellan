import ts from "typescript";
import { createObjectParameter } from "../magellan-shared/create-object-parameter";

/**
 * Transforms an arrow function to ensure it has the Context parameter
 */
export const transformArrowFunction = (node: ts.VariableStatement, ctx: ts.TransformationContext): ts.Node => {
    const declaration = node.declarationList.declarations[0];
    if (!declaration.initializer || !ts.isArrowFunction(declaration.initializer)) {
        return node;
    }

    const arrowFunc = declaration.initializer;
    const [inputParam, contextParam, serializationParam] = arrowFunc.parameters;
    const updatedParams: ts.ParameterDeclaration[] = [createObjectParameter(ctx.factory, inputParam), contextParam, serializationParam];

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
