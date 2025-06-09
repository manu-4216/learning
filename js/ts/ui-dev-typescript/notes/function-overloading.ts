// Function overloading

function stringOrArrayLength(input) {
  return input.length;
}

// Intention: warn if this function is called with something different than a string or an array
stringOrArrayLength('Abc');
stringOrArrayLength([1, 2, 3]);
stringOrArrayLength({ length: 3 });

// Solution 1: use union:
function stringOrArrayLength(input: string | unknown[]): number {
  return input.length;
}

// Solution 2: use function overloading (write function definition above the implementation)
function stringOrArrayLength(input: string): number;
function stringOrArrayLength(input: unknown[]): number;
function stringOrArrayLength(input: { length: number }) {
  return input.length;
}
// this also works, since the overload signature will be checked
function stringOrArrayLength(input: any) {
  return input.length;
}
