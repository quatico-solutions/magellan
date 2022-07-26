/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import type { Configuration, Context, NamespaceMapping, TransportHandler } from "./configuration";
import {
    addNamespace,
    addNamespaceIfAbsent,
    addTransport,
    addTransportIfAbsent,
    initProjectConfiguration,
    resolveNamespace,
    setNamespace,
    setTransport,
} from "./configuration";
import { serve, ServerOptions } from "./server";
import { externalFunctionInvoke } from "./services";

export type { ServerOptions, Configuration, Context, NamespaceMapping, TransportHandler };
export {
    addNamespace,
    addNamespaceIfAbsent,
    addTransport,
    addTransportIfAbsent,
    externalFunctionInvoke,
    initProjectConfiguration,
    resolveNamespace,
    serve,
    setNamespace,
    setTransport,
};
