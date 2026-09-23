"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createObjectParameter = void 0;
/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
const typescript_1 = __importDefault(require("typescript"));
/**
 * Creates an object parameter with destructuring from a primitive parameter
 * @param factory TypeScript node factory
 * @param param The parameter to objectify
 * @returns A new parameter with object destructuring
 */
const createObjectParameter = (factory, param) => {
    // Get the parameter name as text
    const paramName = typescript_1.default.isIdentifier(param.name) ? param.name.text : param.name.getText?.();
    // Create object parameter: { paramName: type }
    const objectLiteralType = factory.createTypeLiteralNode([
        factory.createPropertySignature(undefined, factory.createIdentifier(paramName), undefined, param.type),
    ]);
    // Create parameter with destructuring: ({ paramName }: { paramName: type })
    const objectBindingPattern = factory.createObjectBindingPattern([
        factory.createBindingElement(undefined, undefined, factory.createIdentifier(paramName), undefined),
    ]);
    return factory.createParameterDeclaration(param.modifiers, undefined, objectBindingPattern, param.questionToken, objectLiteralType, param.initializer);
};
exports.createObjectParameter = createObjectParameter;
