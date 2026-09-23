"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSerializationParameter = void 0;
const typescript_1 = __importDefault(require("typescript"));
const constants_1 = require("./constants");
const is_parameter_1 = require("./is-parameter");
/**
 * Checks if a parameter declaration is the Serialization parameter.
 * Serialization does not allow generic type arguments.
 */
const isSerializationParameter = (param) => {
    if (!(0, is_parameter_1.isParameter)(param, constants_1.SERIALIZATION_TYPE_NAME)) {
        return false;
    }
    // Serialization does not allow generic type arguments
    if (param.type && typescript_1.default.isTypeReferenceNode(param.type) && param.type.typeArguments && param.type.typeArguments.length > 0) {
        return false;
    }
    return true;
};
exports.isSerializationParameter = isSerializationParameter;
