"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFunctionParameter = void 0;
const typescript_1 = __importDefault(require("typescript"));
/**
 * Checks if a parameter is a function type
 */
const isFunctionParameter = (param) => {
    if (!param.type) {
        return false;
    }
    // Check for arrow function type
    if (typescript_1.default.isFunctionTypeNode(param.type)) {
        return true;
    }
    // Check for reference to a function type
    if (typescript_1.default.isTypeReferenceNode(param.type) && typescript_1.default.isIdentifier(param.type.typeName)) {
        const typeText = param.type.typeName.text;
        return typeText.includes("Function") || typeText.includes("Callback");
    }
    return false;
};
exports.isFunctionParameter = isFunctionParameter;
