"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldImportBeKept = void 0;
const typescript_1 = __importDefault(require("typescript"));
const constants_1 = require("../magellan-shared/parameters/constants");
const transformer_client_1 = require("./transformer-client");
// These imports will be added by createClientImports, so we don't need to keep them
const IMPORTS_ADDED_BY_CLIENT_TRANSFORMER = new Set([transformer_client_1.REMOTE_INVOKE_PARAM_NAME, constants_1.CONTEXT_TYPE_NAME, constants_1.SERIALIZATION_TYPE_NAME]);
/**
 * Collects all identifier references in a source file
 */
const collectIdentifierReferences = (sourceFile) => {
    const references = new Set();
    const visit = (node) => {
        // Collect identifier references (excluding import declarations themselves)
        if (typescript_1.default.isIdentifier(node) && !isInImportDeclaration(node)) {
            references.add(node.text);
        }
        // Handle type references
        if (typescript_1.default.isTypeReferenceNode(node) && typescript_1.default.isIdentifier(node.typeName)) {
            references.add(node.typeName.text);
        }
        // Handle qualified names (e.g., Namespace.Type)
        if (typescript_1.default.isQualifiedName(node)) {
            if (typescript_1.default.isIdentifier(node.left)) {
                references.add(node.left.text);
            }
            if (typescript_1.default.isIdentifier(node.right)) {
                references.add(node.right.text);
            }
        }
        typescript_1.default.forEachChild(node, visit);
    };
    visit(sourceFile);
    return references;
};
/**
 * Checks if a node is within an import declaration
 */
const isInImportDeclaration = (node) => {
    let parent = node.parent;
    while (parent) {
        if (typescript_1.default.isImportDeclaration(parent)) {
            return true;
        }
        parent = parent.parent;
    }
    return false;
};
/**
 * Extracts imported names from an import declaration
 */
const getImportedNames = (importDecl) => {
    const names = [];
    if (!importDecl.importClause) {
        return names;
    }
    // Default import
    if (importDecl.importClause.name) {
        names.push(importDecl.importClause.name.text);
    }
    // Named imports
    if (importDecl.importClause.namedBindings) {
        if (typescript_1.default.isNamedImports(importDecl.importClause.namedBindings)) {
            for (const element of importDecl.importClause.namedBindings.elements) {
                names.push(element.name.text);
            }
        }
        // Namespace import (import * as name)
        else if (typescript_1.default.isNamespaceImport(importDecl.importClause.namedBindings)) {
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
const shouldImportBeKept = (node, sourceFile) => {
    if (!typescript_1.default.isImportDeclaration(node)) {
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
    if (!typescript_1.default.isStringLiteral(node.moduleSpecifier)) {
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
exports.shouldImportBeKept = shouldImportBeKept;
