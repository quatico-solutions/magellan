/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import type { Configuration } from "./Configuration";
import { applyExecutionContext, getConfiguration, initProjectConfiguration } from "./configuration-repository";
import type { Context } from "./Context";
import { addNamespace, addNamespaceIfAbsent, addTransport, addTransportIfAbsent, resolveNamespace, setNamespace, setTransport } from "./namespace";
import type { ResolvedNamespace } from "./ResolvedNamespace";

export type { Configuration, Context, ResolvedNamespace };
export {
    applyExecutionContext,
    getConfiguration,
    initProjectConfiguration,
    addNamespace,
    addNamespaceIfAbsent,
    addTransport,
    addTransportIfAbsent,
    resolveNamespace,
    setNamespace,
    setTransport,
};
