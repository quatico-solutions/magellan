import type ts from "typescript";

/**
 * Creates an import declaration
 */
export const createImport = (factory: ts.NodeFactory, importName: string, modulePath: string, typeOnly = false): ts.ImportDeclaration => {
    const importSpecifier = factory.createImportSpecifier(typeOnly, undefined, factory.createIdentifier(importName));
    return factory.createImportDeclaration(
        undefined,
        factory.createImportClause(false, undefined, factory.createNamedImports([importSpecifier])),
        factory.createStringLiteral(modulePath)
    );
};
