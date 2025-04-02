/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import type { ClientContext, Context, ServerContext } from "./context";
import { CLIENT_CONTEXT_CHANGED_EVENT_TYPE, ClientContextChangedEvent } from "./context";
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

export {
    assert,
    CLIENT_CONTEXT_CHANGED_EVENT_TYPE,
    ClientContextChangedEvent,
    deserialize,
    packInput,
    packObject,
    serialize,
    serializeError,
    unpackObject,
    unpackPayload,
};
export type {
    ClientContext,
    Context,
    NamespaceMapping,
    RemoteFunction,
    RequestPayload,
    ResponsePayload,
    Serialization,
    ServerContext,
    TransportFunction,
    TransportHandler,
};
