import { Context } from "../context";

export class Filter<ContextImpl extends Context> {
    constructor(private _name: string) {}

    public name = () => this._name;

    public async execute(context: ContextImpl, next: () => void) {
        throw new Error("not yet implemented");
    }
}
