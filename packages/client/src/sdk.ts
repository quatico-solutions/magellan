/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import {
    addNamespace,
    addNamespaceIfAbsent,
    addTransport,
    addTransportIfAbsent,
    NamespaceMapping,
    setNamespace,
    setTransport,
    TransportHandler,
} from "./configuration";

export class Sdk {
    public addNamespace(name: string, mapping: NamespaceMapping): this | never {
        addNamespace(name, mapping);
        return this;
    }
    public addNamespaceIfAbsent(name: string, mapping: NamespaceMapping): this {
        addNamespaceIfAbsent(name, mapping);
        return this;
    }
    public setNamespace(name: string, mapping: NamespaceMapping): this {
        setNamespace(name, mapping);
        return this;
    }

    public addTransport(name: string, transport: TransportHandler): this | never {
        addTransport(name, transport);
        return this;
    }

    public addTransportIfAbsent(name: string, transport: TransportHandler): this {
        addTransportIfAbsent(name, transport);
        return this;
    }

    public setTransport(name: string, transport: TransportHandler): this {
        setTransport(name, transport);
        return this;
    }
}
