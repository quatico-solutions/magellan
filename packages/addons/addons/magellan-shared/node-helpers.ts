/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import ts, { factory, SyntaxKind } from "typescript";

export const defaultNamespace = "default";
export interface ServiceDecoratorData {
    kind: "local" | "external";
    namespace: string;
}

export const getDescendantsOfKind = <O extends ts.Node>(node: ts.Node, kind: SyntaxKind): O | undefined => {
    if (!node || node.kind === kind) {
        return node as O;
    }
    const descendant = node.forEachChild(child => getDescendantsOfKind<O>(child, kind));
    return descendant as O;
};

export const isTransformable = (node: ts.Node): node is ts.VariableStatement | ts.FunctionDeclaration => {
    return (
        ts.isFunctionDeclaration(node) ||
        (ts.isVariableStatement(node) && getDescendantsOfKind<ts.ArrowFunction>(node, SyntaxKind.ArrowFunction) !== undefined)
    );
};

export const isNodeExported = (node: ts.Node): boolean => {
    // eslint-disable-next-line no-bitwise
    return (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0;
};

export const isStatement = (node: ts.Node): node is ts.Statement => ts.isVariableStatement(node) || ts.isFunctionDeclaration(node);

export const hasDecorator = (sf: ts.SourceFile, node: ts.Node, decoratorText: string): node is ts.VariableStatement | ts.FunctionDeclaration => {
    if ((!ts.isFunctionDeclaration(node) && !ts.isVariableStatement(node)) || node.pos < 0) {
        return false;
    }
    return node.getFullText(sf).slice(0, node.getLeadingTriviaWidth(sf)).includes(decoratorText);
};

export const getDecoration = (sf: ts.SourceFile, node: ts.Node, decoratorText: string): ServiceDecoratorData | undefined => {
    if (!ts.isFunctionDeclaration(node) && !ts.isVariableStatement(node)) {
        return undefined;
    }
    if (node.pos < 0) {
        return undefined;
    }

    const comment = node.getFullText(sf).slice(0, node.getLeadingTriviaWidth(sf));
    const isDecorator = comment.includes(decoratorText);
    if (!isDecorator) {
        return undefined;
    }

    try {
        const matches = comment.match(/\/\/.*@service\(({.*})?\)/) ?? [comment];
        if (matches.length === 1 || matches[1] === undefined) {
            return fillDefaultMetaInformation();
        }
        return fillDefaultMetaInformation(JSON.parse(matches[1]) as ServiceDecoratorData);
    } catch (err) {
        const error: Error = err as Error;
        if (error) {
            // eslint-disable-next-line no-console
            console.error(error.toString());
        }
    }

    return undefined;
};

export const fillDefaultMetaInformation = (decoratorData?: ServiceDecoratorData): ServiceDecoratorData | undefined => {
    if (decoratorData?.kind && !["local", "external"].includes(decoratorData.kind)) {
        // eslint-disable-next-line no-console
        console.error(`Invalid service kind "${decoratorData?.kind}" provided. Must be empty, "local" or "external"`);
        return undefined;
    }

    const { namespace = defaultNamespace } = decoratorData ?? {};
    return {
        kind: decoratorData?.kind && ["local", "external"].includes(decoratorData?.kind ?? "unknown") ? decoratorData?.kind : "local",
        namespace,
    };
};

export const getFunctionName = (node: ts.VariableStatement | ts.FunctionDeclaration, sf: ts.SourceFile): string => {
    if (ts.isVariableStatement(node)) {
        return node.declarationList.declarations[0].name.getText(sf);
    }
    if (ts.isFunctionDeclaration(node) && node.name) {
        return node.name.getText(sf);
    }

    throw new Error(`getFunctionName failed, no function or arrow function node provided on ${node}`);
};

export const createInvokeImport = (libPath: string, namedImports: string[]): ts.Statement => {
    return factory.createImportDeclaration(
        undefined,
        undefined,
        factory.createImportClause(
            false,
            undefined,
            factory.createNamedImports(namedImports.map(it => factory.createImportSpecifier(false, undefined, factory.createIdentifier(it))))
        ),
        factory.createStringLiteral(libPath)
    );
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
