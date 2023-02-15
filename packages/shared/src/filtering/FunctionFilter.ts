import { getFunctionService } from "@quatico/magellan-server";
import { getDependencyContext } from "@quatico/magellan-server/lib/services";
import { Context } from "../context";
import { Filter } from "./Filter";

export class FunctionFilter extends Filter<Context> {
    constructor() {
        super("MglnFunctionFilter");
        // TODO: Construct or get the function service
    }

    public async execute(context: Context, next: () => void) {
        // TODO: How do I provide the information back to all the filters that executed next and then expect to get the data back on RES somehow?
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const response = await getFunctionService(getDependencyContext().defaultTransportRequest).invokeFunction(context.fnData);
    }
}
