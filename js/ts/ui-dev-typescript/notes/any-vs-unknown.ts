// Prefer unknown over any and use type narrowing to determine a more accurate type.

const unknownString: unknown = 'What am I?';
let stringValue: string = unknownString; // Type Error: Type 'unknown' is not assignable to type 'string'.

const unknownNumber: unknown = 27;
let theAnswer = 15 + unknownNumber; // Type Error: Operator '+' cannot be

// How is this even helpful? It might give us some type guarantees, but it also
// means we can't do anything with our values. Fortunately, we can convince
// TypeScript that an unknown or any value actually has a more specific type by
// using a process called type narrowing. This involves doing runtime checks
// which either prove that a value is a specific type or prove that it is not a
// specific type.

const unknownNumber2: unknown = 27;

let theAnswer2: number = 0;
if (typeof unknownNumber2 === 'number') {
  theAnswer = 15 + unknownNumber2;
}
