/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import {
    createInvokeImport,
    getDecoration,
    getDescendantsOfKind,
    getFunctionName,
    hasDecorator,
    hasInvokeImport,
    isNodeExported,
    isStatement,
    isTransformable,
} from "./node-helpers";
import { transformInvocableArrow, transformInvocableFunction, transformLocalServerArrow, transformLocalServerFunction } from "./transform-function";
import { TransformationArguments } from "./TransformationArguments";

export {
    getDescendantsOfKind,
    getDecoration,
    getFunctionName,
    createInvokeImport,
    hasInvokeImport,
    isStatement,
    isTransformable,
    hasDecorator,
    isNodeExported,
    transformInvocableArrow,
    transformInvocableFunction,
    transformLocalServerArrow,
    transformLocalServerFunction,
};

export type { TransformationArguments };
