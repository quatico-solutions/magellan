import type ts from "typescript";
import { CONTEXT_TYPE_NAME } from "./constants";
import { isParameter } from "./is-parameter";

/**
 * Checks if a parameter is a Context parameter
 *
 * @param param The parameter to check
 * @returns True if the parameter is a ctx or context parameter with Context type
 */
export const isContextParameter = (param: ts.ParameterDeclaration): boolean => {
    return isParameter(param, CONTEXT_TYPE_NAME);
};
