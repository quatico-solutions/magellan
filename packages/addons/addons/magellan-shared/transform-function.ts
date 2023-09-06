/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import ts, { factory } from "typescript";
import { defaultNamespace, getDescendantsOfKind, getFunctionName, ServiceDecoratorData } from "./node-helpers";

export const transformInvocableArrow = (
    node: ts.Node,
    sf: ts.SourceFile,
    decorations: ServiceDecoratorData,
    invocationFuncName = "remoteInvoke"
): ts.Node => {
    // FIXME: For fully correct behavior, this should be done on a per node.declarationList.declarations to work correctly with statements that
    //          contain multiple variable statements instead of just one. This also applies to the server arrow function.
    return ts.isVariableStatement(node)
        ? transformArrowVariableStatement(
              node,
              getDescendantsOfKind<ts.ArrowFunction>(node, ts.SyntaxKind.ArrowFunction),
              sf,
              decorations,
              invocationFuncName
          )
        : node;
};

const transformArrowVariableStatement = (
    node: ts.VariableStatement,
    arrow: ts.ArrowFunction | undefined,
    sf: ts.SourceFile,
    decorations: ServiceDecoratorData,
    invocationFuncName = "remoteInvoke"
): ts.VariableStatement => {
    return arrow && ts.isArrowFunction(arrow)
        ? (function () {
              const declaration = node.declarationList.declarations[0];
              return factory.updateVariableStatement(
                  node,
                  node.modifiers,
                  factory.updateVariableDeclarationList(node.declarationList, [
                      factory.updateVariableDeclaration(
                          declaration,
                          declaration.name,
                          declaration.exclamationToken,
                          declaration.type,
                          factory.updateArrowFunction(
                              arrow,
                              arrow.modifiers,
                              arrow.typeParameters,
                              arrow.parameters,
                              arrow.type,
                              arrow.equalsGreaterThanToken,
                              createInvokeExpression(getFunctionName(node, sf), getObjectLiteralsOfNode(arrow), decorations, invocationFuncName)
                          )
                      ),
                      ...node.declarationList.declarations.slice(1),
                  ])
              );
          })()
        : node;
};

export const transformLocalServerArrow = (node: ts.Node): ts.Node => {
    if (!ts.isVariableStatement(node)) {
        return node;
    }

    const arrow = getDescendantsOfKind<ts.ArrowFunction>(node, ts.SyntaxKind.ArrowFunction);
    if (!arrow) {
        return node;
    }

    if (ts.isArrowFunction(arrow) && arrow.body) {
        const declaration = node.declarationList.declarations[0];
        return factory.updateVariableStatement(
            node,
            node.modifiers,
            factory.updateVariableDeclarationList(node.declarationList, [
                factory.updateVariableDeclaration(
                    declaration,
                    declaration.name,
                    declaration.exclamationToken,
                    declaration.type,
                    factory.updateArrowFunction(
                        arrow,
                        arrow.modifiers,
                        arrow.typeParameters,
                        createObjectifiedParameter(arrow),
                        arrow.type,
                        arrow.equalsGreaterThanToken,
                        arrow.body
                    )
                ),
            ])
        );
    }
    return node;
};

export const transformInvocableFunction = (
    node: ts.Node,
    sf: ts.SourceFile,
    decorations: ServiceDecoratorData,
    invocationFuncName = "remoteInvoke"
): ts.Node => {
    if (!ts.isFunctionDeclaration(node) || !node.body) {
        return node;
    }

    const name = getFunctionName(node, sf);
    const parameters = getObjectLiteralsOfNode(node);
    return factory.updateFunctionDeclaration(
        node,
        node.modifiers,
        node.asteriskToken,
        node.name,
        node.typeParameters,
        node.parameters,
        node.type,
        createInvokeExpression(name, parameters, decorations, invocationFuncName)
    );
};

export const transformLocalServerFunction = (node: ts.Node): ts.Node => {
    if (!ts.isFunctionDeclaration(node)) {
        return node;
    }
    if (!node.body) {
        return node;
    }

    const newParameters = createObjectifiedParameter(node);
    return factory.updateFunctionDeclaration(
        node,
        node.modifiers,
        node.asteriskToken,
        node.name,
        node.typeParameters,
        newParameters,
        node.type,
        node.body
    );
};

/**
 * Creates an array of ts.isObjectLiteralElementLike elements based on the parameters of the function like declaration.
 * @param node The function like node from which the parameters are consumed
 * @returns Array containing one ObjectLiteralElementLike element per parameter.
 */
const getObjectLiteralsOfNode = (node: ts.Node): ts.ObjectLiteralElementLike[] | undefined => {
    if (!ts.isFunctionDeclaration(node) && !ts.isArrowFunction(node)) {
        return undefined;
    }

    const { factory } = ts;
    return node.parameters.map(par => factory.createShorthandPropertyAssignment(factory.createIdentifier(par.name.getText())));
};

/**
 * Creates an array of ts.ParameterDeclaration elements based on the parameters of the function like declaration.
 * @param node The function like node from which the parameters are consumed
 * @returns Array containing one ParameterDeclaration element per parameter.
 */
const getParameters = (node: ts.Node): ts.ParameterDeclaration[] | undefined => {
    if (!ts.isFunctionDeclaration(node) && !ts.isArrowFunction(node)) {
        return undefined;
    }

    return node.parameters.map(p => p) ?? undefined;
};

// FIXME: An already deconstructed parameter does not need objectification.
const createObjectifiedParameter = (node: ts.Node): ts.ParameterDeclaration[] => {
    const parameters = getParameters(node);
    const bindingPattern = factory.createObjectBindingPattern(
        parameters?.map(p => factory.createBindingElement(undefined, undefined, factory.createIdentifier(p.name.getText()), undefined)) ?? []
    );
    const typeLiteral = factory.createTypeLiteralNode(
        parameters?.map(p =>
            factory.createPropertySignature(
                // TODO: API clash ModifierLike[] (new) vs. Modifier[] (old)
                p.modifiers as any,
                p.name.getText(),
                p.questionToken,
                p.type
            )
        )
    );
    return [factory.createParameterDeclaration(undefined, undefined, bindingPattern, undefined, typeLiteral, undefined)];
};

/**
 * Creates the remoteInvoke expression for a given function with the RemoteFunction interface input.
 * $invocationName$({name: name, data: funcArgs })
 * @param invocationName Name of the invocation function
 * @param name Name of the function for which the remoteInvokation is created.
 * @param funcArgs The arguments passed to the function that are to be passed to the remote invocation.
 * @returns the AST representing a remoteInvoke.
 */
const createInvokeExpression = (
    name: string,
    funcArgs: ts.ObjectLiteralElementLike[] | undefined,
    decorations: ServiceDecoratorData,
    invocationName = "remoteInvoke"
) => {
    const { namespace = defaultNamespace } = decorations;
    return factory.createBlock(
        [
            factory.createReturnStatement(
                factory.createCallExpression(factory.createIdentifier(invocationName), undefined, [
                    factory.createObjectLiteralExpression(
                        [
                            factory.createPropertyAssignment(factory.createIdentifier("name"), factory.createStringLiteral(name)),
                            factory.createPropertyAssignment(factory.createIdentifier("data"), factory.createObjectLiteralExpression(funcArgs)),
                            factory.createPropertyAssignment(factory.createIdentifier("namespace"), factory.createStringLiteral(namespace)),
                        ],
                        false
                    ),
                ])
            ),
        ],
        true
    );
};
