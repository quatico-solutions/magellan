// This file contains server code that can be executed on the server.

import { type Context, type Serialization } from "@quatico/magellan-shared";

// By default, this snippet is executed in the browser (i.e. the code is included in the client bundle and imported as a regular function).
// However, when Magellan is enabled, the code can executed on the server.
// In order for Magellan to know that this code can be executed on the server, it must be annotated with a comment // @service() decorator.

// @service()
export const greetMe = async (name: string, _context?: Context, _serialization?: Serialization): Promise<string> => {
    // This code must be executed on the server. In the browser, accessing process.arch causes an error.
    return `Hello ${name}! I'm Magellan running on "${typeof window === "undefined" ? `${process.arch}" server` : "browser"}!`;
};
