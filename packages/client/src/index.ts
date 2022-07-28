/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import type { NamespaceMapping, TransportHandler } from "@quatico/magellan-shared";
import { deserialize, serialize } from "@quatico/magellan-shared";
import type { Configuration, Context } from "./configuration";
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
import { remoteInvoke } from "./remote-invoke";
import { Sdk } from "./sdk";

export {
    addNamespace,
    addNamespaceIfAbsent,
    addTransport,
    addTransportIfAbsent,
    deserialize,
    initProjectConfiguration,
    remoteInvoke,
    resolveNamespace,
    Sdk,
    serialize,
    setNamespace,
    setTransport,
};
export type { Configuration, Context, NamespaceMapping, TransportHandler };
