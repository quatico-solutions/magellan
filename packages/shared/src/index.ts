/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { ExecutionContext } from "./context";
import { deserialize, unpackObject, unpackPayload } from "./deserialize";
import { packInput, packObject, serialize } from "./serialize";
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

export type {
    ExecutionContext,
    NamespaceMapping,
    RemoteFunction,
    RequestPayload,
    ResponsePayload,
    Serialization,
    TransportFunction,
    TransportHandler,
};
export { assert, deserialize, packInput, packObject, serialize, unpackObject, unpackPayload };
