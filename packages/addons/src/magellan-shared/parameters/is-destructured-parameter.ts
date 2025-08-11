import ts from "typescript";

/**
 * Checks if a parameter is a destructured object parameter
 */
export const isDestructuredParameter = (param: ts.ParameterDeclaration): boolean => {
    return ts.isObjectBindingPattern(param.name) || ts.isArrayBindingPattern(param.name);
};
