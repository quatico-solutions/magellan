/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
export type {TransportHandler, NamespaceMapping, Configuration} from "./Configuration";
export type {Context} from "./Context";
export {initProjectConfiguration, getConfiguration} from "./configuration-repository";
export {addNamespace, addTransport, resolveNamespace} from "./namespace";
export type {ResolvedNamespace} from "./ResolvedNamespace";