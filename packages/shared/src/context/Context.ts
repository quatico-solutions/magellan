// Defines the base context used on client and server to correspondingly map them into the @service functions.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
// TODO: This is obviously not what we intend so we need to define this in a better way

export interface Context {
    req: unknown;
    res: unknown;
    data: Record<string | symbol, unknown>;
    fn: <I, O>(input: I, ctx: Context) => Promise<O>;
    fnData: { name: string; namespace: string; data: unknown };
}