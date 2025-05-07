/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { type Context, type RemoteFunction, type Serialization } from "@quatico/magellan-shared";

export type TransportRequest = <O>(func: RemoteFunction, ctx?: Context, serialization?: Serialization) => Promise<O>;
