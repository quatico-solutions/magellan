/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type ServerFunction<I = any, O = any> = (input: I) => Promise<O | undefined>;
