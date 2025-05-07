/* eslint-disable no-var */
import type { Configuration } from "../configuration";
import type { DependencyContext } from "../services";
import type { FunctionService } from "../services";

export {};

declare global {
    var __qsMagellanDI__: DependencyContext | undefined;
    var __qsMagellanServerConfig__: Configuration | undefined;
    var functionService: FunctionService | undefined;
}
