/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { deserialize, serialize } from "@quatico/magellan-shared";
import { remoteInvoke } from "./remote-invoke";

export { addNamespace, addTransport, initProjectConfiguration, resolveNamespace } from "./configuration";
export type { Configuration, Context, NamespaceMapping, TransportHandler } from "./configuration";
export { deserialize, remoteInvoke, serialize };
