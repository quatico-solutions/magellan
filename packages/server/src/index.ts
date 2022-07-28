/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import type { NamespaceMapping, TransportHandler } from "@quatico/magellan-shared";
import type { Configuration, Context } from "./configuration";
import {
    addNamespace,
    addNamespaceIfAbsent,
    addTransport,
    addTransportIfAbsent,
    applyExecutionContext,
    initProjectConfiguration,
    resolveNamespace,
    setNamespace,
    setTransport,
} from "./configuration";
import { serve, ServerOptions } from "./server";
import { externalFunctionInvoke, getFunctionService } from "./services";

export type { ServerOptions, Configuration, Context, NamespaceMapping, TransportHandler };
export {
    addNamespace,
    addNamespaceIfAbsent,
    addTransport,
    addTransportIfAbsent,
    applyExecutionContext,
    externalFunctionInvoke,
    getFunctionService,
    initProjectConfiguration,
    resolveNamespace,
    serve,
    setNamespace,
    setTransport,
};
