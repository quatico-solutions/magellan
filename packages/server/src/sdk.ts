/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */

import type { ExecutionContext, NamespaceMapping, TransportHandler } from "@quatico/magellan-shared";
import { TransportRequest } from "./api";
import {
    addNamespace,
    addNamespaceIfAbsent,
    addTransport,
    addTransportIfAbsent,
    applyExecutionContext,
    setNamespace,
    setTransport
} from "./configuration";
import { FunctionService, getFunctionService, initDependencyContext, ServerFunction } from "./services";
import { formdataFetch, transportRequest } from "./transport";


export type DefaultSdkParameters = {
    functionService?: FunctionService;
    defaultTransportRequest?: TransportRequest;
    defaultTransportHandler?: TransportHandler;
};

export class Sdk {
    private service: FunctionService;

    constructor(defaultParameters?: DefaultSdkParameters) {
        const {
            defaultTransportRequest = transportRequest,
            defaultTransportHandler = formdataFetch,
            functionService: service = getFunctionService(defaultTransportRequest),
        } = defaultParameters ?? {};
        initDependencyContext({ defaultTransportRequest, defaultTransportHandler });
        this.service = service;
    }

    public registerFunction<I, O>(name: string, fn: ServerFunction<I, O>): this {
        this.service.registerFunction(name, fn);
        return this;
    }

    public applyExecutionContext(context: Partial<ExecutionContext>): this {
        applyExecutionContext(context);
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
