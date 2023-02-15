import { Context } from "../context";
import { Filter } from "./Filter";

export class FilterChain<ContextImpl extends Context> {
    private filters: Filter<ContextImpl>[] = [];
    private iterator: IterableIterator<[number, Filter<ContextImpl>]> | undefined;

    public registerFilter(filter: Filter<ContextImpl>, index: number) {
        if (this.isRegisteredFilter(filter)) {
            throw new Error(`Filter ${filter.name} was already registered.`);
        }
        if (index < 0) {
            throw new Error(`Index ${index}<0 is not valid.`);
        }
        if (index > this.filters.length - 1) {
            throw new Error(`Index ${index} is larger than length of filters ${this.filters.length}.`);
        }

        this.filters = [...this.filters.slice(0, index - 1), filter, ...this.filters.slice(index)];
    }

    public appendFilter(filter: Filter<ContextImpl>) {
        if (this.isRegisteredFilter(filter)) {
            throw new Error(`Filter ${filter.name} was already registered.`);
        }
        this.filters.push(filter);
    }

    private isRegisteredFilter(filter: Filter<ContextImpl>): boolean {
        return !this.filters.some(cur => cur.name === filter.name);
    }

    public executeFilters() {
        if (this.iterator) {
            throw new Error("FilterChain.executeFilters: Filters are already being executed.");
        }
        if (this.filters.length < 1) {
            return;
        }

        const ctx: Context = {
            req: {},
            res: {},
            data: {},
            fn: <I>(i: I, ctx: Context): Promise<any> => Promise.resolve(),
        };
        this.iterator = this.filters.entries();
        this.next(ctx);
    }

    private next(ctx: Context) {
        const next = this.iterator?.next()?.value;
        if (next) {
            next.execute(ctx, () => this.next(ctx));
        } else {
            this.iterator = undefined;
        }
    }
}
