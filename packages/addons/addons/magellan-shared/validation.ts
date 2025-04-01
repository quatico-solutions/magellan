import ts from "typescript";
import {
    CONTEXT_TYPE_NAME,
    DESTRUCTURED_OBJECT_ERROR,
    FUNCTION_PARAMETER_ERROR,
    getTypeErrorMessage,
    MISSING_IMPORTS_ERROR,
    SERIALIZATION_TYPE_NAME,
    SIGNATURE_ERROR_CONTEXT,
    SIGNATURE_ERROR_LENGTH,
    SIGNATURE_ERROR_SERIALIZATION,
} from "./constants";
import { hasImport, isContextParameter, isDestructuredParameter, isFunctionParameter, isSerializationParameter } from "./transform-utils";

/**
 * Validates the parameter signature of a service function.
 */
export function validateServiceFunctionSignature(parameters: ts.NodeArray<ts.ParameterDeclaration>): void {
    if (parameters.length !== 3) {
        throw new Error(SIGNATURE_ERROR_LENGTH);
    }

    const [inputParam, contextParam, serializationParam] = parameters;

    // Check input parameter (parameter 1)
    if (isDestructuredParameter(inputParam)) {
        throw new Error(DESTRUCTURED_OBJECT_ERROR);
    }
    if (isFunctionParameter(inputParam)) {
        throw new Error(FUNCTION_PARAMETER_ERROR);
    }
    if (isContextParameter(inputParam) || isSerializationParameter(inputParam)) {
        throw new Error("The first parameter cannot be Context or Serialization.");
    }

    // Check context parameter (parameter 2)
    if (!isContextParameter(contextParam)) {
        throw new Error(SIGNATURE_ERROR_CONTEXT);
    }

    // Check serialization parameter (parameter 3)
    if (!isSerializationParameter(serializationParam)) {
        throw new Error(SIGNATURE_ERROR_SERIALIZATION);
    }
}

/**
 * Validates that a source file has the necessary imports for a service function
 * @param sf The source file to check
 * @returns True if the file has imports for both Context and Serialization from @quatico/magellan-shared
 */
export function validateServiceFunctionImports(sf: ts.SourceFile) {
    const importModule = "@quatico/magellan-shared";
    const hasContextImport = hasImport(sf, importModule, CONTEXT_TYPE_NAME);
    const hasSerializationImport = hasImport(sf, importModule, SERIALIZATION_TYPE_NAME);
    if (!hasContextImport || !hasSerializationImport) {
        throw new Error(MISSING_IMPORTS_ERROR);
    }
}

/**
 * Checks for custom type declarations in the source file and throws an error if found
 * @param sourceFile The source file to check
 * @param type The type to check for
 */
export function checkForCustomTypeDeclaration(sourceFile: ts.SourceFile, type: typeof CONTEXT_TYPE_NAME | typeof SERIALIZATION_TYPE_NAME): void {
    ts.forEachChild(sourceFile, node => {
        if ((ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) && ts.isIdentifier(node.name) && node.name.text === type) {
            throw new Error(getTypeErrorMessage(type));
        }
    });
}
