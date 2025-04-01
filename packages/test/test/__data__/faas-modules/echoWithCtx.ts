import { type Context, type Serialization } from "@quatico/magellan-shared";

interface EchoWithCtxInput {
    echo: string;
}

interface EchoWithCtxOutput {
    echo: string;
    requestId: string;
}

// @service()
export const echoWithCtx = async (obj: EchoWithCtxInput, context?: Context, serialization?: Serialization): Promise<EchoWithCtxOutput> => {
    const serverContext = (context?.server ?? {}) as Required<Context["server"]>;
    return Promise.resolve({ echo: obj.echo, requestId: serverContext?.["x-request-id"] ?? "unknown" });
};
