/* eslint-disable no-var */
import { DependencyContext } from "../src/services";
import { Configuration } from "../src";

export {};

declare global {
    var __qsMagellanServerConfig__: Configuration;
    var __qsMagellanDI__: DependencyContext;
}