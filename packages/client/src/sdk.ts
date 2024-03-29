/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import { NamespaceMapping, TransportHandler } from "@quatico/magellan-shared";
import { addNamespace, addNamespaceIfAbsent, addTransport, addTransportIfAbsent, getConfiguration, setNamespace, setTransport } from "./transport";

export class Sdk {
    public init() {
        // eslint-disable-next-line no-console
        console.info(`Initialize Sdk with configuration: `, getConfiguration());
    }
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
