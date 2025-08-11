import type ts from "typescript";
import { SERIALIZATION_TYPE_NAME } from "./constants";
import { isParameter } from "./is-parameter";

/**
 * Checks if a parameter declaration is the Serialization parameter.
 */
export const isSerializationParameter = (param: ts.ParameterDeclaration): boolean => {
    return isParameter(param, SERIALIZATION_TYPE_NAME);
};
