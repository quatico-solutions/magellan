"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isContextParameter = void 0;
const constants_1 = require("./constants");
const is_parameter_1 = require("./is-parameter");
/**
 * Checks if a parameter is a Context parameter
 *
 * @param param The parameter to check
 * @returns True if the parameter is a ctx or context parameter with Context type
 */
const isContextParameter = (param) => {
    return (0, is_parameter_1.isParameter)(param, constants_1.CONTEXT_TYPE_NAME);
};
exports.isContextParameter = isContextParameter;
