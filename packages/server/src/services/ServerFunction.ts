/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import type { Context, Serialization } from "@quatico/magellan-shared";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ServerFunction<I = any, O = any> = (input: I, context?: Context, serialization?: Serialization) => Promise<O | void>;
