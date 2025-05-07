import { type Context, type Serialization } from "@quatico/magellan-shared";

// @service()
export const echo = (echo: unknown, _context?: Context, _serialization?: Serialization) => {
    return echo;
};
