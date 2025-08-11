import ts from "typescript";

/**
 * Checks if a parameter is a function type
 */
export const isFunctionParameter = (param: ts.ParameterDeclaration): boolean => {
    if (!param.type) {
        return false;
    }

    // Check for arrow function type
    if (ts.isFunctionTypeNode(param.type)) {
        return true;
    }

    // Check for reference to a function type
    if (ts.isTypeReferenceNode(param.type) && ts.isIdentifier(param.type.typeName)) {
        const typeText = param.type.typeName.text;
        return typeText.includes("Function") || typeText.includes("Callback");
    }

    return false;
};
