// eslint-disable-next-line @typescript-eslint/require-await
export const foobar = async () => {
    throw new Error("This should have been replaced");
};
