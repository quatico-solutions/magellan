import { TransportFunction } from "./TransportFunction";

export type TransportHandler = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (func: TransportFunction, ctx: any): Promise<string>;
};
