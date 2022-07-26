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
import { FunctionService, ServerFunction } from "./services";

// TODO: Move type declaration to global.d.ts
declare global {
    // eslint-disable-next-line no-var
    var functionService: FunctionService;
}

if (!global.functionService) {
    global.functionService = new FunctionService();
}

export class Sdk {
    constructor(private service: FunctionService = global.functionService) {}

    public registerFunction<I, O>(name: string, fn: ServerFunction<I, O>): this {
        this.service.registerFunction(name, fn);
        return this;
    }

    public invokeFunction<I, O>(name: string, data: I, namespace = "default"): Promise<O> {
        return this.service.invokeFunction({ name, data, namespace });
    }

    public addNamespace(name: string, mapping: NamespaceMapping): this | never {
        addNamespace(name, mapping);
        return this;
    }

    public addNamespaceIfAbsent(name: string, mapping: NamespaceMapping): this | never {
        addNamespaceIfAbsent(name, mapping);
        return this;
    }

    public setNamespace(name: string, mapping: NamespaceMapping): this | never {
        setNamespace(name, mapping);
        return this;
    }

    public addTransport(name: string, transport: TransportHandler): this | never {
        addTransport(name, transport);
        return this;
    }

    public addTransportIfAbsent(name: string, transport: TransportHandler): this | never {
        addTransportIfAbsent(name, transport);
        return this;
    }

    public setTransport(name: string, transport: TransportHandler): this | never {
        setTransport(name, transport);
        return this;
    }
}
