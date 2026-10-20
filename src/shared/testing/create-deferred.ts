export function createDeferred<T = void>() {
  let resolvePromise!: (value: T) => void;

  const promise = new Promise<T>(resolve => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: resolvePromise,
  };
}
