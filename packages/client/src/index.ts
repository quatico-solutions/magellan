/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { ClientContextHandler } from "./context/ClientContextHandler";
import { remoteInvoke } from "./remote-invoke";
import type { Configuration } from "./transport";
import { initProjectConfiguration, resolveNamespace, setNamespace, setTransport } from "./transport";

export { ClientContextHandler, initProjectConfiguration, remoteInvoke, resolveNamespace, setNamespace, setTransport };
export type { Configuration };
