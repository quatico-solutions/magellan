/* eslint-disable no-var */
import type { Configuration } from "../src";
import type { DependencyContext } from "../src/services";

export { };

declare global {
    var __qsMagellanServerConfig__: Configuration;
    var __qsMagellanDI__: DependencyContext;
}