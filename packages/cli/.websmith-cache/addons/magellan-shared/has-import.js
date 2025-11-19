"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasImport = void 0;
const typescript_1 = __importDefault(require("typescript"));
/**
 * Checks if the import is already present in the source file
 * @param sf The source file to check
 * @param modulePath The module path
 * @param importName The name of the import to check
 * @returns True if the import is already present
 */
const hasImport = (sf, modulePath, importName) => {
    return sf.statements.some(stmt => typescript_1.default.isImportDeclaration(stmt) &&
        typescript_1.default.isStringLiteral(stmt.moduleSpecifier) &&
        stmt.moduleSpecifier.text === modulePath &&
        stmt.importClause?.namedBindings &&
        typescript_1.default.isNamedImports(stmt.importClause.namedBindings) &&
        stmt.importClause.namedBindings.elements.some(el => el.name.text === importName));
};
exports.hasImport = hasImport;
