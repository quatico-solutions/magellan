/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { deserialize, unpackObject, unpackPayload } from "./deserialize";
import { packInput, packObject, serialize } from "./serialize";
import type { RemoteFunction, RequestPayload, ResponsePayload, Serialization, TransportFunction } from "./transport";
import { assert } from "./utils";

export type {
    RemoteFunction,
    RequestPayload,
    ResponsePayload,
    Serialization,
    TransportFunction
};
export {
    assert,
    deserialize,
    packInput,
    packObject,
    serialize,
    unpackObject,
    unpackPayload
};
