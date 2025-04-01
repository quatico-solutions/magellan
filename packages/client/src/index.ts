/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { remoteInvoke } from "./remote-invoke";
import { Sdk } from "./sdk";
import type { Configuration } from "./transport";
import { initProjectConfiguration, resolveNamespace, setNamespace, setTransport } from "./transport";

export { initProjectConfiguration, remoteInvoke, resolveNamespace, Sdk, setNamespace, setTransport };
export type { Configuration };
