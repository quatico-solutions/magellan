import { type TransportFunction } from "@quatico/magellan-shared";
import { initDependencyContext } from "../services";
import { completeEndpoint, formdataFetch } from "./formdata-fetch";


beforeAll(() => {
    initDependencyContext({ defaultTransportRequest: jest.fn(), defaultTransportHandler: jest.fn() });
});

describe("formdataFetch", () => {
    it("calls fetch once using POST and endpoint with valid transport function", async () => {
        const validTransportFn = { name: "whatever", namespace: "whatever", endpoint: "/expected", payload: "whatever" };
        jest.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, text: () => Promise.resolve("whatever") } as Response);

        await formdataFetch(validTransportFn, { client: { headers: {} } });

        expect(globalThis.fetch).toHaveBeenCalledWith("http://localhost:3000/expected", expect.objectContaining({ method: "POST" }));
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it("yields payload as data property with value transport function", async () => {
        const validTransportFn = {
            name: "name",
            namespace: "namespace",
            endpoint: "/endpoint",
            payload: JSON.stringify({ expected: "value" }),
        };
        jest.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, text: () => Promise.resolve("whatever") } as Response);

        await formdataFetch(validTransportFn, {
            client: { headers: { "token-name": "client-token-value", "x-request-id": "request-id" } },
        });

        const target = globalThis.fetch as jest.Mock;

        const body = Object.fromEntries(target.mock.calls[0][1].body.entries());
        expect(body).toStrictEqual({ data: '{"expected":"value"}', name: "name", namespace: "namespace" });

        const headers = target.mock.calls[0][1].headers;
        expect(headers).toEqual({
            Accept: "application/json",
            "token-name": "client-token-value",
            "x-request-id": "request-id",
        });
    });

    it("rejects promise without name in transport function", async () => {
        const invalidTransportFn = {
            namespace: "whatever",
            endpoint: "/whatever",
            payload: "whatever",
        } as TransportFunction;

        const actual = formdataFetch(invalidTransportFn, { headers: {}, client: { headers: {} } });

        await expect(actual).rejects.toThrow('Cannot invoke remote function without "name" property.');
    });

    it("rejects promise with fetch causing an error", async () => {
        const validTransportFn = { name: "whatever", namespace: "whatever", endpoint: "/whatever", payload: "whatever" };
        jest.spyOn(globalThis, "fetch").mockImplementation(() => {
            throw Error("Expected Error Message");
        });

        const actual = formdataFetch(validTransportFn, { headers: {}, client: { headers: {} } });

        await expect(actual).rejects.toThrow('Cannot invoke remote function: "whatever". Reason: "Error: Expected Error Message".');
    });

    it("rejects promise with fetch returning 404 and status message", async () => {
        const validTransportFn = { name: "whatever", namespace: "whatever", endpoint: "/whatever", payload: "whatever" };
        jest.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false, status: 404, statusText: "Expected Status Message" } as Response);

        const actual = formdataFetch(validTransportFn, { headers: {}, client: { headers: {} } });

        await expect(actual).rejects.toStrictEqual({
            status: 404,
            message: "Expected Status Message",
        });
    });
});

describe("completeEndpoint", () => {
    it("called with endpoint that is a valid absolute url returns expected", () => {
        const actual = completeEndpoint("https://www.valid.url");

        expect(actual).toBe("https://www.valid.url");
    });
    it("called with endpoint that is a relative url with leading slash returns expected", () => {
        const actual = completeEndpoint("/api");

        expect(actual).toBe("http://localhost:3000/api");
    });
    it("called with endpoint that is an invalid absolute url (invalid protocol) throws", () => {
        expect(() => completeEndpoint("hrrps://www.invalid.url")).toThrow("provided endpoint hrrps://www.invalid.url is invalid");
    });
    it("called with endpoint that is an invalid absolute url (no protocol) throws", () => {
        expect(() => completeEndpoint("www.no-protocol.url")).toThrow("provided endpoint www.no-protocol.url is invalid");
    });
    it("called with endpoint that is an invalid absolute url (invalid character) throws", () => {
        expect(() => completeEndpoint("http://www.with space.url")).toThrow("provided endpoint http://www.with space.url is invalid");
    });
    it("called with endpoint that is an invalid absolute url (invalid scheme) throws", () => {
        expect(() => completeEndpoint("ht!ps://www.invalid-scheme.url")).toThrow("provided endpoint ht!ps://www.invalid-scheme.url is invalid");
    });
    it("called with endpoint that is an invalid absolute url (incomplete) throws", () => {
        expect(() => completeEndpoint("https://")).toThrow("provided endpoint https:// is invalid");
    });
    it("called with endpoint that is a relative url without leading slash throws", () => {
        expect(() => completeEndpoint("endpoint/without/leading/slash")).toThrow("provided endpoint endpoint/without/leading/slash is invalid");
    });
});
