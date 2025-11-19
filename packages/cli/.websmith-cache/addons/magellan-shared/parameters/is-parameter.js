"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isParameter = void 0;
const typescript_1 = __importDefault(require("typescript"));
/**
 * Checks if a parameter declaration is a specific parameter with a given type.
 *
 * @param param The parameter to check
 * @param type The expected type of the parameter
 * @returns True if the parameter matches the type
 */
const isParameter = (param, type) => {
    if (!typescript_1.default.isIdentifier(param.name) ||
        !param.type ||
        !typescript_1.default.isTypeReferenceNode(param.type) ||
        !typescript_1.default.isIdentifier(param.type.typeName) ||
        param.type.typeName.text !== type) {
        return false;
    }
    // Exclude generic types (types with type arguments)
    if (param.type.typeArguments && param.type.typeArguments.length > 0) {
        return false;
    }
    // Check if this type reference points to a complex type definition in the same source file
    const sourceFile = param.getSourceFile();
    if (sourceFile) {
        for (const statement of sourceFile.statements) {
            if (typescript_1.default.isTypeAliasDeclaration(statement) && statement.name.text === type) {
                // Check if the type alias defines a complex type (mapped type, conditional type, etc.)
                const aliasType = statement.type;
                if (typescript_1.default.isMappedTypeNode(aliasType) ||
                    typescript_1.default.isConditionalTypeNode(aliasType) ||
                    typescript_1.default.isUnionTypeNode(aliasType) ||
                    typescript_1.default.isIntersectionTypeNode(aliasType)) {
                    return false;
                }
            }
        }
    }
    return true;
};
exports.isParameter = isParameter;
