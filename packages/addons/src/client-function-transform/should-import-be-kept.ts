import ts from "typescript";
import { CONTEXT_TYPE_NAME, SERIALIZATION_TYPE_NAME } from "../magellan-shared/parameters/constants";
import { REMOTE_INVOKE_PARAM_NAME } from "./transformer-client";

// These imports will be added by createClientImports, so we don't need to keep them
const IMPORTS_ADDED_BY_CLIENT_TRANSFORMER = new Set([REMOTE_INVOKE_PARAM_NAME, CONTEXT_TYPE_NAME, SERIALIZATION_TYPE_NAME]);

/**
 * Collects all identifier references in a source file
 */
const collectIdentifierReferences = (sourceFile: ts.SourceFile): Set<string> => {
    const references = new Set<string>();

    const visit = (node: ts.Node) => {
        // Collect identifier references (excluding import declarations themselves)
        if (ts.isIdentifier(node) && !isInImportDeclaration(node)) {
            references.add(node.text);
        }

        // Handle type references
        if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
            references.add(node.typeName.text);
        }

        // Handle qualified names (e.g., Namespace.Type)
        if (ts.isQualifiedName(node)) {
            if (ts.isIdentifier(node.left)) {
                references.add(node.left.text);
            }
            if (ts.isIdentifier(node.right)) {
                references.add(node.right.text);
            }
        }

        ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return references;
};

/**
 * Checks if a node is within an import declaration
 */
const isInImportDeclaration = (node: ts.Node): boolean => {
    let parent = node.parent;
    while (parent) {
        if (ts.isImportDeclaration(parent)) {
            return true;
        }
        parent = parent.parent;
    }
    return false;
};

/**
 * Extracts imported names from an import declaration
 */
const getImportedNames = (importDecl: ts.ImportDeclaration): string[] => {
    const names: string[] = [];

    if (!importDecl.importClause) {
        return names;
    }

    // Default import
    if (importDecl.importClause.name) {
        names.push(importDecl.importClause.name.text);
    }

    // Named imports
    if (importDecl.importClause.namedBindings) {
        if (ts.isNamedImports(importDecl.importClause.namedBindings)) {
            for (const element of importDecl.importClause.namedBindings.elements) {
                names.push(element.name.text);
            }
        }
        // Namespace import (import * as name)
        else if (ts.isNamespaceImport(importDecl.importClause.namedBindings)) {
            names.push(importDecl.importClause.namedBindings.name.text);
        }
    }

    return names;
};

/**
 * Checks if an import should be kept based on whether it's actually used in the code
 * @param node - The import declaration to check
 * @param sourceFile - The source file containing the import (required for usage analysis)
 * @returns True if the import should be kept (is used), false if it's unused
 */
export const shouldImportBeKept = (node: ts.Node, sourceFile?: ts.SourceFile): boolean => {
    if (!ts.isImportDeclaration(node)) {
        return false;
    }

    // Side-effect imports (no import clause) should always be kept
    if (!node.importClause) {
        return true;
    }

    // If no source file provided, we can't analyze usage, so keep the import
    if (!sourceFile) {
        return true;
    }

    // What does it mean if the module specifier is a string literal
    // For example: import { something } from "package-name" <- "package-name" is the string literal
    if (!ts.isStringLiteral(node.moduleSpecifier)) {
        return false;
    }

    // Get all imported names from this import declaration
    const importedNames = getImportedNames(node);

    if (importedNames.length === 0) {
        return false;
    }

    // Collect all identifier references in the source file
    const references = collectIdentifierReferences(sourceFile);

    // Check if any of the imported names are actually used
    const hasUsedImports = importedNames.some(name => references.has(name));

    // Keep the import if:
    // 1. It has used imports AND
    // 2. It's not entirely made up of redundant imports
    if (hasUsedImports && !importedNames.every(name => IMPORTS_ADDED_BY_CLIENT_TRANSFORMER.has(name))) {
        return true;
    }

    // Remove if all imports are unused or redundant
    return false;
};
