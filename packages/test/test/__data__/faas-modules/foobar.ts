import { type Context, type Serialization } from "@quatico/magellan-shared";

// @service()
export const foobar = async (_: never, context?: Context, serialization?: Serialization) => {
    throw new Error("This should have been replaced");
};
