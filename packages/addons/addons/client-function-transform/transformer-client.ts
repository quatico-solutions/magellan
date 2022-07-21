/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import ts from "typescript";
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

export const createClientTransformer = ({ libPath, functionsDir }: TransformationArguments) => {
    return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return (sf: ts.SourceFile) => {
            if (sf.fileName.endsWith("/index.ts") || (functionsDir && !sf.fileName.includes(functionsDir))) {
                return sf;
            }
            let hasServiceFunctions = false;

            const visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
                if (ts.isSourceFile(node)) {
                    return ts.visitEachChild(node, visitor, ctx);
                }

                if (ts.isImportDeclaration(node)) {
                    return undefined;
                }

                if (!isTransformable(node)) {
                    return node;
                }

                const decorations = getDecoration(sf, node, DECORATOR_NAME);
                if (!isNodeExported(node) || !decorations) {
                    return undefined;
                }

                const [transformedNode, isServiceFunction] = transformNode(node, sf, decorations);
                hasServiceFunctions = hasServiceFunctions || isServiceFunction;
                return transformedNode ?? node;
            };

            sf = ts.visitNode(sf, visitor);
            if (hasServiceFunctions) {
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
        undefined,
        ts.factory.createImportClause(
            false,
            undefined,
            ts.factory.createNamedImports(namedImports.map(nI => ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(nI))))
        ),
        ts.factory.createStringLiteral(libPath)
    );
};
