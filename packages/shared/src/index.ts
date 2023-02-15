/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { deserialize, unpackObject, unpackPayload } from "./deserialize";
import { packInput, packObject, serialize, serializeError } from "./serialize";
import type {
    NamespaceMapping,
    RemoteFunction,
    RequestPayload,
    ResponsePayload,
    Serialization,
    TransportFunction,
    TransportHandler,
} from "./transport";
import { assert } from "./utils";

export * from "./context";
export type { NamespaceMapping, RemoteFunction, RequestPayload, ResponsePayload, Serialization, TransportFunction, TransportHandler };
export { assert, deserialize, packInput, packObject, serialize, unpackObject, unpackPayload, serializeError };
