import type { Context, Serialization } from "@quatico/magellan-shared";

export type ServiceFunction = (input: never, _context?: Context, _serialization?: Serialization) => Promise<unknown>;
