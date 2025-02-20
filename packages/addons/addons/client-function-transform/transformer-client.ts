/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import * as ts from "typescript";
import {
    getDecoration,
    isNodeExported,
    isTransformable,
    TransformationArguments,
    transformInvocableArrow,
    transformInvocableFunction,
} from "../magellan-shared";
import { ServiceDecoratorData } from "../magellan-shared/node-helpers";

const DECORATOR_NAME = "service";
const NAMED_IMPORTS = ["remoteInvoke"];

export const createClientTransformer = ({ libPath }: TransformationArguments) => {
    return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return (sf: ts.SourceFile) => {
            let currentFileHasServiceFunctions = false;

            const serviceFunctionLocator = (node: ts.Node): ts.VisitResult<ts.Node> => {
                if (ts.isSourceFile(node)) {
                    return ts.visitEachChild(node, serviceFunctionLocator, ctx);
                }

                if (!isNodeExported(node) || !isTransformable(node)) {
                    return node;
                }

                const serviceDecoration = getDecoration(sf, node, DECORATOR_NAME);
                if (!serviceDecoration) {
                    return node;
                }

                const [transformedNode, isServiceFunction] = transformNode(node, sf, serviceDecoration);
                if (isServiceFunction) {
                    currentFileHasServiceFunctions = true;
                }
                return transformedNode ?? node;
            };

            const clientSideCodeRemoval = (node: ts.Node): ts.VisitResult<ts.Node> => {
                if (ts.isSourceFile(node)) {
                    return ts.visitEachChild(node, clientSideCodeRemoval, ctx);
                }

                // remove imports from the service function file on the client-side
                // removes all ES module imports
                if (ts.isImportDeclaration(node)) {
                    return ts.factory.createNotEmittedStatement(node);
                }

                // removes all commonjs imports
                if (ts.isVariableStatement(node)) {
                    const declarations = node.declarationList.declarations;
                    if (
                        declarations.some(
                            decl =>
                                decl.initializer &&
                                ts.isCallExpression(decl.initializer) &&
                                ts.isIdentifier(decl.initializer.expression) &&
                                decl.initializer.expression.text === "require"
                        )
                    ) {
                        return ts.factory.createNotEmittedStatement(node);
                    }
                }

                // keep all type, interface and enum declarations
                if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isEnumDeclaration(node)) {
                    return node;
                }

                // remove all other non-exported nodes
                if (!isNodeExported(node)) {
                    return ts.factory.createNotEmittedStatement(node);
                }

                // remove all other nodes that are not service functions
                const serviceDecoration = getDecoration(sf, node, DECORATOR_NAME);
                if (!serviceDecoration) {
                    return ts.factory.createNotEmittedStatement(node);
                }

                return node;
            };

            sf = ts.visitNode(sf, serviceFunctionLocator, ts.isSourceFile);

            if (currentFileHasServiceFunctions) {
                sf = ts.visitNode(sf, clientSideCodeRemoval, ts.isSourceFile);
                if (!hasInvokeImport(sf, libPath, NAMED_IMPORTS)) {
                    sf = ts.factory.updateSourceFile(sf, [getImportInvoke(libPath, NAMED_IMPORTS), ...sf.statements]);
                }
            }
            return sf;
        };
    };
};

export const transformNode = (node: ts.Node, sf: ts.SourceFile, decorations: ServiceDecoratorData): [ts.Node | undefined, boolean] => {
    let updatedNode: ts.Node | undefined = undefined;
    if (ts.isVariableStatement(node)) {
        updatedNode = transformInvocableArrow(node, sf, decorations);
    }
    if (ts.isFunctionDeclaration(node)) {
        updatedNode = transformInvocableFunction(node, sf, decorations);
    }

    return [updatedNode, updatedNode !== undefined];
};

export const hasInvokeImport = (sf: ts.SourceFile, libPath: string, namedImports: string[]): boolean => {
    if (sf.statements.filter(cur => ts.isImportDeclaration(cur)).length < 1) {
        return false;
    }

    const imports = sf.statements.filter(
        cur => ts.isImportDeclaration(cur) && ts.isStringLiteral(cur.moduleSpecifier) && cur.moduleSpecifier.text === libPath
    );

    if (!imports || imports.length < 1) {
        return false;
    }
    const namedBindings = imports
        .map(cur => (cur as ts.ImportDeclaration)?.importClause?.namedBindings as ts.NamedImports)
        .filter(cur => (cur as ts.NamedImports)?.elements)
        .map(cur => cur.elements.map(nb => nb.name.text));
    const foundImport = namedBindings.some(nb => namedImports.every(elem => nb.includes(elem)));
    return foundImport;
};

export const getImportInvoke = (libPath: string, namedImports: string[]): ts.Statement => {
    return ts.factory.createImportDeclaration(
        undefined,
        ts.factory.createImportClause(
            false,
            undefined,
            ts.factory.createNamedImports(namedImports.map(nI => ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(nI))))
        ),
        ts.factory.createStringLiteral(libPath)
    );
};
