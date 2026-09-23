"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createImport = void 0;
/**
 * Creates an import declaration
 */
const createImport = (factory, importName, modulePath, typeOnly = false) => {
    const importSpecifier = factory.createImportSpecifier(typeOnly, undefined, factory.createIdentifier(importName));
    return factory.createImportDeclaration(undefined, factory.createImportClause(false, undefined, factory.createNamedImports([importSpecifier])), factory.createStringLiteral(modulePath));
};
exports.createImport = createImport;
