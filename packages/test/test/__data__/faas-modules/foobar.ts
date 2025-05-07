import { type Context, type Serialization } from "@quatico/magellan-shared";

// @service()
export const foobar = (_: never, _context?: Context, _serialization?: Serialization) => {
    throw new Error("This should have been replaced");
};
