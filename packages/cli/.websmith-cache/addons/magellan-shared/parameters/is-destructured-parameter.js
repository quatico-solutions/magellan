"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDestructuredParameter = void 0;
const typescript_1 = __importDefault(require("typescript"));
/**
 * Checks if a parameter is a destructured object parameter
 */
const isDestructuredParameter = (param) => {
    return typescript_1.default.isObjectBindingPattern(param.name) || typescript_1.default.isArrayBindingPattern(param.name);
};
exports.isDestructuredParameter = isDestructuredParameter;
