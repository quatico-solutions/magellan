 
import type { Configuration } from "../configuration";
import type { DependencyContext , FunctionService } from "../services";

export {};

declare global {
    var __qsMagellanDI__: DependencyContext | undefined;
    var __qsMagellanServerConfig__: Configuration | undefined;
    var functionService: FunctionService | undefined;
}
