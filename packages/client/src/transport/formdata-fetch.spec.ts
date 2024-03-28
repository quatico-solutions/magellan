import { formdataFetch } from "./formdata-fetch";
import { TransportFunction } from "@quatico/magellan-shared";

describe("formdataFetch", () => {
    it("calls fetch once using POST and endpoint with valid transport function", async () => {
        const validTransportFn = { name: "whatever", namespace: "whatever", endpoint: "/expected", payload: "whatever" };
        globalThis.fetch = jest.fn().mockReturnValue({
            ok: true,
            text: () => "whatever",
        });

        await formdataFetch(validTransportFn, { headers: {} });

        expect(globalThis.fetch).toHaveBeenCalledWith("/expected", expect.objectContaining({ method: "POST" }));
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it("yields payload as data property with valid transport function", async () => {
        const validTransportFn = {
            name: "whatever",
            namespace: "whatever",
            endpoint: "/whatever",
            payload: JSON.stringify({ expected: "value" }),
        };
        globalThis.fetch = jest.fn().mockReturnValue({
            ok: true,
            text: () => "whatever",
        });

        await formdataFetch(validTransportFn, { headers: {} });

        const target = Object.fromEntries((globalThis.fetch as jest.Mock).mock.calls[0][1].body.entries());

        expect(target).toStrictEqual(expect.objectContaining({ data: '{"expected":"value"}' }));
    });

    it("rejects promise without name in transport function", async () => {
        const invalidTransportFn = {
            namespace: "whatever",
            endpoint: "/whatever",
            payload: "whatever",
        } as TransportFunction;

        const actual = formdataFetch(invalidTransportFn, { headers: {} });

        expect(actual).rejects.toThrow('Cannot invoke remote function without "name" property.');
    });

    it("rejects promise with fetch causing an error", async () => {
        const validTransportFn = { name: "whatever", namespace: "whatever", endpoint: "/whatever", payload: "whatever" };
        globalThis.fetch = jest.fn().mockImplementation(() => {
            throw Error("Expected Error Message");
        });

        const actual = formdataFetch(validTransportFn, { headers: {} });

        expect(actual).rejects.toThrow("Expected Error Message");
    });

    it("rejects promise with fetch returning 404 and status message", () => {
        const validTransportFn = { name: "whatever", namespace: "whatever", endpoint: "/whatever", payload: "whatever" };
        globalThis.fetch = jest.fn().mockReturnValue({
            ok: false,
            status: 404,
            statusText: "Expected Status Message",
        });

        const actual = formdataFetch(validTransportFn, { headers: {} });

        expect(actual).rejects.toStrictEqual({
            status: 404,
            message: "Expected Status Message",
        });
    });
});
