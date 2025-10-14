/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { getConfiguration } from "./configuration";
import { setConfiguration } from "./configuration/configuration-repository";
import { getDefaultConfiguration } from "./configuration/default-configuration";
import { type DefaultSdkParameters, Sdk } from "./sdk";
import { FunctionService } from "./services";

afterEach(() => {
    globalThis.functionService = new FunctionService(jest.fn());
});

class TestSdk extends Sdk {
    constructor(defaultParameters?: DefaultSdkParameters) {
        super(defaultParameters);
        setConfiguration(getDefaultConfiguration());
    }

    public getNamespaces() {
        return getConfiguration().namespaces;
    }
    public getTransports() {
        return getConfiguration().transports;
    }
}

describe("invokeFunction", () => {
    it("yields registered function execution w/ registered function", async () => {
        const target = jest.fn().mockImplementation((data, ctx) => {
            return Promise.resolve({ data, ctx });
        });

        const result = await new Sdk().registerFunction("test-fn", target).invokeFunction("test-fn", "whatever");

        expect(target).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
            data: "whatever",
            ctx: { server: {} },
        });
    });

    it("yields registered function execution w/ registered function with context", async () => {
        const target = jest.fn().mockImplementation((data, ctx) => {
            return Promise.resolve({ data, ctx });
        });

        const result = await new Sdk().registerFunction("test-fn-with-context", target).invokeFunction("test-fn-with-context", "data", "default", {
            server: { "mock-header": "mock-value" },
        });

        expect(target).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
            data: "data",
            ctx: { server: { "mock-header": "mock-value" } },
        });
    });
});

describe("setNamespace", () => {
    it("should register namespace w/o existing namespace", () => {
        const testObj = new TestSdk();

        testObj.setNamespace("expected", { endpoint: "/expected", transport: "expected" });

        expect(testObj.getNamespaces()["expected"]).toEqual({ endpoint: "/expected", transport: "expected" });
    });

    it("should replace namespace w/ existing namespace", () => {
        const testObj = new TestSdk();
        testObj.getNamespaces()["expected"] = { endpoint: "/someEndpoint", transport: "unexpectedTransport" };

        testObj.setNamespace("expected", { endpoint: "/expected", transport: "expected" });

        expect(testObj.getNamespaces()["expected"]).toEqual({ endpoint: "/expected", transport: "expected" });
    });
});

describe("setTransport", () => {
    it("should register transport w/o existing transport", () => {
        const testObj = new TestSdk();
        const expected = jest.fn();

        testObj.setTransport("expected", expected);

        expect(testObj.getTransports()["expected"]).toEqual(expected);
    });

    it("should replace transport w/ existing transport", () => {
        const testObj = new TestSdk();
        const expected = jest.fn();
        testObj.getTransports()["expected"] = jest.fn();

        testObj.setTransport("expected", expected);

        expect(testObj.getTransports()["expected"]).toEqual(expected);
    });
});

describe("constructor", () => {
    it("initializes Magellan DI Context w/ execution of constructor", () => {
        const defaultTransportRequest = jest.fn();
        const defaultTransportHandler = jest.fn();
        new Sdk({ defaultTransportHandler, defaultTransportRequest, functionService: new FunctionService(defaultTransportRequest) });

        expect(globalThis.__qsMagellanDI__).toEqual({ defaultTransportRequest, defaultTransportHandler });
    });
});
