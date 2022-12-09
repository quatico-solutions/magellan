/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { ResponsePayload } from "./ResponsePayload";
export interface Serialization {
    deserialize: <O>(json: string) => ResponsePayload<O>;
    serialize: <I>(input: I) => string;
}
