/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
export type {TransportHandler, NamespaceMapping, Configuration} from "./Configuration";
export {getConfiguration, initProjectConfiguration} from "./configuration-repository";
export type {ResolvedNamespace} from "./ResolvedNamespace";
export type {Context} from "./Context";
export { addNamespace, addTransport, resolveNamespace } from "./namespace";