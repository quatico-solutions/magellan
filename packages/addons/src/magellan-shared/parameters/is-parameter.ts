import ts from "typescript";

/**
 * Checks if a parameter declaration is a specific parameter with a given type.
 *
 * @param param The parameter to check
 * @param type The expected type of the parameter
 * @returns True if the parameter matches the type
 */
export const isParameter = (param: ts.ParameterDeclaration, type: string): boolean => {
    if (
        !ts.isIdentifier(param.name) ||
        !param.type ||
        !ts.isTypeReferenceNode(param.type) ||
        !ts.isIdentifier(param.type.typeName) ||
        param.type.typeName.text !== type
    ) {
        return false;
    }

    // Check if this type reference points to a complex type definition in the same source file
    const sourceFile = param.getSourceFile();
    if (sourceFile) {
        for (const statement of sourceFile.statements) {
            if (ts.isTypeAliasDeclaration(statement) && statement.name.text === type) {
                // Check if the type alias defines a complex type (mapped type, conditional type, etc.)
                const aliasType = statement.type;
                if (
                    ts.isMappedTypeNode(aliasType) ||
                    ts.isConditionalTypeNode(aliasType) ||
                    ts.isUnionTypeNode(aliasType) ||
                    ts.isIntersectionTypeNode(aliasType)
                ) {
                    return false;
                }
            }
        }
    }

    return true;
};
