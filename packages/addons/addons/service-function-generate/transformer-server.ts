/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
/* eslint-disable no-console */
import ts from "typescript";
import {
    getDecoration,
    getFunctionName,
    isNodeExported,
    isStatement,
    isTransformable,
    TransformationArguments,
    transformInvocableArrow,
    transformInvocableFunction,
    transformLocalServerArrow,
    transformLocalServerFunction,
} from "../magellan-shared";
import { ServiceDecoratorData } from "../magellan-shared/node-helpers";

const DECORATOR_NAME = "service";

export const createServerTransformer = ({ functionsDir }: TransformationArguments) => {
    const platformTransformerFactory: ts.TransformerFactory<ts.SourceFile> = (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return (sf: ts.SourceFile) => {
            if (sf.fileName.endsWith("/index.ts") || (functionsDir && !sf.fileName.includes(functionsDir))) {
                return ctx.factory.updateSourceFile(sf, []);
            }

            const foundFunctions: Map<ts.Identifier | string, ts.Statement> = new Map();
            const visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
                if (ts.isSourceFile(node)) {
                    return ts.visitEachChild(node, visitor, ctx);
                }

                const serviceDecoration = getDecoration(sf, node, DECORATOR_NAME);
                if (!serviceDecoration || !isNodeExported(node) || !isTransformable(node)) {
                    return node;
                }

                const name = getFunctionName(node, sf);
                if (!foundFunctions.has(name)) {
                    const statement = serviceDecoration.kind === "local" ? transformLocalNode(node) : node;
                    if (statement && isStatement(statement)) {
                        foundFunctions.set(name, statement);
                    }
                    return statement ?? node;
                }

                return ts.visitEachChild(node, visitor, ctx);
            };

            return ts.visitNode(sf, visitor);
        };
    };
    return platformTransformerFactory;
};

export const transformLocalNode = (node: ts.Node): ts.Node | undefined => {
    let transformedNode: ts.Node | undefined = undefined;
    if (ts.isVariableStatement(node)) {
        transformedNode = transformLocalServerArrow(node);
    }
    if (ts.isFunctionDeclaration(node)) {
        transformedNode = transformLocalServerFunction(node);
    }

    return transformedNode;
};

export const transformExternalNode = (node: ts.Node, sf: ts.SourceFile, decorations: ServiceDecoratorData): ts.Node | undefined => {
    let transformedNode: ts.Node | undefined = undefined;
    if (ts.isVariableStatement(node)) {
        transformedNode = transformInvocableArrow(node, sf, decorations, "externalFunctionInvoke");
    }
    if (ts.isFunctionDeclaration(node)) {
        transformedNode = transformInvocableFunction(node, sf, decorations, "externalFunctionInvoke");
    }

    return transformedNode;
};
