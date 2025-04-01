import { type Context, type Serialization } from "@quatico/magellan-shared";

// @service()
export const echo = async (echo: unknown, context?: Context, serialization?: Serialization) => {
    return echo;
};
