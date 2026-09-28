export function arraysEqual<T>(a: T[] | undefined, b: T[] | undefined) {
  return (
    a === b ||
    (a !== undefined &&
      b !== undefined &&
      a.length === b.length &&
      a.every((value, index) => value === b[index]))
  );
}
