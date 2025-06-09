type SetFunctions<T> = {
  [P in keyof T as `set${string & P}`]: (callback: (currentValue: T[P]) => T[P]) => void;
};

// exclude properties from our return type, without having to use the Omit utility type
// If we make our new property name never, that property will be removed from the type altogether
type SetFunctionsExceptColor<T> = {
  [P in keyof T as `set${string & Exclude<P, 'color'>}`]: (
    callback: (currentValue: T[P]) => T[P]
  ) => void;
};

// Use string utilities, to map the key
type SetFunctions<T> = {
  [P in keyof T as `set${string & Capitalize<P>}`]: (
    callback: (currentValue: T[P]) => T[P]
  ) => void;
};
