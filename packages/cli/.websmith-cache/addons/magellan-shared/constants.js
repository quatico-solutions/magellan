"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_NAMESPACE = exports.DECORATOR_NAME = exports.getTypeErrorMessage = exports.MISSING_IMPORTS_ERROR = exports.FUNCTION_PARAMETER_ERROR = exports.DESTRUCTURED_OBJECT_ERROR = exports.SIGNATURE_ERROR_SERIALIZATION = exports.SIGNATURE_ERROR_CONTEXT = exports.SIGNATURE_ERROR_LENGTH = void 0;
// Error messages moved from client transformer
exports.SIGNATURE_ERROR_LENGTH = `Service functions must have exactly three parameters: input, context?: Context, and serialization?: Serialization.`;
exports.SIGNATURE_ERROR_CONTEXT = `The second parameter of a service function must be 'context?: Context' or 'context?: Context<T>' (with optional generic type arguments).`;
exports.SIGNATURE_ERROR_SERIALIZATION = `The third parameter of a service function must be 'serialization?: Serialization'.`;
exports.DESTRUCTURED_OBJECT_ERROR = `
                The first parameter (input) of a service function cannot be a destructured object.
                Only single paramter input (primitive or object parameter) is supported:
                    1. export const fn = (a: string) => a

                But not something like:
                    1. export const fn = (name: string, age: number) => "Hi " + name + ". Your age is: " + age
                    2. export const fn = ({ name, type }: { name: string; type: number }) => ({ nameOut: name, typeOut: type })

                Please use a simple identifier or '_' for no input:
                    1. export interface InputWrapper { name: string; type: number; }; export const fn = (input: InputWrapper) => ({ nameOut: input.name, typeOut: input.type })
                    2. export const fn = (_: never) => "no input"
            `;
exports.FUNCTION_PARAMETER_ERROR = `
                The first parameter (input) of a service function cannot be a function type. Only primitive or object parameter are supported as function input.
            `;
exports.MISSING_IMPORTS_ERROR = `
                Service functions must have imports for both Context and Serialization from @quatico/magellan-shared.
            `;
const getTypeErrorMessage = (type) => `
                Custom declaration of type '${type}' is not allowed in service function files.
                The '${type}' type must be imported from '@quatico/magellan-shared'.
                
                Please rename your custom type or interface to something else.
            `;
exports.getTypeErrorMessage = getTypeErrorMessage;
exports.DECORATOR_NAME = "service";
exports.DEFAULT_NAMESPACE = "default";
