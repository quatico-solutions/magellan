"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForCustomTypeDeclaration = exports.validateServiceFunctionImports = exports.validateServiceFunctionSignature = void 0;
const typescript_1 = __importDefault(require("typescript"));
const constants_1 = require("./constants");
const has_import_1 = require("./has-import");
const parameters_1 = require("./parameters");
/**
 * Validates the parameter signature of a service function.
 */
const validateServiceFunctionSignature = (parameters) => {
    if (parameters.length !== 3) {
        throw new Error(constants_1.SIGNATURE_ERROR_LENGTH);
    }
    const [inputParam, contextParam, serializationParam] = parameters;
    // Check input parameter (parameter 1)
    if ((0, parameters_1.isDestructuredParameter)(inputParam)) {
        throw new Error(constants_1.DESTRUCTURED_OBJECT_ERROR);
    }
    if ((0, parameters_1.isFunctionParameter)(inputParam)) {
        throw new Error(constants_1.FUNCTION_PARAMETER_ERROR);
    }
    if ((0, parameters_1.isContextParameter)(inputParam) || (0, parameters_1.isSerializationParameter)(inputParam)) {
        throw new Error("The first parameter cannot be Context or Serialization.");
    }
    // Check context parameter (parameter 2)
    if (!(0, parameters_1.isContextParameter)(contextParam)) {
        throw new Error(constants_1.SIGNATURE_ERROR_CONTEXT);
    }
    // Check serialization parameter (parameter 3)
    if (!(0, parameters_1.isSerializationParameter)(serializationParam)) {
        throw new Error(constants_1.SIGNATURE_ERROR_SERIALIZATION);
    }
};
exports.validateServiceFunctionSignature = validateServiceFunctionSignature;
/**
 * Validates that a source file has the necessary imports for a service function
 * @param sf The source file to check
 * @returns True if the file has imports for both Context and Serialization from @quatico/magellan-shared
 */
const validateServiceFunctionImports = (sf) => {
    const importModule = "@quatico/magellan-shared";
    const hasContextImport = (0, has_import_1.hasImport)(sf, importModule, parameters_1.CONTEXT_TYPE_NAME);
    const hasSerializationImport = (0, has_import_1.hasImport)(sf, importModule, parameters_1.SERIALIZATION_TYPE_NAME);
    if (!hasContextImport || !hasSerializationImport) {
        throw new Error(constants_1.MISSING_IMPORTS_ERROR);
    }
};
exports.validateServiceFunctionImports = validateServiceFunctionImports;
/**
 * Checks for custom type declarations in the source file and throws an error if found
 * @param sourceFile The source file to check
 * @param type The type to check for
 */
const checkForCustomTypeDeclaration = (sourceFile, type) => {
    typescript_1.default.forEachChild(sourceFile, node => {
        if ((typescript_1.default.isTypeAliasDeclaration(node) || typescript_1.default.isInterfaceDeclaration(node)) && typescript_1.default.isIdentifier(node.name) && node.name.text === type) {
            throw new Error((0, constants_1.getTypeErrorMessage)(type));
        }
    });
};
exports.checkForCustomTypeDeclaration = checkForCustomTypeDeclaration;
