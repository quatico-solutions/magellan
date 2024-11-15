/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import type { Configuration } from "./Configuration";
import { getConfiguration, initProjectConfiguration } from "./configuration-repository";
import { resolveNamespace, setNamespace, setTransport } from "./namespace";
import type { ResolvedNamespace } from "./ResolvedNamespace";

export type { Configuration, ResolvedNamespace };
export { getConfiguration, initProjectConfiguration, setNamespace, setTransport, resolveNamespace };
