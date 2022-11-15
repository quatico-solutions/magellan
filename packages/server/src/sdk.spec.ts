/*
 * ---------------------------------------------------------------------------------------------
 *   Copyright (c) Quatico Solutions AG. All rights reserved.
 *   Licensed under the MIT License. See LICENSE in the project root for license information.
 * ---------------------------------------------------------------------------------------------
 */
import { getConfiguration } from "./configuration";
import { setConfiguration } from "./configuration/configuration-repository";
import { getDefaultConfiguration } from "./configuration/default-configuration";
import { DefaultSdkParameters, Sdk } from "./sdk";
import { FunctionService } from "./services";

afterEach(() => {
    global.functionService = new FunctionService(jest.fn());
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
        const target = jest.fn();

        await new Sdk().registerFunction("test", target).invokeFunction("test", "whatever");

        expect(target).toHaveBeenCalledTimes(1);
    });

    // TODO: This assumption no longer holds until a full function registration with name and namespace becomes available across frontend, node and java
    //          both for manually and automatically registered functions!
    it.skip("throws an error when invoking a function w/o registering the function", async () => {
        expect(() => new Sdk().invokeFunction("test", "whatever")).toThrow(new Error('Cannot invoke function "test". Function is not registered.'));
    });
});

describe("addNamespace", () => {
    it("should register namespace w/ non existing namespace", () => {
        const testObj = new TestSdk();

        testObj.addNamespace("expected", { endpoint: "/expected", transport: "expected" });

        expect(testObj.getNamespaces()["expected"]).toEqual({ endpoint: "/expected", transport: "expected" });
    });

    it("throws error w/ existing namespace", () => {
        const testObj = new TestSdk();
        testObj.addNamespace("expected", { endpoint: "/expected", transport: "expected" });

        expect(() => testObj.addNamespace("expected", { endpoint: "/expected", transport: "expected" })).toThrow(
            `Namespace "expected" already registered.`
        );
    });
});

describe("addNamespaceIfAbsent", () => {
    it("should register namespace w/ non existing namespace", () => {
        const testObj = new TestSdk();
        const expected = { endpoint: "/expected", transport: "expected" };

        testObj.addNamespaceIfAbsent("expected", expected);

        expect(testObj.getNamespaces()["expected"]).toEqual(expected);
    });

    it("should not alter original namespace w/ existing namespace", () => {
        const testObj = new TestSdk();
        const expected = { endpoint: "/expected", transport: "expected" };
        testObj.addNamespaceIfAbsent("expected", expected);

        testObj.addNamespaceIfAbsent("expected", {} as any);

        expect(testObj.getNamespaces()["expected"]).toEqual(expected);
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
        testObj.addNamespace("expected", { endpoint: "/someEndpoint", transport: "unexpectedTransport" });

        testObj.setNamespace("expected", { endpoint: "/expected", transport: "expected" });

        expect(testObj.getNamespaces()["expected"]).toEqual({ endpoint: "/expected", transport: "expected" });
    });
});

describe("addTransport", () => {
    it("should register transport w/ non existing transport", () => {
        const testObj = new TestSdk();
        const expected = jest.fn();

        testObj.addTransport("expected", expected);

        expect(testObj.getTransports()["expected"]).toEqual(expected);
    });

    it("throws error w/ existing transport", () => {
        const testObj = new TestSdk();
        testObj.addTransport("expected", jest.fn());

        expect(() => testObj.addTransport("expected", jest.fn())).toThrow(`Transport "expected" already registered.`);
    });
});

describe("addTransportIfAbsent", () => {
    it("should register transport w/ non existing transport", () => {
        const testObj = new TestSdk();
        const expected = jest.fn();

        testObj.addTransportIfAbsent("expected", expected);

        expect(testObj.getTransports()["expected"]).toEqual(expected);
    });

    it("should not alter original transport w/ existing transport", () => {
        const testObj = new TestSdk();
        const expected = jest.fn();
        testObj.addTransportIfAbsent("expected", expected);

        testObj.addTransportIfAbsent("expected", jest.fn());

        expect(testObj.getTransports()["expected"]).toEqual(expected);
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
        testObj.addTransport("expected", jest.fn());

        testObj.setTransport("expected", expected);

        expect(testObj.getTransports()["expected"]).toEqual(expected);
    });
});

describe("constructor", () => {
    it("initializes Magellan DI Context w/ execution of constructor", async () => {
        const defaultTransportRequest = jest.fn();
        const defaultTransportHandler = jest.fn();
        await new Sdk({ defaultTransportHandler, defaultTransportRequest, functionService: new FunctionService(defaultTransportRequest) });

        expect(global.__qsMagellanDI__).toEqual({ defaultTransportRequest, defaultTransportHandler });
    });
});
