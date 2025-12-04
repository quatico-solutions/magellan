import ts from "typescript";
import { SERIALIZATION_TYPE_NAME } from "./constants";
import { isParameter } from "./is-parameter";

/**
 * Checks if a parameter declaration is the Serialization parameter.
 * Serialization does not allow generic type arguments.
 */
export const isSerializationParameter = (param: ts.ParameterDeclaration): boolean => {
    if (!isParameter(param, SERIALIZATION_TYPE_NAME)) {
        return false;
    }

    // Serialization does not allow generic type arguments
    if (param.type && ts.isTypeReferenceNode(param.type) && param.type.typeArguments && param.type.typeArguments.length > 0) {
        return false;
    }

    return true;
};
