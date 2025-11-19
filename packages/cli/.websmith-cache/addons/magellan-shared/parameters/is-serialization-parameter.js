"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSerializationParameter = void 0;
const constants_1 = require("./constants");
const is_parameter_1 = require("./is-parameter");
/**
 * Checks if a parameter declaration is the Serialization parameter.
 */
const isSerializationParameter = (param) => {
    return (0, is_parameter_1.isParameter)(param, constants_1.SERIALIZATION_TYPE_NAME);
};
exports.isSerializationParameter = isSerializationParameter;
