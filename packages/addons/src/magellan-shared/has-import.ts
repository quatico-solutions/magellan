import ts from "typescript";

/**
 * Checks if the import is already present in the source file
 * @param sf The source file to check
 * @param modulePath The module path
 * @param importName The name of the import to check
 * @returns True if the import is already present
 */

export const hasImport = (sf: ts.SourceFile, modulePath: string, importName: string): boolean => {
    return sf.statements.some(
        stmt =>
            ts.isImportDeclaration(stmt) &&
            ts.isStringLiteral(stmt.moduleSpecifier) &&
            stmt.moduleSpecifier.text === modulePath &&
            stmt.importClause?.namedBindings &&
            ts.isNamedImports(stmt.importClause.namedBindings) &&
            stmt.importClause.namedBindings.elements.some(el => el.name.text === importName)
    );
};
