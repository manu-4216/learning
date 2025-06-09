// annotations on primitive data types
let variableName: string;
let variableName2: number[] = [2];
const constantName3: boolean = true;

// Function type annotation

// A - inline type annotation
let greeting1 = (name: string): string => {
  return `Hi ${name}`;
};

// B - separate annotation
let greeting2: (name: string) => string;

greeting2 = (name) => {
  return `Hi ${name}`;
};

/**
 Primitive types:

- number
- bigint
- string
- boolean
- null
- undefined
- symbol
*/
