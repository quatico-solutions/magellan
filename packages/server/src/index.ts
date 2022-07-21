/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import {serve, ServerOptions} from "./server";
import {externalFunctionInvoke} from "./services";

export {serve, externalFunctionInvoke};
export type {ServerOptions};

export type { Configuration, Context, NamespaceMapping, TransportHandler } from "./configuration";
export { addNamespace, addTransport, initProjectConfiguration, resolveNamespace } from "./configuration";